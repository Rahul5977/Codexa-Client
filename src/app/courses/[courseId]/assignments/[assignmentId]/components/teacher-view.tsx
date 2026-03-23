"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  FileText,
  Code,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Award,
  Eye,
  Clock,
  CalendarClock,
  FolderOpen,
} from "lucide-react"
import { assignmentService, type Assignment, type AssignmentSubmission } from "@/api/services/assignment"
import { classroomService, type Student } from "@/api/services/classroom"
import { format, isAfter } from "date-fns"

interface TeacherViewProps {
  assignment: Assignment
  courseId: string
  assignmentId: string
}

interface StudentWithSubmission extends Student {
  submission?: AssignmentSubmission
  hasSubmitted: boolean
  isLate: boolean
}

export function TeacherView({ assignment, courseId, assignmentId }: TeacherViewProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentWithSubmission[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeInput, setGradeInput] = useState<number>(0)
  const [feedbackInput, setFeedbackInput] = useState<string>("")
  
  // Deadline extension state
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false)
  const [updatingDeadline, setUpdatingDeadline] = useState(false)
  const [newDeadline, setNewDeadline] = useState<string>("")
  
  // Tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem(`teacher-assignment-tab-${assignmentId}`)
    return saved || "problems"
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(`teacher-assignment-tab-${assignmentId}`, value)
  }

  useEffect(() => {
    fetchData()
  }, [assignmentId, courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsData, submissionsData] = await Promise.all([
        classroomService.getClassroomStudents(courseId),
        assignmentService.getAssignmentSubmissions(assignmentId)
      ])

      const submissionsArray = submissionsData?.submissions || []
      
      setSubmissions(submissionsArray)

      // Map students with their submissions
      const studentsWithSubmissions: StudentWithSubmission[] = studentsData.students.map(student => {
        const submission = submissionsArray.find((s: AssignmentSubmission) => s.studentId === student.id)
        const hasSubmitted = !!submission
        const isLate = submission 
          ? isAfter(new Date(submission.submittedAt), new Date(assignment.deadline))
          : false

        return {
          ...student,
          submission,
          hasSubmitted,
          isLate
        }
      })

      setStudents(studentsWithSubmissions)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load submissions data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewSubmission = (student: StudentWithSubmission, problemId: string) => {
    if (student.submission) {
      // Set active tab to submissions before navigating
      handleTabChange("submissions")
      navigate(`/code?id=${problemId}&assignment=${assignmentId}&course=${courseId}&viewSubmission=true&studentId=${student.id}`)
    }
  }

  const handleGradeClick = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission)
    setGradeInput(submission.grade || 0)
    setFeedbackInput(submission.feedback || "")
    setShowGradeDialog(true)
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return

    if (gradeInput < 0 || gradeInput > 100) {
      toast({
        title: "Invalid Grade",
        description: "Grade must be between 0 and 100",
        variant: "destructive",
      })
      return
    }

    try {
      setGrading(true)
      await assignmentService.gradeSubmission(
        assignmentId,
        selectedSubmission.id,
        gradeInput,
        feedbackInput
      )

      toast({
        title: "Success",
        description: "Grade submitted successfully",
      })

      // Refresh data
      await fetchData()
      setShowGradeDialog(false)
    } catch (error) {
      console.error("Error grading submission:", error)
      toast({
        title: "Error",
        description: "Failed to submit grade",
        variant: "destructive",
      })
    } finally {
      setGrading(false)
    }
  }

  const handleExtendDeadline = async () => {
    if (!newDeadline) {
      toast({
        title: "Invalid Date",
        description: "Please select a new deadline",
        variant: "destructive",
      })
      return
    }

    const deadlineDate = new Date(newDeadline)
    if (deadlineDate <= new Date(assignment.deadline)) {
      toast({
        title: "Invalid Date",
        description: "New deadline must be after the current deadline",
        variant: "destructive",
      })
      return
    }

    try {
      setUpdatingDeadline(true)
      await assignmentService.updateAssignmentDeadline(assignmentId, deadlineDate)

      toast({
        title: "Success",
        description: "Assignment deadline extended successfully",
      })

      setShowDeadlineDialog(false)
      // Refresh page to show updated deadline
      window.location.reload()
    } catch (error) {
      console.error("Error extending deadline:", error)
      toast({
        title: "Error",
        description: "Failed to extend deadline",
        variant: "destructive",
      })
    } finally {
      setUpdatingDeadline(false)
    }
  }

  const isOverdue = assignment?.deadline ? isAfter(new Date(), new Date(assignment.deadline)) : false
  const submittedCount = students.filter(s => s.hasSubmitted).length
  const lateSubmissions = students.filter(s => s.isLate).length
  const notSubmittedCount = students.filter(s => !s.hasSubmitted).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium">
            Deadline: {format(new Date(assignment.deadline), "MMM d, yyyy 'at' h:mm a")}
          </span>
          {isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewDeadline(format(new Date(assignment.deadline), "yyyy-MM-dd'T'HH:mm"))
            setShowDeadlineDialog(true)
          }}
        >
          <CalendarClock className="h-4 w-4 mr-2" />
          Extend Deadline
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="problems">
            <FileText className="h-4 w-4 mr-2" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <User className="h-4 w-4 mr-2" />
            Submissions ({submittedCount}/{students.length})
          </TabsTrigger>
        </TabsList>

        {/* Problems Tab */}
        <TabsContent value="problems" className="mt-6">
          <div className="grid gap-4">
            {assignment.type === "IDE" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    IDE Assignment Files
                  </CardTitle>
                  <CardDescription>
                    These files are provided to students inside the online IDE explorer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignment.ideFiles && assignment.ideFiles.length > 0 ? (
                    <div className="space-y-2">
                      {assignment.ideFiles.map((file) => (
                        <div key={file.name} className="flex items-center justify-between rounded-md border p-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No assignment files uploaded.</p>
                  )}
                </CardContent>
              </Card>
            ) : assignment.problems?.map((assignmentProblem, index) => {
              const problem = assignmentProblem.problem

              return (
                <Card key={assignmentProblem.id}>
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
                          {problem.description || problem.statement?.substring(0, 100) + '...'}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          problem.difficulty === 'EASY' ? 'secondary' :
                          problem.difficulty === 'MEDIUM' ? 'default' : 'destructive'
                        }
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/code?id=${problem.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Problem
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Submitted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{submittedCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {lateSubmissions > 0 && `${lateSubmissions} late`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Not Submitted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{notSubmittedCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {isOverdue ? 'Past deadline' : 'Deadline approaching'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      Average Grade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {submissions.length > 0
                        ? (submissions.reduce((acc, s) => acc + (s.grade || 0), 0) / submissions.length).toFixed(1)
                        : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {submissions.filter(s => s.grade !== null && s.grade !== undefined).length} graded
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Students List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Student Submissions</h3>
                {students.map((student) => (
                  <Card key={student.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-base">{student.name}</CardTitle>
                            <CardDescription>{student.email}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {student.hasSubmitted ? (
                            <>
                              {student.isLate && (
                                <Badge variant="destructive" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Late
                                </Badge>
                              )}
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Submitted
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Not Submitted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {student.hasSubmitted && student.submission && (
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-muted-foreground">Submitted: </span>
                              <span className="font-medium">
                                {format(new Date(student.submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            {student.submission.grade !== null && student.submission.grade !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Grade: </span>
                                <span className="font-bold text-lg">{student.submission.grade}/100</span>
                              </div>
                            )}
                          </div>

                          {student.submission.feedback && (
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Feedback:</div>
                              <div className="text-sm">{student.submission.feedback}</div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {assignment.type === "IDE" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/ide?assignmentId=${assignmentId}&courseId=${courseId}&studentId=${student.id}&viewOnly=true`)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Open IDE Submission
                              </Button>
                            ) : (
                              assignment.problems?.map((ap, idx) => (
                                <Button
                                  key={ap.problemId}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewSubmission(student, ap.problemId)}
                                >
                                  <Code className="mr-1 h-3 w-3" />
                                  Problem {idx + 1}
                                </Button>
                              ))
                            )}
                            <Button
                              variant={student.submission.grade !== null ? "secondary" : "default"}
                              size="sm"
                              onClick={() => handleGradeClick(student.submission!)}
                            >
                              <Award className="mr-1 h-3 w-3" />
                              {student.submission.grade !== null ? 'Update Grade' : 'Grade'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Provide a grade and optional feedback for this submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={gradeInput}
                onChange={(e) => setGradeInput(Number(e.target.value))}
                placeholder="Enter grade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Enter feedback for the student"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmit} disabled={grading}>
              {grading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Submit Grade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deadline Extension Dialog */}
      <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Assignment Deadline</DialogTitle>
            <DialogDescription>
              Set a new deadline for this assignment. The new deadline must be after the current deadline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Deadline</Label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {format(new Date(assignment.deadline), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-deadline">New Deadline</Label>
              <Input
                id="new-deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeadlineDialog(false)}
              disabled={updatingDeadline}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendDeadline}
              disabled={updatingDeadline}
            >
              {updatingDeadline ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Extend Deadline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
