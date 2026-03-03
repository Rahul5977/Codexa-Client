"use client"

import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Loader2, 
  Clock, 
  Calendar,
  FileText,
  ArrowLeft,
  Code,
  CheckCircle,
  Send,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { assignmentService, type Assignment, type AssignmentSubmission } from "@/api/services/assignment"
import { useAuth } from "@/contexts/auth-context"
import { format, isAfter } from "date-fns"
import { BaseLayout } from "@/components/layouts/base-layout"

export default function AssignmentDetailPage() {
  const { courseId, assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
  const [solutions, setSolutions] = useState<Record<string, string>>({})
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData()
    }
  }, [assignmentId])

  const fetchAssignmentData = async () => {
    if (!assignmentId) return

    try {
      setLoading(true)
      const [assignmentData, submissionData] = await Promise.all([
        assignmentService.getAssignmentById(assignmentId),
        assignmentService.getMySubmission(assignmentId)
      ])
      
      setAssignment(assignmentData)
      setSubmission(submissionData)
      
      if (submissionData) {
        setSolutions(submissionData.solutions)
      } else {
        // Initialize empty solutions for each problem
        const emptySolutions: Record<string, string> = {}
        assignmentData.problems.forEach(ap => {
          emptySolutions[ap.problemId] = ''
        })
        setSolutions(emptySolutions)
      }
    } catch (error) {
      console.error("Error fetching assignment data:", error)
      toast({
        title: "Error",
        description: "Failed to load assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProblemClick = (problemId: string) => {
    navigate(`/code?id=${problemId}&assignment=${assignmentId}&course=${courseId}`)
  }

  const handleGoBack = () => {
    navigate(`/courses/${courseId}/assignments`)
  }

  const handleSubmit = async () => {
    if (!assignmentId || !assignment) return

    if (isAfter(new Date(), new Date(assignment.endDate))) {
      toast({
        title: "Assignment Overdue",
        description: "This assignment deadline has passed.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await assignmentService.submitAssignment({
        assignmentId,
        solutions
      })
      
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully.",
      })
      
      // Refresh data to show submission status
      await fetchAssignmentData()
      setShowSubmitDialog(false)
    } catch (error) {
      console.error("Error submitting assignment:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = assignment && isAfter(new Date(), new Date(assignment.endDate))
  const canSubmit = assignment && !isOverdue && !submission

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BaseLayout>
    )
  }

  if (!assignment) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The assignment you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Button onClick={handleGoBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{assignment.name}</h1>
                {submission ? (
                  <Badge variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submitted
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive">
                    <Clock className="mr-2 h-4 w-4" />
                    Overdue
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="mr-2 h-4 w-4" />
                    Active
                  </Badge>
                )}
              </div>
              
              {assignment.description && (
                <p className="text-muted-foreground mb-4">{assignment.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {format(new Date(assignment.endDate), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{assignment.problems.length} problem{assignment.problems.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Problems List */}
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Problems</h2>
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)} size="lg">
                <Send className="mr-2 h-4 w-4" />
                Submit Assignment
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {assignment.problems.map((assignmentProblem, index) => {
              const problem = assignmentProblem.problem
              const hasSolution = solutions[problem.id] && solutions[problem.id].trim() !== ''

              return (
                <Card 
                  key={assignmentProblem.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProblemClick(problem.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                            {index + 1}
                          </span>
                          {problem.title}
                        </CardTitle>
                        <CardDescription className="mt-2 ml-11">
                          {problem.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            problem.difficulty === 'EASY' ? 'secondary' :
                            problem.difficulty === 'MEDIUM' ? 'default' : 'destructive'
                          }
                        >
                          {problem.difficulty}
                        </Badge>
                        {hasSolution && (
                          <Badge variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Solution Added
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span>{problem.testCases?.length || 0} test case{(problem.testCases?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <Button variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Solve Problem
                      </Button>
                    </div>

                    {hasSolution && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Current Solution:
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <code className="text-sm">
                            {solutions[problem.id].slice(0, 100)}
                            {solutions[problem.id].length > 100 && '...'}
                          </code>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Submission Status */}
        {submission && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Submitted At</div>
                  <div>{format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                </div>
                {submission.grade !== null && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Grade</div>
                    <div className="text-2xl font-bold">{submission.grade}/100</div>
                  </div>
                )}
                {submission.feedback && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Teacher Feedback</div>
                    <div className="mt-1 p-3 bg-muted rounded-lg">{submission.feedback}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this assignment? You won't be able to make changes after submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-sm font-medium mb-2">Solutions Summary:</div>
            <div className="space-y-2">
              {assignment.problems.map((ap, index) => {
                const hasSolution = solutions[ap.problemId] && solutions[ap.problemId].trim() !== ''
                return (
                  <div key={ap.id} className="flex items-center gap-2 text-sm">
                    {hasSolution ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    <span>Problem {index + 1}: {ap.problem.title}</span>
                    <span className="text-muted-foreground">
                      {hasSolution ? '✓ Solution provided' : '⚠ No solution'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}