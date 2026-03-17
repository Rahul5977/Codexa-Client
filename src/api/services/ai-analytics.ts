import { apiClient } from '../client'
const ANALYTICS_BASE_URL =
  import.meta.env.VITE_AI_ANALYTICS_SERVICE_URL || 'http://localhost:3005/api/analytics'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface AIAnalysisReport {
  submissionId: string
  timeComplexity: string
  spaceComplexity: string
  algorithmExplanation: string
  possibleOptimizations: string[]
  codeQualityFeedback: string[]
  edgeCasesAndBugs: string[]
  summary: string
  executionTimeMs: number
  memoryKb: number
  language: string
  status: string
  generatedAt: string
  cached: boolean
}

export interface CustomAIAnalysisInput {
  code: string
  language: string
  status?: string
  executionTimeMs?: number
  memoryKb?: number
  problemTitle?: string
  difficulty?: string
}

// ------------------------------------------------------------------
// API Functions
// ------------------------------------------------------------------

/**
 * Fetch (or generate) the AI analysis report for a given submission.
 * Uses a 90s timeout because Gemini can take 10–30 seconds to respond.
 * Pass an AbortSignal to cancel on component unmount.
 */
export const getAIAnalysis = async (
  submissionId: string,
  signal?: AbortSignal
): Promise<AIAnalysisReport> => {
  const controller = new AbortController()
  // Forward the external signal into our controller
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }
  const timeoutId = setTimeout(() => controller.abort(new Error('Request timed out after 90s')), 90000)

  try {
    const res = await fetch(`${ANALYTICS_BASE_URL}/analysis/${submissionId}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('accessToken')
          ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          : {}),
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).error || `HTTP ${res.status}`)
    }

    const body = await res.json()
    if (!body.success || !body.data) {
      throw new Error(body.error || 'Failed to fetch AI analysis')
    }
    return body.data as AIAnalysisReport
  } catch (err: any) {
    // If the internal timeout fired (not an external component-unmount cancel),
    // replace the cryptic "The operation was aborted." with a human-readable message.
    if (err.name === 'AbortError' && !signal?.aborted) {
      throw new Error('Analysis is taking too long (>90s). Gemini may be busy — please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Force-invalidate the cached analysis so it regenerates on next fetch.
 */
export const invalidateAIAnalysis = async (submissionId: string): Promise<void> => {
  await apiClient.delete<void>(`${ANALYTICS_BASE_URL}/analysis/${submissionId}`)
}

/**
 * Generate AI analysis for custom code context (teacher grading flow).
 */
export const generateCustomAIAnalysis = async (
  input: CustomAIAnalysisInput,
  signal?: AbortSignal
): Promise<AIAnalysisReport> => {
  const controller = new AbortController()
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  const timeoutId = setTimeout(() => controller.abort(new Error('Request timed out after 90s')), 90000)

  try {
    const res = await fetch(`${ANALYTICS_BASE_URL}/analysis/custom`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('accessToken')
          ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          : {}),
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).error || `HTTP ${res.status}`)
    }

    const body = await res.json()
    if (!body.success || !body.data) {
      throw new Error(body.error || 'Failed to generate AI analysis')
    }
    return body.data as AIAnalysisReport
  } catch (err: any) {
    if (err.name === 'AbortError' && !signal?.aborted) {
      throw new Error('Analysis is taking too long (>90s). Gemini may be busy — please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
