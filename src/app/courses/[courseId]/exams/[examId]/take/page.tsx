"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Camera,
  Mic,
  Maximize,
  ShieldAlert,
  Play,
  Save,
} from "lucide-react"
import { assignmentService, type Exam, type ExamSubmission } from "@/api/services/assignment"
import { ProblemStatement } from "@/app/code/components/problem-statement"
import { CodeEditor } from "@/app/code/components/code-editor"
import { TestCases } from "@/app/code/components/test-cases"
import { useCodeExecution } from "@/hooks/api/use-submissions"
import { PanelResizeHandle, PanelGroup, Panel } from "react-resizable-panels"
import { useProctoring } from "@/hooks/use-proctoring"

// Map Judge0 language IDs to code stub keys
const LANGUAGE_ID_TO_STUB_KEY: Record<number, string> = {
  50: "c",
  54: "cpp",
  62: "java",
  63: "javascript",
  71: "python",
  72: "ruby",
  73: "rust",
  74: "typescript",
  78: "kotlin",
  60: "go",
}

export default function TakeExamPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [code, setCode] = useState("")
  const [languageId, setLanguageId] = useState(71) // Default to Python
  const [activeTab, setActiveTab] = useState("code")
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [manuallySaving, setManuallySaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [proctoringReady, setProctoringReady] = useState(false)
  const [showProctoringSetup, setShowProctoringSetup] = useState(false)

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSavedCode = useRef<Record<string, any>>({})
  const videoRef = useRef<HTMLVideoElement>(null)
  const problemCodeCache = useRef<Record<string, { code: string; languageId: number }>>({})
  const currentProblemId = useRef<string | null>(null)
  const isLoadingProblem = useRef(false)

  // Code execution hook
  const { executeMultiple: runCodeMultiple, results: runResults, loading: runLoading } = useCodeExecution()

  // Proctoring hook
  const {
    state: proctoringState,
    requestMediaAccess,
    enterFullscreen,
  } = useProctoring({
    examId,
    enabled: true,
    maxViolations: 5,
    onMaxViolationsReached: () => {
      handleAutoSubmit()
    },
  })

  // Fetch exam and submission on mount
  useEffect(() => {
    fetchExamAndSubmission()
  }, [examId])

  // Countdown timer
  useEffect(() => {
    if (!submission || submission.finishedAt || !exam) return

    const interval = setInterval(() => {
      const submissionEndTime = new Date(
        new Date(submission.startedAt).getTime() + exam.duration * 60000
      )
      const remaining = Math.max(0, submissionEndTime.getTime() - Date.now())
      setTimeRemaining(remaining)

      // Auto-submit when time runs out
      if (remaining <= 0) {
        handleAutoSubmit()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [submission, exam])

  // Auto-save functionality
  useEffect(() => {
    if (!exam || !submission || submission.finishedAt) return

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    // Set new timer for 3 seconds after code change
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave()
    }, 3000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [code, languageId, currentProblemIndex])

  // Load code when problem changes
  useEffect(() => {
    if (!exam || !submission) return

    const problem = exam.problems?.[currentProblemIndex]?.problem
    if (!problem) return

    console.log('[EXAM] Loading problem:', {
      problemId: problem.id,
      currentProblemIndex,
      cacheKeys: Object.keys(problemCodeCache.current)
    })

    // Set loading flag
    isLoadingProblem.current = true

    // Clear auto-save timer when switching problems
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = null
    }
    
    // Update current problem ID ref
    currentProblemId.current = problem.id

    // Priority 1: Check cache first (in-memory, fastest)
    if (problemCodeCache.current[problem.id]) {
      const cached = problemCodeCache.current[problem.id]
      console.log('[EXAM] Loading from cache:', problem.id, cached)
      setCode(cached.code)
      setLanguageId(cached.languageId)
      // Set loading flag to false after a small delay to ensure state has settled
      setTimeout(() => { isLoadingProblem.current = false }, 100)
      return
    }

    // Priority 2: Load saved code from submission (persisted)
    const solutions = submission.solutions as Record<string, any>
    if (solutions[problem.id] && solutions[problem.id].code) {
      const savedSolution = solutions[problem.id]
      const loadedCode = savedSolution.code || ""
      const loadedLanguageId = savedSolution.languageId || 71
      
      console.log('[EXAM] Loading from DB:', problem.id, { codeLength: loadedCode.length })
      setCode(loadedCode)
      setLanguageId(loadedLanguageId)
      
      // Cache it for this session
      problemCodeCache.current[problem.id] = {
        code: loadedCode,
        languageId: loadedLanguageId
      }
      lastSavedCode.current[problem.id] = savedSolution
      
      setTimeout(() => { isLoadingProblem.current = false }, 100)
    } else {
      // Priority 3: No saved solution - load code stub if available
      const stubKey = LANGUAGE_ID_TO_STUB_KEY[71] // Default to Python
      const codeStubs = problem.codeStubs as Record<string, string> | undefined
      const defaultCode = codeStubs?.[stubKey] || ""
      
      console.log('[EXAM] Loading stub/empty:', problem.id, { codeLength: defaultCode.length })
      setCode(defaultCode)
      setLanguageId(71)
      
      // Cache the default
      problemCodeCache.current[problem.id] = {
        code: defaultCode,
        languageId: 71
      }
      
      setTimeout(() => { isLoadingProblem.current = false }, 100)
    }
  }, [currentProblemIndex, exam, submission])

  // Setup proctoring when exam loads
  useEffect(() => {
    if (!exam || !submission || submission.finishedAt || proctoringReady) return
    
    // Show proctoring setup dialog
    setShowProctoringSetup(true)
  }, [exam, submission, proctoringReady])

  // Update video element when media stream is available
  useEffect(() => {
    if (videoRef.current && proctoringState.mediaStream) {
      videoRef.current.srcObject = proctoringState.mediaStream
    }
  }, [proctoringState.mediaStream])

  const handleProctoringSetup = async () => {
    // Request camera and microphone access
    const mediaGranted = await requestMediaAccess()
    if (!mediaGranted) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone access are required to take the exam.",
        variant: "destructive",
      })
      return
    }

    // Enter fullscreen mode
    const fullscreenGranted = await enterFullscreen()
    if (!fullscreenGranted) {
      toast({
        title: "Fullscreen Required",
        description: "Fullscreen mode is required to take the exam.",
        variant: "destructive",
      })
      return
    }

    setProctoringReady(true)
    setShowProctoringSetup(false)
  }

  const fetchExamAndSubmission = async () => {
    try {
      setLoading(true)
      const [examData, submissionData] = await Promise.all([
        assignmentService.getExamById(examId),
        assignmentService.getMyExamSubmission(examId),
      ])

      setExam(examData)
      setSubmission(submissionData)

      if (!submissionData) {
        toast({
          title: "Error",
          description: "You haven't started this exam yet",
          variant: "destructive",
        })
        navigate(`/courses/${courseId}/exams/${examId}`)
        return
      }

      if (submissionData.finishedAt) {
        toast({
          title: "Exam Completed",
          description: "You have already finished this exam",
        })
        navigate(`/courses/${courseId}/exams/${examId}`)
        return
      }

      // Calculate initial time remaining
      const submissionEndTime = new Date(
        new Date(submissionData.startedAt).getTime() + examData.duration * 60000
      )
      const remaining = Math.max(0, submissionEndTime.getTime() - Date.now())
      setTimeRemaining(remaining)

      // Check if time has already expired
      if (remaining <= 0) {
        handleAutoSubmit()
      }
    } catch (error: any) {
      console.error("Error fetching exam:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load exam",
        variant: "destructive",
      })
      navigate(`/courses/${courseId}/exams/${examId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!exam || !submission || submission.finishedAt) return

    const problem = exam.problems?.[currentProblemIndex]?.problem
    if (!problem) return

    // Check if code has changed
    const lastSaved = lastSavedCode.current[problem.id]
    if (lastSaved?.code === code && lastSaved?.languageId === languageId) {
      return // No changes
    }

    try {
      setAutoSaving(true)
      
      // Start with existing saved solutions
      const currentSolutions = { ...(submission.solutions as Record<string, any>) }
      
      console.log('[EXAM] Auto-save starting:', {
        currentProblemId: problem.id,
        cacheKeys: Object.keys(problemCodeCache.current),
        existingSolutionKeys: Object.keys(currentSolutions)
      })
      
      // Merge ALL cached problem solutions (not just current problem)
      // This ensures we save all problems the student has worked on
      Object.keys(problemCodeCache.current).forEach(problemId => {
        const cached = problemCodeCache.current[problemId]
        if (cached && cached.code) {
          currentSolutions[problemId] = {
            code: cached.code,
            language: getLanguageName(cached.languageId),
            languageId: cached.languageId,
          }
        }
      })
      
      // Ensure current problem is included with latest code
      currentSolutions[problem.id] = {
        code,
        language: getLanguageName(languageId),
        languageId,
      }
      
      console.log('[EXAM] Saving solutions:', Object.keys(currentSolutions).map(id => ({
        id,
        codeLength: currentSolutions[id].code?.length || 0
      })))

      await assignmentService.updateExamSubmission(examId, currentSolutions)
      
      // Update last saved for all cached problems
      Object.keys(currentSolutions).forEach(problemId => {
        if (currentSolutions[problemId]) {
          lastSavedCode.current[problemId] = {
            code: currentSolutions[problemId].code,
            languageId: currentSolutions[problemId].languageId
          }
        }
      })
      
      // Update cache
      problemCodeCache.current[problem.id] = { code, languageId }
      
      // Update local submission state
      setSubmission(prev => prev ? { ...prev, solutions: currentSolutions } : null)
    } catch (error: any) {
      console.error("Auto-save failed:", error)
      // Don't show error toast for auto-save failures to avoid disruption
    } finally {
      setAutoSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (!exam || !submission || submission.finishedAt || manuallySaving) return

    const problem = exam.problems?.[currentProblemIndex]?.problem
    if (!problem) return

    try {
      setManuallySaving(true)
      
      // Start with existing saved solutions
      const currentSolutions = { ...(submission.solutions as Record<string, any>) }
      
      // Merge ALL cached problem solutions (not just current problem)
      // This ensures we save all problems the student has worked on
      Object.keys(problemCodeCache.current).forEach(problemId => {
        const cached = problemCodeCache.current[problemId]
        if (cached && cached.code) {
          currentSolutions[problemId] = {
            code: cached.code,
            language: getLanguageName(cached.languageId),
            languageId: cached.languageId,
          }
        }
      })
      
      // Ensure current problem is included with latest code
      currentSolutions[problem.id] = {
        code,
        language: getLanguageName(languageId),
        languageId,
      }

      await assignmentService.updateExamSubmission(examId, currentSolutions)
      
      // Update last saved for all cached problems
      Object.keys(currentSolutions).forEach(problemId => {
        if (currentSolutions[problemId]) {
          lastSavedCode.current[problemId] = {
            code: currentSolutions[problemId].code,
            languageId: currentSolutions[problemId].languageId
          }
        }
      })
      
      // Update cache
      problemCodeCache.current[problem.id] = { code, languageId }
      
      // Update local submission state
      setSubmission(prev => prev ? { ...prev, solutions: currentSolutions } : null)
      
      toast({
        title: "Saved",
        description: "Your solution has been saved successfully",
      })
    } catch (error: any) {
      console.error("Manual save failed:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save solution",
        variant: "destructive",
      })
    } finally {
      setManuallySaving(false)
    }
  }

  const handleProblemSwitch = (newIndex: number) => {
    if (!exam) return
    
    console.log('[EXAM] Switching problem:', {
      from: currentProblemIndex,
      to: newIndex,
      currentCode: code.substring(0, 50) + '...',
      cacheKeys: Object.keys(problemCodeCache.current)
    })
    
    // Save current problem's code to cache before switching
    const currentProblem = exam.problems?.[currentProblemIndex]?.problem
    if (currentProblem) {
      problemCodeCache.current[currentProblem.id] = {
        code,
        languageId
      }
      console.log('[EXAM] Saved to cache before switch:', currentProblem.id)
    }
    
    // Switch to new problem
    setCurrentProblemIndex(newIndex)
  }

  const handleAutoSubmit = async () => {
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      await assignmentService.finishExam(examId)
      
      toast({
        title: "Time's Up!",
        description: "Your exam has been automatically submitted",
      })
      
      navigate(`/courses/${courseId}/exams/${examId}`)
    } catch (error: any) {
      console.error("Auto-submit failed:", error)
      toast({
        title: "Error",
        description: "Failed to submit exam automatically",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinishExam = async () => {
    try {
      setIsSubmitting(true)
      
      // Save current code before finishing
      await handleAutoSave()
      
      await assignmentService.finishExam(examId)
      
      toast({
        title: "Success",
        description: "Your exam has been submitted successfully",
      })
      
      navigate(`/courses/${courseId}/exams/${examId}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to submit exam",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowFinishDialog(false)
    }
  }

  const handleRunCode = async () => {
    if (!exam || runLoading) return

    const problem = exam.problems?.[currentProblemIndex]?.problem
    if (!problem || !problem.testcases || !Array.isArray(problem.testcases)) {
      toast({
        title: "Error",
        description: "No test cases available for this problem",
        variant: "destructive",
      })
      return
    }

    try {
      const testCasesArray = problem.testcases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.output || tc.expectedOutput
      }))

      await runCodeMultiple(
        testCasesArray,
        code,
        languageId,
        problem.id
      )
      
      // Switch to test cases tab after running
      setActiveTab("testcases")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to run code",
        variant: "destructive",
      })
    }
  }

  const getLanguageName = (langId: number): string => {
    const map: Record<number, string> = {
      50: "c",
      54: "cpp",
      62: "java",
      63: "javascript",
      71: "python",
      72: "ruby",
      73: "rust",
      74: "typescript",
      78: "kotlin",
      60: "go",
    }
    return map[langId] || "python"
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeColor = (): string => {
    const minutesLeft = timeRemaining / 60000
    if (minutesLeft <= 5) return "text-red-600"
    if (minutesLeft <= 15) return "text-amber-600"
    return "text-green-600"
  }

  const getProgressPercentage = (): number => {
    if (!exam) return 0
    const totalProblems = exam.problems?.length || 0
    if (totalProblems === 0) return 0

    const solutions = submission?.solutions as Record<string, any> || {}
    const solvedCount = Object.keys(solutions).filter(
      problemId => solutions[problemId]?.code && solutions[problemId].code.trim() !== ""
    ).length

    return (solvedCount / totalProblems) * 100
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading exam...</span>
        </div>
      </div>
    )
  }

  if (!exam || !submission) {
    return null
  }

  const currentProblem = exam.problems?.[currentProblemIndex]
  const totalProblems = exam.problems?.length || 0

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar - Timer and Controls */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{exam.title}</h1>
            <Badge variant="outline">
              Problem {currentProblemIndex + 1} of {totalProblems}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <div className="w-32">
                <Progress value={getProgressPercentage()} />
              </div>
              <span className="text-sm font-medium">{Math.round(getProgressPercentage())}%</span>
            </div>

            {/* Proctoring Status */}
            <div className="flex items-center gap-2">
              <Badge variant={proctoringState.cameraEnabled ? "default" : "destructive"} className="gap-1">
                <Camera className="h-3 w-3" />
                {proctoringState.cameraEnabled ? "On" : "Off"}
              </Badge>
              <Badge variant={proctoringState.microphoneEnabled ? "default" : "destructive"} className="gap-1">
                <Mic className="h-3 w-3" />
                {proctoringState.microphoneEnabled ? "On" : "Off"}
              </Badge>
              <Badge variant={proctoringState.isFullscreen ? "default" : "destructive"} className="gap-1">
                <Maximize className="h-3 w-3" />
                {proctoringState.isFullscreen ? "FS" : "Exit"}
              </Badge>
              {proctoringState.violationCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  {proctoringState.violationCount} Warning{proctoringState.violationCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Auto-save indicator */}
            {autoSaving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
              <Clock className={`h-5 w-5 ${getTimeColor()}`} />
              <span className={`text-xl font-mono font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Finish Exam Button */}
            <Button
              variant="default"
              onClick={() => setShowFinishDialog(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Finish Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Problem Navigation Bar */}
      <div className="border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleProblemSwitch(Math.max(0, currentProblemIndex - 1))}
              disabled={currentProblemIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleProblemSwitch(Math.min(totalProblems - 1, currentProblemIndex + 1))}
              disabled={currentProblemIndex === totalProblems - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Problem Navigation Pills */}
          <div className="flex gap-2">
            {exam.problems?.map((prob, index) => {
              const problemId = prob?.problem.id
              const solutions = submission.solutions as Record<string, any>
              const savedCode = solutions[problemId]?.code
              const cachedCode = problemCodeCache.current[problemId]?.code
              
              // Problem has code if either saved or cached code exists
              const hasCode = (savedCode && savedCode.trim() !== "") || 
                              (cachedCode && cachedCode.trim() !== "")

              return (
                <button
                  key={index}
                  onClick={() => handleProblemSwitch(index)}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 font-semibold text-sm transition-all ${
                    currentProblemIndex === index
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : hasCode
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {index + 1}
                  {hasCode && currentProblemIndex !== index && (
                    <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Left Panel - Problem Statement */}
            <Panel defaultSize={45} minSize={30}>
              <div className="h-full overflow-y-auto p-4">
                {currentProblem?.problem && (
                  <ProblemStatement
                    problem={currentProblem.problem as any}
                    loading={false}
                    error={null}
                  />
                )}
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />

            {/* Right Panel - Code Editor and Test Cases */}
            <Panel defaultSize={55} minSize={30}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                <div className="border-b px-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleManualSave}
                      disabled={manuallySaving || !code.trim()}
                      size="sm"
                      variant="outline"
                      className="mb-1"
                    >
                      {manuallySaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleRunCode}
                      disabled={runLoading || !code.trim()}
                      size="sm"
                      className="mb-1"
                    >
                      {runLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Run Tests
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <TabsContent value="code" className="flex-1 overflow-hidden m-0 p-0">
                  <CodeEditor
                    key={currentProblem?.problem.id}
                    problem={currentProblem?.problem as any || null}
                    loading={false}
                    onCodeChange={(newCode, langId) => {
                      console.log('[EXAM] onCodeChange called:', {
                        problemId: currentProblemId.current,
                        isLoading: isLoadingProblem.current,
                        codeLength: newCode.length,
                        langId,
                        cacheKeys: Object.keys(problemCodeCache.current)
                      })
                      setCode(newCode)
                      setLanguageId(langId)
                      // Update cache immediately unless we're loading a different problem
                      if (currentProblemId.current && !isLoadingProblem.current) {
                        problemCodeCache.current[currentProblemId.current] = {
                          code: newCode,
                          languageId: langId
                        }
                        console.log('[EXAM] Cache updated for:', currentProblemId.current, 'Cache:', problemCodeCache.current)
                      }
                    }}
                    initialCode={code}
                    initialLanguage={getLanguageName(languageId)}
                    readOnly={false}
                  />
                </TabsContent>

                <TabsContent value="testcases" className="flex-1 overflow-y-auto m-0 p-4">
                  {currentProblem?.problem && (
                    <TestCases
                      teacherTestCases={{
                        testcases: (currentProblem.problem.testcases as any[]) || [],
                        hiddenTestcases: []
                      }}
                      runResults={runResults}
                      submission={null}
                      isRunning={runLoading}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </Panel>
        </PanelGroup>
      </div>

      {/* Finish Exam Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to finish and submit this exam? You cannot make any changes after submission.
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium">Time Remaining:</span>
                  <span className={`text-sm font-bold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium">Problems Attempted:</span>
                  <span className="text-sm font-bold">
                    {Object.keys(submission?.solutions as Record<string, any> || {}).filter(
                      id => (submission?.solutions as any)?.[id]?.code?.trim()
                    ).length} / {totalProblems}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Continue Exam</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishExam}
              disabled={isSubmitting}
              className="bg-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Finish & Submit'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proctoring Setup Dialog */}
      <AlertDialog open={showProctoringSetup} onOpenChange={setShowProctoringSetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proctoring Setup Required</AlertDialogTitle>
            <AlertDialogDescription>
              This exam requires proctoring to ensure academic integrity. Please allow the following permissions:
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Camera Access</div>
                    <div className="text-xs text-muted-foreground">
                      Your camera will be monitored during the exam
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mic className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Microphone Access</div>
                    <div className="text-xs text-muted-foreground">
                      Audio will be recorded for verification
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Maximize className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Fullscreen Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Exam must be taken in fullscreen
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
                  <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-900 dark:text-yellow-100">
                      Anti-Cheating Measures
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      Tab switching and exiting fullscreen will be tracked. After 5 violations, your exam will be auto-submitted.
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate(`/courses/${courseId}/exams/${examId}`)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleProctoringSetup}>
              Enable Proctoring
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Camera Preview (floating) */}
      {proctoringState.mediaStream && (
        <div className="fixed bottom-4 right-4 z-50 overflow-hidden rounded-lg border-2 border-primary shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="h-32 w-40 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-center text-xs text-white">
            Camera Active
          </div>
      </div>
    )}
  </div>
  )
}
