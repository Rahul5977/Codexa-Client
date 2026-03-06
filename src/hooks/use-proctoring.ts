import { useEffect, useRef, useState } from "react"
import { assignmentService } from "@/api/services/assignment"
import { useToast } from "@/hooks/use-toast"

interface ProctoringConfig {
  examId: string
  enabled: boolean
  maxViolations?: number
  onMaxViolationsReached?: () => void
}

interface ProctoringState {
  isFullscreen: boolean
  cameraEnabled: boolean
  microphoneEnabled: boolean
  violationCount: number
  mediaStream: MediaStream | null
}

export function useProctoring(config: ProctoringConfig) {
  const { examId, enabled, maxViolations = 5, onMaxViolationsReached } = config
  const { toast } = useToast()
  
  const [state, setState] = useState<ProctoringState>({
    isFullscreen: false,
    cameraEnabled: false,
    microphoneEnabled: false,
    violationCount: 0,
    mediaStream: null,
  })

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const violationCountRef = useRef(0)

  // Request camera and microphone access
  const requestMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      mediaStreamRef.current = stream
      setState((prev) => ({
        ...prev,
        cameraEnabled: true,
        microphoneEnabled: true,
        mediaStream: stream,
      }))
      return true
    } catch (error) {
      console.error("Failed to access camera/microphone:", error)
      toast({
        title: "Permission Required",
        description: "Please enable camera and microphone access to take the exam.",
        variant: "destructive",
      })
      return false
    }
  }

  // Enter fullscreen mode
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setState((prev) => ({ ...prev, isFullscreen: true }))
      return true
    } catch (error) {
      console.error("Failed to enter fullscreen:", error)
      toast({
        title: "Fullscreen Required",
        description: "Please allow fullscreen mode to take the exam.",
        variant: "destructive",
      })
      return false
    }
  }

  // Log a proctoring violation
  const logViolation = async (type: string, description?: string) => {
    if (!enabled) return

    try {
      const result = await assignmentService.logProctoringViolation(examId, {
        type,
        timestamp: new Date().toISOString(),
        description,
      })
      
      violationCountRef.current = result.violationCount
      setState((prev) => ({ ...prev, violationCount: result.violationCount }))

      // Show warning to student
      toast({
        title: "Proctoring Warning",
        description: `${description || type} (${result.violationCount}/${maxViolations} warnings)`,
        variant: "destructive",
      })

      // Check if max violations reached
      if (result.violationCount >= maxViolations && onMaxViolationsReached) {
        toast({
          title: "Maximum Violations Reached",
          description: "Your exam will be automatically submitted.",
          variant: "destructive",
        })
        onMaxViolationsReached()
      }
    } catch (error) {
      console.error("Failed to log violation:", error)
    }
  }

  // Setup proctoring monitoring
  useEffect(() => {
    if (!enabled) return

    // Monitor tab visibility (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("TAB_SWITCH", "You switched to another tab")
      }
    }

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setState((prev) => ({ ...prev, isFullscreen: isCurrentlyFullscreen }))
      
      if (!isCurrentlyFullscreen && enabled) {
        logViolation("FULLSCREEN_EXIT", "You exited fullscreen mode")
      }
    }

    // Prevent context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent opening developer tools
      if (
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.key === "F12")
      ) {
        e.preventDefault()
        logViolation("DEVTOOLS_ATTEMPT", "Attempted to open developer tools")
      }
      
      // Prevent print
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault()
      }
    }

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, examId])

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    state,
    requestMediaAccess,
    enterFullscreen,
    logViolation,
  }
}
