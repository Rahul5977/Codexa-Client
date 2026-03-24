"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  Code2,
  Save,
  Play,
} from "lucide-react"
import { assignmentService, type Exam, type ExamSubmission } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"
import Editor from "@monaco-editor/react"
import { useTheme } from "@/hooks/use-theme"
import { useCodeExecution } from "@/hooks/api/use-submissions"

// Map Judge0 language IDs to Monaco editor languages
const LANGUAGE_ID_TO_MONACO: Record<number, string> = {
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

// Map Judge0 language IDs to display names
const LANGUAGE_ID_TO_NAME: Record<number, string> = {
  50: "C",
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
  72: "Ruby",
  73: "Rust",
  74: "TypeScript",
  78: "Kotlin",
  60: "Go",
}

// Map language strings to Monaco editor languages
const LANGUAGE_STRING_TO_MONACO: Record<string, string> = {
  "c": "c",
  "cpp": "cpp",
  "java": "java",
  "javascript": "javascript",
  "python": "python",
  "ruby": "ruby",
  "rust": "rust",
  "typescript": "typescript",
  "kotlin": "kotlin",
  "go": "go",
}

// Map language strings to display names
const LANGUAGE_STRING_TO_NAME: Record<string, string> = {
  "c": "C",
  "cpp": "C++",
  "java": "Java",
  "javascript": "JavaScript",
  "python": "Python",
  "ruby": "Ruby",
  "rust": "Rust",
  "typescript": "TypeScript",
  "kotlin": "Kotlin",
  "go": "Go",
}

// Map language strings to Judge0 IDs
const LANGUAGE_STRING_TO_ID: Record<string, number> = {
  "c": 50,
  "cpp": 54,
  "java": 62,
  "javascript": 63,
  "python": 71,
  "ruby": 72,
  "rust": 73,
  "typescript": 74,
  "kotlin": 78,
  "go": 60,
}

export default function ViewExamSubmissionPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { theme } = useTheme()
  const courseId = params.courseId as string
  const examId = params.examId as string
  const submissionId = params.submissionId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [activeTab, setActiveTab] = useState("code")
  const [grade, setGrade] = useState<string>("")
  const [feedback, setFeedback] = useState<string>("")
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark")
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({})
  const [testResultsByProblem, setTestResultsByProblem] = useState<Record<string, any[]>>({})

  // Code execution hook
  const { executeMultiple: runCodeMultiple } = useCodeExecution()

  useEffect(() => {
    if (examId && submissionId) {
      fetchExamAndSubmission()
    }
  }, [examId, submissionId])

  // Update Monaco theme based on system theme
  useEffect(() => {
    const updateEditorTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setEditorTheme(systemPrefersDark ? 'vs-dark' : 'vs')
      } else if (theme === 'dark') {
        setEditorTheme('vs-dark')
      } else {
        setEditorTheme('vs')
      }
    }

    updateEditorTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => updateEditorTheme()
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const fetchExamAndSubmission = async () => {
    try {
      setLoading(true)
      const [examData, submissionsData] = await Promise.all([
        assignmentService.getExamById(examId),
        assignmentService.getExamSubmissions(examId),
      ])

      setExam(examData)
      
      const targetSubmission = submissionsData.find(s => s.id === submissionId)
      if (!targetSubmission) {
        throw new Error("Submission not found")
      }

      const normalizedType = String(examData.type || "").toUpperCase()
      const isIdeExam = normalizedType === "IDE" || (Array.isArray(examData.ideFiles) && examData.ideFiles.length > 0)
      if (isIdeExam) {
        navigate(`/ide?courseId=${courseId}&examId=${examId}&studentId=${targetSubmission.studentId}&viewOnly=true`)
        return
      }
      
      setSubmission(targetSubmission)
      setGrade(targetSubmission.grade?.toString() || "")
      setFeedback(targetSubmission.feedback || "")
    } catch (error: any) {
      console.error("Error fetching exam submission:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load submission",
        variant: "destructive",
      })
      navigate(`/courses/${courseId}/exams/${examId}/submissions`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short" ,
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (startedAt: Date, finishedAt: Date | null) => {
    if (!finishedAt) return "In Progress"
    const duration = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const handleSaveGrade = async () => {
    if (!submission) return

    try {
      setSaving(true)
      
      const gradeNum = grade.trim() === "" ? undefined : parseFloat(grade)
      if (gradeNum !== undefined && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100)) {
        toast({
          title: "Invalid Grade",
          description: "Grade must be a number between 0 and 100",
          variant: "destructive",
        })
        return
      }

      // Call API to update grade and feedback
      // Note: You'll need to add this method to assignmentService
      await assignmentService.updateExamGrade(examId, submission.studentId, {
        grade: gradeNum,
        feedback: feedback.trim() || undefined,
      })

      toast({
        title: "Success",
        description: "Grade and feedback saved successfully",
      })

      // Refresh submission
      await fetchExamAndSubmission()
    } catch (error: any) {
      console.error("Error saving grade:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save grade",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRunTests = async (problemId: string, code: string, language: string) => {
    const problem = exam?.problems?.find(p => p.problem.id === problemId)?.problem
    if (!problem || !problem.testcases || !Array.isArray(problem.testcases)) {
      toast({
        title: "Error",
        description: "No test cases available for this problem",
        variant: "destructive",
      })
      return
    }

    try {
      setRunningTests(prev => ({ ...prev, [problemId]: true }))
      
      const languageId = LANGUAGE_STRING_TO_ID[language.toLowerCase()] || 71
      const testCasesArray = problem.testcases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.output || tc.expectedOutput
      }))

      const rawResults = await runCodeMultiple(
        testCasesArray,
        code,
        languageId,
        problemId
      )
      
      // Process results to add passed/failed status
      const processedResults = rawResults.map((result: any, index: number) => {
        const actualOut = (result.stdout || '').trim()
        const expectedOut = testCasesArray[index].expectedOutput.trim()
        const isCorrect = actualOut === expectedOut

        return {
          ...result,
          passed: result.stderr || result.compile_output ? false : isCorrect,
          actualOutput: actualOut,
          expectedOutput: expectedOut
        }
      })
      
      // Store results for this specific problem
      setTestResultsByProblem(prev => ({
        ...prev,
        [problemId]: processedResults
      }))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to run tests",
        variant: "destructive",
      })
    } finally {
      setRunningTests(prev => ({ ...prev, [problemId]: false }))
    }
  }

  const getLanguageDisplayName = (solution: any): string => {
    if (solution.languageId) {
      return LANGUAGE_ID_TO_NAME[solution.languageId] || "Unknown"
    }
    if (solution.language) {
      return LANGUAGE_STRING_TO_NAME[solution.language.toLowerCase()] || solution.language
    }
    return "Unknown"
  }

  const getMonacoLanguage = (solution: any): string => {
    if (solution.languageId) {
      return LANGUAGE_ID_TO_MONACO[solution.languageId] || "python"
    }
    if (solution.language) {
      return LANGUAGE_STRING_TO_MONACO[solution.language.toLowerCase()] || "python"
    }
    return "python"
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading submission...</span>
          </div>
        </div>
      </BaseLayout>
    )
  }

  if (!exam || !submission) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Submission not found</h2>
            <Button className="mt-4" onClick={() => navigate(`/courses/${courseId}/exams/${examId}/submissions`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Button>
          </div>
        </div>
      </BaseLayout>
    )
  }

  const solutions = submission.solutions as Record<string, any>
  const isFinished = !!submission.finishedAt

  return (
    <BaseLayout>
      <div className="px-4 py-6 lg:px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/courses/${courseId}/exams/${examId}/submissions`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>

        {/* Student Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {submission.student?.name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{submission.student?.name || "Unknown Student"}</CardTitle>
                  <CardDescription className="mt-1">{submission.student?.email}</CardDescription>
                  <div className="mt-2 flex gap-2">
                    {isFinished ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        In Progress
                      </Badge>
                    )}
                    {submission.autoSubmitted && (
                      <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Auto-submitted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Exam</div>
                <div className="font-semibold">{exam.title}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <p className="text-sm text-muted-foreground">Started At</p>
                <p className="font-medium">{formatDate(submission.startedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(submission.startedAt, submission.finishedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problems Attempted</p>
                <p className="font-medium">
                  {Object.keys(solutions).filter(id => solutions[id]?.code?.trim()).length} / {exam.problems?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Violations</p>
                {submission.proctoringViolations && submission.proctoringViolations.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      {submission.warningCount || submission.proctoringViolations.length}
                    </Badge>
                  </div>
                ) : (
                  <p className="font-medium text-muted-foreground">None</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Grade</p>
                <p className="font-medium">
                  {submission.grade !== undefined && submission.grade !== null ? (
                    <Badge variant="outline">{submission.grade}/100</Badge>
                  ) : (
                    <span className="text-muted-foreground">Not graded</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="code">
              <Code2 className="mr-2 h-4 w-4" />
              Submitted Code
            </TabsTrigger>
            <TabsTrigger value="violations">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Violations ({submission.proctoringViolations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="grading">
              <CheckCircle className="mr-2 h-4 w-4" />
              Grading
            </TabsTrigger>
          </TabsList>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-4">
            {exam.problems?.map((examProblem, index) => {
              const problemId = examProblem.problem.id
              const solution = solutions[problemId]
              const hasCode = solution?.code && solution.code.trim() !== ""

              return (
                <Card key={examProblem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Problem {index + 1}</Badge>
                          <CardTitle className="text-lg">
                            {examProblem.problem.title}
                          </CardTitle>
                          <Badge
                            variant={
                              examProblem.problem.difficulty === "EASY"
                                ? "default"
                                : examProblem.problem.difficulty === "MEDIUM"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {examProblem.problem.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCode && (
                          <>
                            <Badge className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Attempted - {getLanguageDisplayName(solution)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRunTests(problemId, solution.code, solution.language || 'python')}
                              disabled={runningTests[problemId]}
                            >
                              {runningTests[problemId] ? (
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
                          </>
                        )}
                        {!hasCode && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Attempted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasCode ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Submitted Code ({getLanguageDisplayName(solution)})
                            </span>
                          </div>
                          <Editor
                            height="400px"
                            language={getMonacoLanguage(solution)}
                            value={solution.code}
                            theme={editorTheme}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 14,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                            }}
                          />
                        </div>
                        
                        {/* Test Results - Only show for this specific problem */}
                        {testResultsByProblem[problemId] && testResultsByProblem[problemId].length > 0 && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">Test Results</h4>
                              <Badge 
                                variant={testResultsByProblem[problemId].every((r: any) => r.passed) ? "default" : "secondary"}
                                className={testResultsByProblem[problemId].every((r: any) => r.passed) ? "bg-green-600" : ""}
                              >
                                {testResultsByProblem[problemId].filter((r: any) => r.passed).length} / {testResultsByProblem[problemId].length} Passed
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {testResultsByProblem[problemId].map((result: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg border ${
                                    result.passed
                                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                      : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Test Case {idx + 1}</span>
                                      {result.time && (
                                        <span className="text-xs text-muted-foreground">
                                          ({parseFloat(result.time) * 1000}ms)
                                        </span>
                                      )}
                                    </div>
                                    <Badge
                                      variant={result.passed ? "default" : "destructive"}
                                      className={result.passed ? "bg-green-600" : ""}
                                    >
                                      {result.passed ? "Passed" : "Failed"}
                                    </Badge>
                                  </div>
                                  <div className="text-sm space-y-2">
                                    <div>
                                      <div className="text-muted-foreground mb-1">Expected Output:</div>
                                      <pre className="bg-background border rounded px-2 py-1.5 text-xs overflow-x-auto">
                                        {result.expectedOutput || "(empty)"}
                                      </pre>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground mb-1">Actual Output:</div>
                                      <pre className={`border rounded px-2 py-1.5 text-xs overflow-x-auto ${
                                        result.passed 
                                          ? "bg-background" 
                                          : "bg-red-50 dark:bg-red-950/30"
                                      }`}>
                                        {result.actualOutput || result.stdout || "(empty)"}
                                      </pre>
                                    </div>
                                  </div>
                                  {result.stderr && (
                                    <div className="text-sm mt-2">
                                      <div className="text-destructive mb-1">Error:</div>
                                      <pre className="bg-background border border-red-300 rounded px-2 py-1.5 text-xs overflow-x-auto break-all">
                                        {result.stderr}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Student did not attempt this problem</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* Violations Tab */}
          <TabsContent value="violations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Proctoring Violations</CardTitle>
                <CardDescription>
                  All proctoring violations recorded during the exam
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submission.proctoringViolations && submission.proctoringViolations.length > 0 ? (
                  <div className="space-y-2">
                    {submission.proctoringViolations.map((violation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{violation.type.replace(/_/g, " ")}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(violation.timestamp).toLocaleString()}
                            </div>
                          </div>
                          {violation.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {violation.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No violations recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grading Tab */}
          <TabsContent value="grading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Submission</CardTitle>
                <CardDescription>
                  Assign a grade and provide feedback for this exam submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Grade (0-100)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Enter grade..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Feedback
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={6}
                  />
                </div>
                <Button onClick={handleSaveGrade} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Grade & Feedback
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
