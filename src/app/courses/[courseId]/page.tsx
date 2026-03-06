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
import { assignmentService, type Assignment } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"
import { isAfter } from "date-fns"

export default function CourseDetailsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string

  const [loading, setLoading] = useState(true)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissionMap, setSubmissionMap] = useState<Record<string, any>>({}) // assignmentId -> submission
  const [activeTab, setActiveTab] = useState("assignments")

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

      // Fetch assignments and students in parallel
      const [assignmentsResponse, studentsResponse] = await Promise.all([
        assignmentService.getClassroomAssignments(courseId).catch(() => ({ assignments: [] })),
        classroomService.getClassroomStudents(courseId).catch(() => ({ students: [], totalStudents: 0 }))
      ])

      const assignmentsList = assignmentsResponse.assignments || []
      setAssignments(assignmentsList)
      setStudents(studentsResponse.students || [])

      // If student, fetch submission status for each assignment
      if (!classroomData.isTeacher && assignmentsList.length > 0) {
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

        {/* Tabs for Assignments and Students */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="assignments">
                <FileText className="mr-2 h-4 w-4" />
                Assignments ({assignments.length})
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
                      onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}`)}
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
                          <Badge variant="outline">
                            {assignment.problems?.length || 0} problems
                          </Badge>
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
        </Tabs>
      </div>
    </BaseLayout>
  )
}