import { io } from "socket.io-client"

const EXECUTION_ENGINE_BASE_URL =
  (import.meta.env.VITE_EXECUTION_ENGINE_URL || "http://localhost:8080").replace(/\/$/, "")

export interface ExecutionRequest {
  src: string
  stdin: string
  lang: "python3" | "cpp" | "c" | "java" | "openJDK-8"
  timeout: number
}

export interface ExecutionResult {
  output: string
  status: string
  stderr?: string
  submission_id?: string
  artifacts?: ExecutionArtifact[]
}

export interface ExecutionArtifact {
  path: string
  content: string
  encoding: "utf8" | "base64"
  mimeType?: string
}

type WaitForExecutionOptions = {
  timeoutMs?: number
}

type ParsedResultUrl = {
  origin: string
  submissionId: string
}

const normalizeResultUrl = (rawUrl: string) => {
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl
  }

  if (rawUrl.startsWith("/")) {
    return `${EXECUTION_ENGINE_BASE_URL}${rawUrl}`
  }

  return `${EXECUTION_ENGINE_BASE_URL}/${rawUrl}`
}

export const submitExecution = async (payload: ExecutionRequest): Promise<string> => {
  const response = await fetch(`${EXECUTION_ENGINE_BASE_URL}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Execution submit failed with status ${response.status}`)
  }

  const resultUrl = (await response.text()).trim()
  if (!resultUrl) {
    throw new Error("Execution submit did not return a result URL")
  }

  return normalizeResultUrl(resultUrl)
}

const parseResultUrl = (resultUrl: string): ParsedResultUrl | null => {
  try {
    const parsed = new URL(resultUrl)
    const parts = parsed.pathname.split("/").filter(Boolean)
    const submissionId = parts.at(-1)
    if (!submissionId) {
      return null
    }

    return {
      origin: parsed.origin,
      submissionId,
    }
  } catch {
    return null
  }
}

const fetchResultOnce = async (resultUrl: string): Promise<ExecutionResult | null> => {
  try {
    const response = await fetch(resultUrl, { method: "GET" })
    if (!response.ok && response.status !== 202) {
      return null
    }

    const data = (await response.json()) as ExecutionResult | { status?: string }
    const status = (data.status || "").toLowerCase()
    if (status === "queued" || status === "processing") {
      return null
    }

    return data as ExecutionResult
  } catch {
    return null
  }
}

export const waitForExecutionResult = async (
  resultUrl: string,
  options?: WaitForExecutionOptions
): Promise<ExecutionResult> => {
  const parsedResult = parseResultUrl(resultUrl)
  if (!parsedResult) {
    throw new Error("Could not extract submission id from execution result URL")
  }

  const { origin, submissionId } = parsedResult
  const timeoutMs = options?.timeoutMs ?? 60_000

  return new Promise<ExecutionResult>((resolve, reject) => {
    const socket = io(origin, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10_000,
      autoConnect: false,
    })

    let isSettled = false
    let lastConnectErrorMessage: string | null = null

    const cleanup = () => {
      socket.off("connect", handleConnect)
      socket.off("execution_result", handleExecutionResult)
      socket.off("connect_error", handleConnectError)
      socket.disconnect()
    }

    const finish = (cb: () => void) => {
      if (isSettled) return
      isSettled = true
      window.clearTimeout(timeoutHandle)
      cleanup()
      cb()
    }

    const handleConnect = () => {
      socket.emit("join_submission", submissionId)
    }

    const handleExecutionResult = (result: ExecutionResult) => {
      if (!result || typeof result !== "object") {
        return
      }

      if (result.submission_id && result.submission_id !== submissionId) {
        return
      }

      finish(() => resolve(result))
    }

    const handleConnectError = (error: unknown) => {
      if (error instanceof Error && error.message) {
        lastConnectErrorMessage = error.message
        return
      }

      lastConnectErrorMessage = "Socket connection failed"
    }

    const timeoutHandle = window.setTimeout(async () => {
      const fallbackResult = await fetchResultOnce(resultUrl)
      if (fallbackResult) {
        finish(() => resolve(fallbackResult))
        return
      }

      const reason = lastConnectErrorMessage
        ? `Failed to connect to execution stream: ${lastConnectErrorMessage}`
        : "Execution timed out while waiting for socket result"
      finish(() => reject(new Error(reason)))
    }, timeoutMs)

    socket.on("connect", handleConnect)
    socket.on("execution_result", handleExecutionResult)
    socket.on("connect_error", handleConnectError)
    socket.connect()
  })
}