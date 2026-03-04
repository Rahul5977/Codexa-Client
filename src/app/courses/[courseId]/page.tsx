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
  Clock
} from "lucide-react"
import { classroomService, type Classroom, type Student } from "@/api/services/classroom"
import { assignmentService, type Assignment } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"

export default function CourseDetailsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const courseId = params.courseId as string

  const [loading, setLoading] = useState(true)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
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
        assignmentService.getClassroomAssignments(courseId).catch(() => ({ items: [], totalItems: 0, currentPage: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false })),
        classroomService.getClassroomStudents(courseId).catch(() => ({ students: [], totalStudents: 0 }))
      ])

      setAssignments(assignmentsResponse.items || [])
      setStudents(studentsResponse.students || [])
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
                {assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/courses/${courseId}/assignments/${assignment.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{assignment.name}</CardTitle>
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
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Start: {formatDate(assignment.startDate)} at {formatTime(assignment.startDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Due: {formatDate(assignment.endDate)} at {formatTime(assignment.endDate)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
