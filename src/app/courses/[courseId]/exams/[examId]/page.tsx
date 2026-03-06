"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  ArrowLeft,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  Play,
  CheckCircle,
  Lock,
} from "lucide-react"
import { assignmentService, type Exam, type ExamSubmission } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"
import { classroomService } from "@/api/services/classroom"

export default function ExamDetailsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (examId) {
      fetchExamDetails()
    }
  }, [examId])

  // Update countdown timers
  useEffect(() => {
    if (!exam) return

    const interval = setInterval(() => {
      const now = new Date()
      const startTime = new Date(exam.startTime)
      const endTime = new Date(startTime.getTime() + exam.duration * 60000)

      // Time until exam starts
      if (now < startTime) {
        setTimeUntilStart(Math.max(0, startTime.getTime() - now.getTime()))
      } else {
        setTimeUntilStart(null)
      }

      // Time remaining in exam (if student has started)
      if (submission && submission.startedAt && !submission.finishedAt) {
        const submissionEndTime = new Date(
          new Date(submission.startedAt).getTime() + exam.duration * 60000
        )
        setTimeRemaining(Math.max(0, submissionEndTime.getTime() - now.getTime()))
      } else {
        setTimeRemaining(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [exam, submission])

  const fetchExamDetails = async () => {
    try {
      setLoading(true)
      const examData = await assignmentService.getExamById(examId)
      setExam(examData)

      // Check if user is teacher
      const classroom = await classroomService.getClassroomById(courseId)
      setIsTeacher(classroom.isTeacher || false)

      // If student, fetch submission
      if (!classroom.isTeacher) {
        try {
          const submissionData = await assignmentService.getMyExamSubmission(examId)
          setSubmission(submissionData)
        } catch {
          // No submission yet
          setSubmission(null)
        }
      }
    } catch (error: any) {
      console.error("Error fetching exam details:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load exam details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async () => {
    try {
      await assignmentService.startExam(examId)
      toast({
        title: "Exam Started",
        description: "Good luck! The timer has started.",
      })
      // Navigate to exam taking page
      navigate(`/courses/${courseId}/exams/${examId}/take`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to start exam",
        variant: "destructive",
      })
    }
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTimeOnly = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading exam details...</span>
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

  const now = new Date()
  const startTime = new Date(exam.startTime)
  const endTime = new Date(startTime.getTime() + exam.duration * 60000)
  const isNotStarted = now < startTime
  const isOngoing = now >= startTime && now <= endTime
  const isEnded = now > endTime
  const hasStarted = !!submission
  const isFinished = !!submission?.finishedAt

  return (
    <BaseLayout>
      <div className="px-4 py-6 lg:px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        {/* Exam Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{exam.title}</CardTitle>
                  {!isTeacher && (
                    <>
                      {isFinished && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {hasStarted && !isFinished && isOngoing && (
                        <Badge className="bg-blue-600 animate-pulse">
                          <Clock className="mr-1 h-3 w-3" />
                          In Progress
                        </Badge>
                      )}
                      {isOngoing && !hasStarted && (
                        <Badge className="bg-amber-600">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Available Now
                        </Badge>
                      )}
                      {isEnded && !hasStarted && (
                        <Badge variant="secondary">
                          <Lock className="mr-1 h-3 w-3" />
                          Ended
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {exam.subtitle && (
                  <CardDescription className="text-base">
                    {exam.subtitle}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exam.description && (
                <p className="text-muted-foreground">{exam.description}</p>
              )}
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">
                      {formatDate(exam.startTime)} at {formatTimeOnly(exam.startTime)}
                    </p>
                  </div>
                </div>
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
                    <p className="font-medium">{exam.problems?.length || 0} problems</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Actions */}
        {!isTeacher && (
          <div className="space-y-4">
            {/* Countdown to start */}
            {isNotStarted && timeUntilStart !== null && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Exam starts in: <strong>{formatTime(timeUntilStart)}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Timer during exam */}
            {hasStarted && !isFinished && timeRemaining !== null && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  Time Remaining: <strong className="text-lg">{formatTime(timeRemaining)}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Start exam button */}
            {isOngoing && !hasStarted && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> You have only ONE attempt for this exam.
                        Once you start, the timer cannot be paused. Make sure you have a stable
                        internet connection and won't be interrupted.
                      </AlertDescription>
                    </Alert>
                    <Button size="lg" onClick={handleStartExam}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue exam button */}
            {hasStarted && !isFinished && isOngoing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Button size="lg" onClick={() => navigate(`/courses/${courseId}/exams/${examId}/take`)}>
                      <Play className="mr-2 h-4 w-4" />
                      Continue Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exam ended without attempt */}
            {isEnded && !hasStarted && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  This exam has ended. You did not attempt this exam.
                </AlertDescription>
              </Alert>
            )}

            {/* Exam completed */}
            {isFinished && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  You have completed this exam. Submitted at {formatTimeOnly(submission.submittedAt || submission.finishedAt!)}
                  {submission.grade !== undefined && submission.grade !== null && (
                    <div className="mt-2">
                      <strong>Grade: {submission.grade}/100</strong>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Teacher View */}
        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle>Exam Management</CardTitle>
              <CardDescription>View and manage student submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(`/courses/${courseId}/exams/${examId}/submissions`)}>
                <FileText className="mr-2 h-4 w-4" />
                View Submissions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
