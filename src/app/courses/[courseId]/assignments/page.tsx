"use client"

import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Clock, 
  Calendar,
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { assignmentService, type Assignment } from "@/api/services/assignment"
import { classroomService, type Classroom } from "@/api/services/classroom"
import { useAuth } from "@/contexts/auth-context"
import { format, isAfter, isBefore } from "date-fns"
import { BaseLayout } from "@/components/layouts/base-layout"

export default function CourseAssignmentsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

  const fetchCourseData = async () => {
    if (!courseId) return

    try {
      setLoading(true)
      const [classroomData, assignmentsData] = await Promise.all([
        classroomService.getClassroomById(courseId),
        assignmentService.getClassroomAssignments(courseId)
      ])
      
      setClassroom(classroomData)
      setAssignments(assignmentsData.data || [])
    } catch (error) {
      console.error("Error fetching course data:", error)
      toast({
        title: "Error",
        description: "Failed to load course assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date()
    const startDate = new Date(assignment.startDate)
    const endDate = new Date(assignment.endDate)

    if (isBefore(now, startDate)) {
      return { status: 'upcoming', label: 'Upcoming', icon: Clock, variant: 'secondary' as const }
    } else if (isAfter(now, endDate)) {
      return { status: 'overdue', label: 'Overdue', icon: XCircle, variant: 'destructive' as const }
    } else {
      return { status: 'active', label: 'Active', icon: CheckCircle, variant: 'default' as const }
    }
  }

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/courses/${courseId}/assignments/${assignmentId}`)
  }

  const handleGoBack = () => {
    navigate('/courses')
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BaseLayout>
    )
  }

  if (!classroom) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or you don't have access to it.
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
            Back to Courses
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{classroom.name}</h1>
              {classroom.description && (
                <p className="text-muted-foreground mt-2">{classroom.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>Course Code: <span className="font-mono font-medium">{classroom.code}</span></span>
                <span>•</span>
                <span>Teacher: {classroom.teacher.name}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Assignments List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Assignments</h2>
            <Badge variant="secondary">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground">
                  Your teacher hasn't created any assignments for this course yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => {
                const status = getAssignmentStatus(assignment)
                const StatusIcon = status.icon

                return (
                  <Card 
                    key={assignment.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleAssignmentClick(assignment.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{assignment.name}</CardTitle>
                          {assignment.description && (
                            <CardDescription className="mt-2">
                              {assignment.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant={status.variant}>
                          <StatusIcon className="mr-2 h-4 w-4" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">Start Date</div>
                            <div>{format(new Date(assignment.startDate), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">Due Date</div>
                            <div>{format(new Date(assignment.endDate), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <FileText className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">Problems</div>
                            <div>{assignment.problems?.length || 0} problem{(assignment.problems?.length || 0) !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">Status</div>
                            <div>{assignment.submissions?.[0] ? 'Submitted' : 'Not Submitted'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" className="w-full">
                          View Assignment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  )
}