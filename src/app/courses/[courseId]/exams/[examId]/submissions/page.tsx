"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  ArrowLeft,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Code2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import { assignmentService, type Exam, type ExamSubmission } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"

export default function ExamSubmissionsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [activeTab, setActiveTab] = useState("submissions")

  useEffect(() => {
    if (examId) {
      fetchExamAndSubmissions()
    }
  }, [examId])

  const fetchExamAndSubmissions = async () => {
    try {
      setLoading(true)
      const [examData, submissionsData] = await Promise.all([
        assignmentService.getExamById(examId),
        assignmentService.getExamSubmissions(examId),
      ])

      setExam(examData)
      setSubmissions(submissionsData)
    } catch (error: any) {
      console.error("Error fetching exam submissions:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load exam submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  const getCompletionPercentage = (solutions: Record<string, any>) => {
    if (!exam) return 0
    const totalProblems = exam.problems?.length || 0
    if (totalProblems === 0) return 0
    
    const solvedCount = Object.keys(solutions || {}).filter(
      problemId => solutions[problemId]?.code && solutions[problemId].code.trim() !== ""
    ).length
    
    return Math.round((solvedCount / totalProblems) * 100)
  }

  const handleViewSubmission = (submission: ExamSubmission) => {
    const normalizedType = String(exam?.type || "").toUpperCase()
    const isIdeExam = normalizedType === "IDE" || (Array.isArray(exam?.ideFiles) && (exam?.ideFiles?.length || 0) > 0)

    if (isIdeExam) {
      navigate(`/ide?courseId=${courseId}&examId=${examId}&studentId=${submission.studentId}&viewOnly=true`)
      return
    }

    navigate(`/courses/${courseId}/exams/${examId}/submissions/${submission.id}`)
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading submissions...</span>
          </div>
        </div>
      </BaseLayout>
    )
  }

  if (!exam) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Exam not found</h2>
            <Button className="mt-4" onClick={() => navigate(`/courses/${courseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="px-4 py-6 lg:px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/courses/${courseId}/exams/${examId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exam
        </Button>

        {/* Exam Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                {exam.subtitle && (
                  <CardDescription className="mt-1 text-base">
                    {exam.subtitle}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-4">
                {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{exam.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Problems</p>
                  <p className="font-medium">{exam.problems?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {submissions.filter(s => s.finishedAt).length} / {submissions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                  <p className="font-medium">
                    {submissions.length > 0
                      ? Math.round(
                          submissions.reduce(
                            (acc, s) => acc + getCompletionPercentage(s.solutions as Record<string, any>),
                            0
                          ) / submissions.length
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">
              <Users className="mr-2 h-4 w-4" />
              Student Submissions ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="problems">
              <FileText className="mr-2 h-4 w-4" />
              Problems ({exam.problems?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Student submissions will appear here once they start the exam
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Started At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Violations</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => {
                        const completion = getCompletionPercentage(submission.solutions as Record<string, any>)
                        const isFinished = !!submission.finishedAt

                        return (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {submission.student?.name?.charAt(0) || "S"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{submission.student?.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {submission.student?.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {formatDate(submission.startedAt)}
                              </span>
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {formatDuration(submission.startedAt, submission.finishedAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${completion}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{completion}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {submission.proctoringViolations && submission.proctoringViolations.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    {submission.warningCount || submission.proctoringViolations.length}
                                  </Badge>
                                  {submission.autoSubmitted && (
                                    <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                                      <AlertTriangle className="h-3 w-3" />
                                      Auto-submit
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.grade !== undefined && submission.grade !== null ? (
                                <Badge variant="outline">
                                  {submission.grade}/100
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not graded</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewSubmission(submission)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Code
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Problems Tab */}
          <TabsContent value="problems" className="space-y-4">
            <div className="grid gap-4">
              {exam.problems?.map((examProblem, index) => (
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
                        {examProblem.problem.tags && examProblem.problem.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {examProblem.problem.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Attempted by{" "}
                        <strong>
                          {submissions.filter(s => 
                            (s.solutions as any)?.[examProblem.problem.id]?.code
                          ).length}
                        </strong>{" "}
                        / {submissions.length} students
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/code?id=${examProblem.problem.id}`)}
                      >
                        <Code2 className="mr-2 h-4 w-4" />
                        View Problem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
