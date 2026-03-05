import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useProblem } from "@/hooks/api/use-problems"
import { useCodeExecution, useCodeSubmission, useSubmission } from "@/hooks/api/use-submissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ProblemStatement } from "./components/problem-statement"
import { CodeEditor } from "./components/code-editor"
import { TestCases } from "./components/test-cases"
import { SubmissionDetails } from "./components/submission-details"
import { Code2, TestTube, Play, Square, Zap, Plus, FileText, History, ArrowLeft, Save } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { PanelResizeHandle, PanelGroup, Panel } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { assignmentService } from "@/api/services/assignment"

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

export default function CodePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const problemId = searchParams.get('id')
  const assignmentId = searchParams.get('assignment')
  const courseId = searchParams.get('course')
  const { user } = useAuth()
  const { problem, loading: problemLoading, error: problemError } = useProblem(problemId)
  const { executeMultiple: runCodeMultiple, results: runResults, loading: runLoading } = useCodeExecution()
  const { submit: submitCode, submissionId, loading: submitLoading } = useCodeSubmission()
  const { submission, poll: pollSubmission } = useSubmission(submissionId)

  const [activeTab, setActiveTab] = useState("code")
  const [leftPanelSize, setLeftPanelSize] = useState(45)
  const [rightPanelSize, setRightPanelSize] = useState(55)
  const [problemTab, setProblemTab] = useState<"description" | "submissions" | "hints">("description")
  const [solutionSaved, setSolutionSaved] = useState(false)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)

  // State for code and language (persists across tab switches)
  const [code, setCode] = useState("")
  const [languageId, setLanguageId] = useState(71) // Default to Python
  const [savedDraft, setSavedDraft] = useState<{ code: string; languageId: number } | null>(null)

  // Refs for assignment context
  const codeRef = useRef(code)
  const languageRef = useRef(languageId)

  // Check if this is an assignment context
  const isAssignmentContext = Boolean(assignmentId && courseId)

  // Load saved draft for assignment context from API
  useEffect(() => {
    const loadDraft = async () => {
      if (isAssignmentContext && problemId && assignmentId) {
        try {
          const draft = await assignmentService.getDraft(assignmentId, problemId)
          if (draft) {
            setCode(draft.code)
            codeRef.current = draft.code
            setLanguageId(draft.languageId)
            languageRef.current = draft.languageId
            setSavedDraft({ code: draft.code, languageId: draft.languageId })
            setSolutionSaved(true)
          }
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }

    loadDraft()
  }, [isAssignmentContext, assignmentId, problemId])

  // No longer loading initial code from problem codeStubs - users write from scratch
  useEffect(() => {
    // Initialize with empty code when problem changes
    if (problem && !isAssignmentContext && code.trim() === "") {
      setCode("")
      codeRef.current = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, isAssignmentContext])

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      if (isAssignmentContext) {
        // For assignments: if switching to saved language, show saved draft; otherwise clear
        if (savedDraft && languageId === savedDraft.languageId) {
          setCode(savedDraft.code)
          codeRef.current = savedDraft.code
        } else {
          setCode("")
          codeRef.current = ""
        }
      } else {
        // For regular problems: clear code when changing language (unless user has written code)
        if (code.trim() === "") {
          setCode("")
          codeRef.current = ""
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageId, problem?.id, isAssignmentContext])

  // Poll for submission results when a submission is made
  useEffect(() => {
    if (submissionId) {
      let cleanup: (() => void) | undefined

      pollSubmission().then((cleanupFn) => {
        cleanup = cleanupFn
      })

      return () => {
        if (cleanup) cleanup()
      }
    }
  }, [submissionId, pollSubmission])

  // Auto-switch to submissions tab when submission completes
  useEffect(() => {
    if (submission && submission.status !== 'PENDING' && submission.status !== 'PROCESSING') {
      // Submission completed, switch to submissions tab to show results
      setProblemTab("submissions")
      // Also set this submission as selected and switch to details view
      setSelectedSubmissionId(submission.id)
      setActiveTab("submission-details")
    }
  }, [submission])

  // Handle submission click from the submissions list
  const handleSubmissionClick = useCallback((submissionId: string) => {
    setSelectedSubmissionId(submissionId)
    setActiveTab("submission-details")
  }, [])

  const handleRun = useCallback(async () => {
    if (!code || code.trim() === '') {
      toast.error("Please write some code first")
      return
    }

    if (!problem?.examples || problem.examples.length === 0) {
      toast.error("No test cases available for this problem")
      return
    }

    setActiveTab("testcases")
    toast.info(`Running your code against ${problem.examples.length} test case(s)...`)

    try {
      const testCases = problem.examples.map((example) => ({
        input: example.input,
        expectedOutput: example.output
      }))
      await runCodeMultiple(testCases, code, languageId, problemId || '')
      toast.success("Code executed successfully!")
    } catch (error) {
      console.error("Run error:", error)
      toast.error("Failed to run code. Please try again.")
    }
  }, [code, languageId, runCodeMultiple, setActiveTab, problem, problemId])

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error("Please login to submit code")
      return
    }

    if (!problemId) {
      toast.error("No problem selected")
      return
    }

    if (!code || code.trim() === '') {
      toast.error("Please write some code first")
      return
    }

    setActiveTab("testcases")
    toast.info("Submitting your solution...")

    try {
      await submitCode({
        userId: user.id,
        problemId: problemId,
        code: code,
        languageId: languageId
      })
      // Success toast is shown in the hook
    } catch (error) {
      console.error("Submit error:", error)
      // Error toast is shown in the hook
    }
  }, [user, problemId, code, languageId, submitCode, setActiveTab])

  const handleSaveAssignmentSolution = useCallback(async () => {
    if (!isAssignmentContext || !problemId || !assignmentId) return

    try {
      await assignmentService.saveDraft(assignmentId, {
        problemId,
        code: codeRef.current,
        languageId: languageRef.current,
      })

      // Update saved draft state
      setSavedDraft({ code: codeRef.current, languageId: languageRef.current })
      setSolutionSaved(true)
      toast.success("Solution saved successfully")
    } catch (error) {
      console.error('Error saving solution:', error)
      toast.error("Failed to save solution")
    }
  }, [isAssignmentContext, assignmentId, problemId])

  const handleBackToAssignment = useCallback(() => {
    if (assignmentId && courseId) {
      navigate(`/courses/${courseId}/assignments/${assignmentId}`)
    }
  }, [navigate, assignmentId, courseId])

  const handleAddTest = useCallback(() => {
    setActiveTab("testcases")
  }, [])

  // Update code and language state and refs
  const handleCodeChange = useCallback((newCode: string, newLanguageId: number) => {
    setCode(newCode)
    setLanguageId(newLanguageId)
    codeRef.current = newCode
    languageRef.current = newLanguageId

    // Mark solution as not saved when code changes in assignment context
    if (isAssignmentContext && solutionSaved) {
      setSolutionSaved(false)
    }
  }, [isAssignmentContext, solutionSaved])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault()
        if (!runLoading && !submitLoading) {
          handleRun()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!runLoading && !submitLoading) {
          handleSubmit()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runLoading, submitLoading, handleRun, handleSubmit])

  if (!problemId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Problem Selected</h2>
          <p className="text-muted-foreground">Please select a problem from the dashboard to start coding.</p>
        </div>
      </div>
    )
  }

  const isRunning = runLoading || submitLoading

  return (
    <BaseLayout>
      <div className="h-[90vh] flex flex-col overflow-y-auto bg-background m-0">
        <PanelGroup
          direction="horizontal"
          className="h-full gap-3 p-3"
          onLayout={(sizes) => {
            if (sizes[0] !== undefined) setLeftPanelSize(sizes[0])
            if (sizes[1] !== undefined) setRightPanelSize(sizes[1])
          }}
        >
          {/* Left Panel - Problem Statement */}
          <Panel defaultSize={45} minSize={5} maxSize={95} onResize={(size) => setLeftPanelSize(size)}>
            <div className="h-full border rounded-lg border-border/50 flex flex-col bg-linear-to-b from-background to-muted/10 overflow-hidden">
              {leftPanelSize <= 5 ? (
                <div className="h-full flex flex-col items-center justify-start gap-4 py-3">
                  <button
                    onClick={() => setProblemTab("submissions")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      problemTab === "submissions"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <History className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Submissions</span>
                  </button>
                  <button
                    onClick={() => setProblemTab("description")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      problemTab === "description"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Description</span>
                  </button>
                </div>
              ) : (
                <div className="h-full overflow-hidden">
                  <ProblemStatement
                    problem={problem}
                    loading={problemLoading}
                    error={problemError}
                    activeTab={problemTab}
                    onTabChange={setProblemTab}
                    onSubmissionClick={handleSubmissionClick}
                  />
                </div>
              )}
            </div>
          </Panel>

          {/* Resizable Handle */}
          <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/50 active:bg-primary transition-colors rounded-full relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-linear-to-b from-transparent via-primary/30 to-transparent transition-all" />
          </PanelResizeHandle>

          {/* Right Panel - Tabs with Code Editor and Test Cases */}
          <Panel defaultSize={55} minSize={5} maxSize={95} onResize={(size) => setRightPanelSize(size)}>
            <div className="h-full flex flex-col border rounded-lg border-border/50 bg-linear-to-b from-background to-muted/10 overflow-hidden">
              {rightPanelSize <= 5 ? (
                <div className="h-full rotate-180 flex flex-col items-center justify-end gap-4 py-3">
                  <button
                    onClick={() => setActiveTab("testcases")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      activeTab === "testcases"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <TestTube className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Test Cases</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      activeTab === "code"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code2 className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Code Editor</span>
                  </button>
                </div>
              ) : (
                // Normal view with content
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="border-b border-border/50 bg-linear-to-r from-muted/30 to-muted/10 p-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <TabsList className="h-11 bg-transparent border-b-2 border-transparent">
                        <TabsTrigger
                          value="code"
                        >
                          <Code2 className="h-4 w-4" />
                          <span className="font-medium">Code Editor</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="testcases"
                        >
                          <TestTube className="h-4 w-4" />
                          <span className="font-medium">Test Cases</span>
                        </TabsTrigger>
                        {selectedSubmissionId && (
                          <TabsTrigger
                            value="submission-details"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Submission</span>
                          </TabsTrigger>
                        )}
                      </TabsList>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddTest}
                          className="h-8 px-3 text-xs border-border/50 hover:bg-primary/10 hover:border-primary/30"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleRun}
                          disabled={isRunning}
                          className="h-8 px-2 md:px-4 text-xs bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 font-semibold"
                        >
                          {isRunning ? (
                            <>
                              <Square className="h-3.5 w-3.5 md:mr-1.5" />
                              <span className="hidden md:inline">Running...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>

                        {isAssignmentContext ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveAssignmentSolution}
                              variant={solutionSaved ? "secondary" : "default"}
                              className="h-8 px-2 md:px-4 text-xs font-semibold"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleBackToAssignment}
                              variant="outline"
                              className="h-8 px-2 md:px-4 text-xs font-semibold"
                            >
                              <ArrowLeft className="h-3.5 w-3.5 md:mr-1.5" />
                              <span className="hidden md:inline">Back</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={handleSubmit}
                            className="h-8 px-2 md:px-4 text-xs bg-primary text-white shadow-lg shadow-violet-600/20 font-semibold"
                          >
                            <Zap className="h-3.5 w-3.5 md:mr-1.5" />
                            <span className="hidden md:inline">Submit</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <TabsContent value="code" className={cn("flex-1 m-0", rightPanelSize < 40 ? "overflow-auto" : "overflow-hidden")}>
                    <CodeEditor
                      problem={problem}
                      loading={problemLoading}
                      onCodeChange={handleCodeChange}
                      initialCode={code}
                      initialLanguage={LANGUAGE_ID_TO_STUB_KEY[languageId] || "python"}
                    />
                  </TabsContent>

                  <TabsContent value="testcases" className={cn("flex-1 m-0", rightPanelSize < 40 ? "overflow-auto" : "overflow-hidden")}>
                    <TestCases
                      problem={problem}
                      loading={problemLoading}
                      runResults={runResults}
                      submission={submission}
                      isRunning={isRunning}
                    />
                  </TabsContent>

                  <TabsContent value="submission-details" className={cn("flex-1 m-0", rightPanelSize < 40 ? "overflow-auto" : "overflow-hidden")}>
                    <SubmissionDetails submissionId={selectedSubmissionId} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </BaseLayout>
  )
}