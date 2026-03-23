"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  ArrowLeft,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  Mail,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock
} from "lucide-react"
import { classroomService, type Classroom, type Student } from "@/api/services/classroom"
import { assignmentService, type Assignment, type Exam, type CreateExamDto } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"
import { isAfter } from "date-fns"
import { CreateExamModal, type CreateExamFormData } from "@/app/courses/components/create-exam-modal"

export default function CourseDetailsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string

  const [loading, setLoading] = useState(true)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [submissionMap, setSubmissionMap] = useState<Record<string, any>>({}) // assignmentId -> submission
  const [examSubmissionMap, setExamSubmissionMap] = useState<Record<string, any>>({}) // examId -> submission
  const [activeTab, setActiveTab] = useState("assignments")
  const [createExamModalOpen, setCreateExamModalOpen] = useState(false)

  useEffect(() => {
    if (courseId) {
      fetchClassroomDetails()
    }
  }, [courseId])

  const fetchClassroomDetails = async () => {
    try {
      setLoading(true)
      const classroomData = await classroomService.getClassroomById(courseId)
      setClassroom(classroomData)

      // Fetch assignments, exams, and students in parallel
      const [assignmentsResponse, examsResponse, studentsResponse] = await Promise.all([
        assignmentService.getClassroomAssignments(courseId).catch(() => ({ assignments: [] })),
        assignmentService.getClassroomExams(courseId).catch(() => []),
        classroomService.getClassroomStudents(courseId).catch(() => ({ students: [], totalStudents: 0 }))
      ])

      const assignmentsList = assignmentsResponse.assignments || []
      const examsList = examsResponse || []
      setAssignments(assignmentsList)
      setExams(examsList)
      setStudents(studentsResponse.students || [])

      // If student, fetch submission status for each assignment and exam
      if (!classroomData.isTeacher) {
        if (assignmentsList.length > 0) {
          const submissionPromises = assignmentsList.map(async (assignment: Assignment) => {
            try {
              const submission = await assignmentService.getMySubmission(assignment.id)
              return { assignmentId: assignment.id, submission }
            } catch {
              return { assignmentId: assignment.id, submission: null }
            }
          })

          const submissionResults = await Promise.all(submissionPromises)
          const submissionData: Record<string, any> = {}
          submissionResults.forEach(({ assignmentId, submission }) => {
            if (submission) {
              submissionData[assignmentId] = submission
            }
          })
          setSubmissionMap(submissionData)
        }

        if (examsList.length > 0) {
          const examSubmissionPromises = examsList.map(async (exam: Exam) => {
            try {
              const submission = await assignmentService.getMyExamSubmission(exam.id)
              return { examId: exam.id, submission }
            } catch {
              return { examId: exam.id, submission: null }
            }
          })

          const examSubmissionResults = await Promise.all(examSubmissionPromises)
          const examSubmissionData: Record<string, any> = {}
          examSubmissionResults.forEach(({ examId, submission }) => {
            if (submission) {
              examSubmissionData[examId] = submission
            }
          })
          setExamSubmissionMap(examSubmissionData)
        }
      }
    } catch (error: any) {
      console.error("Error fetching classroom details:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load course details",
        variant: "destructive",
      })
      navigate("/courses")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExam = async (data: CreateExamFormData) => {
    try {
      const examData: CreateExamDto = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        startTime: new Date(data.startTime),
        duration: data.duration,
        problems: data.problemIds.map((problemId, index) => ({
          problemId,
          order: index + 1,
        })),
      }

      await assignmentService.createExam(courseId, examData)
      
      toast({
        title: "Success",
        description: "Exam created successfully",
      })
      
      setCreateExamModalOpen(false)
      fetchClassroomDetails() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create exam",
        variant: "destructive",
      })
      throw error // Re-throw to prevent modal from closing on error
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (date: string | Date) => {
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
            <span>Loading course details...</span>
          </div>
        </div>
      </BaseLayout>
    )
  }

  if (!classroom) {
    return (
      <BaseLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Course not found</h2>
            <Button className="mt-4" onClick={() => navigate("/courses")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="px-4 lg:px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/courses")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        {/* Course Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl">{classroom.name}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {classroom.description || "No description provided"}
                </CardDescription>
              </div>
              {classroom.isTeacher && (
                <Badge variant="secondary" className="ml-4">
                  <GraduationCap className="mr-1 h-3 w-3" />
                  Teacher
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{classroom.studentCount}</strong> students enrolled
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Teacher: <strong>{classroom.teacher.name}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: <strong>{formatDate(classroom.createdAt)}</strong>
                </span>
              </div>
            </div>
            {!classroom.isTeacher && (
              <div className="mt-4">
                <Badge variant="outline">
                  Code: {classroom.code}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        {/* Tabs for Assignments, Exams, and Students */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="assignments">
                <FileText className="mr-2 h-4 w-4" />
                Assignments ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="exams">
                <Clock className="mr-2 h-4 w-4" />
                Exams ({exams.length})
              </TabsTrigger>
              <TabsTrigger value="students">
                <Users className="mr-2 h-4 w-4" />
                Students ({students.length})
              </TabsTrigger>
            </TabsList>
            {activeTab === "assignments" && classroom.isTeacher && (
              <Button onClick={() => navigate(`/courses/${courseId}/assignments/create`)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            )}
            {activeTab === "exams" && classroom.isTeacher && (
              <Button onClick={() => setCreateExamModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            )}
          </div>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {classroom.isTeacher
                      ? "Create your first assignment to get started"
                      : "Your teacher hasn't posted any assignments yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => {
                  const isPastDeadline = isAfter(new Date(), new Date(assignment.deadline))
                  const submission = submissionMap[assignment.id]
                  const isGraded = submission?.grade !== null && submission?.grade !== undefined
                  const isSubmitted = !!submission
                  const isLocked = isGraded || isPastDeadline
                  
                  // Determine status for students
                  let status: 'ongoing' | 'submitted' | 'graded' | 'overdue' = 'ongoing'
                  if (!classroom.isTeacher) {
                    if (isGraded) status = 'graded'
                    else if (isSubmitted) status = 'submitted'
                    else if (isPastDeadline) status = 'overdue'
                  }

                  return (
                    <Card
                      key={assignment.id}
                      className={`cursor-pointer transition-all ${
                        status === 'graded' 
                          ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-green-100 dark:hover:shadow-green-900/20'
                          : status === 'submitted'
                          ? 'bg-gradient-to-r from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800'
                          : status === 'overdue'
                          ? 'bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800 opacity-75'
                          : 'hover:shadow-md border-border'
                      }`}
                      onClick={() => {
                        if (assignment.type === "IDE" && !classroom.isTeacher) {
                          navigate(`/ide?assignmentId=${assignment.id}&courseId=${courseId}`)
                          return
                        }
                        navigate(`/courses/${courseId}/assignments/${assignment.id}`)
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle>{assignment.title}</CardTitle>
                              {!classroom.isTeacher && (
                                <>
                                  {status === 'graded' && (
                                    <Badge className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Graded {submission.grade}/100
                                    </Badge>
                                  )}
                                  {status === 'submitted' && (
                                    <Badge className="bg-blue-600 hover:bg-blue-700">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Submitted
                                    </Badge>
                                  )}
                                  {status === 'overdue' && (
                                    <Badge variant="destructive">
                                      <Lock className="mr-1 h-3 w-3" />
                                      Overdue
                                    </Badge>
                                  )}
                                  {status === 'ongoing' && (
                                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                      <AlertCircle className="mr-1 h-3 w-3" />
                                      Active
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            <CardTitle className="text-sm font-normal text-muted-foreground">{assignment.subtitle}</CardTitle>
                            <CardDescription className="mt-1">
                              {assignment.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {assignment.type}
                            </Badge>
                            <Badge variant="outline">
                              {assignment.type === "IDE"
                                ? `${assignment.ideFiles?.length || 0} files`
                                : `${assignment.problems?.length || 0} problems`}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Clock className={`mr-1 h-3 w-3 ${isPastDeadline ? 'text-red-600' : 'text-orange-600'}`} />
                              <span className={`font-bold ${isPastDeadline ? 'text-red-600' : 'text-orange-600'}`}>
                                Due: {formatDate(assignment.deadline)} at {formatTime(assignment.deadline)}
                              </span>
                            </div>
                          </div>
                          {!classroom.isTeacher && isLocked && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="mr-1 h-3 w-3" />
                              View Only
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {students.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No students enrolled</h3>
                  <p className="text-sm text-muted-foreground">
                    {classroom.isTeacher
                      ? "Share the classroom code with students to let them join"
                      : "Be the first to join this classroom"}
                  </p>
                  {classroom.isTeacher && (
                    <Badge variant="outline" className="mt-4 text-lg px-4 py-2">
                      Code: {classroom.code}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Problems Solved</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.image_url} alt={student.name} />
                                <AvatarFallback>
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                              {student.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.currentRating}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-green-600">{student.easyCount}E</span>
                              <span className="text-yellow-600">{student.mediumCount}M</span>
                              <span className="text-red-600">{student.hardCount}H</span>
                              <span className="text-muted-foreground">
                                ({student.totalSolved} total)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(student.joinedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-4">
            {exams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {classroom.isTeacher
                      ? "Create your first exam to get started"
                      : "Your teacher hasn't scheduled any exams yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {exams.map((exam) => {
                  const examStartTime = new Date(exam.startTime)
                  const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000)
                  const now = new Date()
                  const isNotStarted = now < examStartTime
                  const isOngoing = now >= examStartTime && now <= examEndTime
                  const isEnded = now > examEndTime
                  const submission = examSubmissionMap[exam.id]
                  const hasStarted = !!submission
                  const isFinished = !!submission?.finishedAt

                  // Determine status
                  let status: 'upcoming' | 'ongoing' | 'in-progress' | 'completed' | 'ended' = 'upcoming'
                  if (!classroom.isTeacher) {
                    if (isFinished) status = 'completed'
                    else if (hasStarted && isOngoing) status = 'in-progress'
                    else if (isEnded) status = 'ended'
                    else if (isOngoing) status = 'ongoing'
                  }

                  return (
                    <Card
                      key={exam.id}
                      className={`cursor-pointer transition-all ${
                        status === 'completed'
                          ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
                          : status === 'in-progress'
                          ? 'bg-gradient-to-r from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800 shadow-lg'
                          : status === 'ongoing'
                          ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
                          : status === 'ended'
                          ? 'bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-800 opacity-75'
                          : 'hover:shadow-md border-border'
                      }`}
                      onClick={() => navigate(`/courses/${courseId}/exams/${exam.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle>{exam.title}</CardTitle>
                              {!classroom.isTeacher && (
                                <>
                                  {status === 'completed' && (
                                    <Badge className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Completed
                                    </Badge>
                                  )}
                                  {status === 'in-progress' && (
                                    <Badge className="bg-blue-600 hover:bg-blue-700 animate-pulse">
                                      <Clock className="mr-1 h-3 w-3" />
                                      In Progress
                                    </Badge>
                                  )}
                                  {status === 'ongoing' && (
                                    <Badge className="bg-amber-600 hover:bg-amber-700">
                                      <AlertCircle className="mr-1 h-3 w-3" />
                                      Available Now
                                    </Badge>
                                  )}
                                  {status === 'ended' && (
                                    <Badge variant="secondary" className="opacity-75">
                                      <Lock className="mr-1 h-3 w-3" />
                                      Ended
                                    </Badge>
                                  )}
                                  {status === 'upcoming' && (
                                    <Badge variant="outline">
                                      <Clock className="mr-1 h-3 w-3" />
                                      Upcoming
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            {exam.subtitle && (
                              <CardTitle className="text-sm font-normal text-muted-foreground">{exam.subtitle}</CardTitle>
                            )}
                            {exam.description && (
                              <CardDescription className="mt-1">
                                {exam.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline">
                              {exam.problems?.length || 0} problems
                            </Badge>
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              {exam.duration} min
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {formatDate(exam.startTime)} at {formatTime(exam.startTime)}
                              </span>
                            </div>
                          </div>
                          {classroom.isTeacher && (
                            <Badge variant="outline" className="text-xs">
                              {exam._count?.submissions || 0} submissions
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        open={createExamModalOpen}
        onOpenChange={setCreateExamModalOpen}
        onSubmit={handleCreateExam}
      />
    </BaseLayout>
  )
}