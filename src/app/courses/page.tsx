"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, UserPlus, Users, Calendar, GraduationCap } from "lucide-react"
import { classroomService, type ClassroomResponse, type Classroom } from "@/api/services/classroom"
import { useAuth } from "@/contexts/auth-context"
import { CreateCourseModal } from "./components/create-course-modal"
import { JoinCourseModal } from "./components/join-course-modal"
import { CourseCard } from "./components/course-card"

export default function CoursesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [classrooms, setClassrooms] = useState<ClassroomResponse>({ teaching: [], enrolled: [] })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const data = await classroomService.getMyClassrooms()
      setClassrooms(data)
    } catch (error) {
      console.error("Error fetching classrooms:", error)
      toast({
        title: "Error",
        description: "Failed to load classrooms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (data: { name: string; description?: string; imageUrl?: string }) => {
    try {
      const newCourse = await classroomService.createClassroom(data)
      setClassrooms(prev => ({
        ...prev,
        teaching: [newCourse, ...prev.teaching]
      }))
      setCreateModalOpen(false)
      toast({
        title: "Success",
        description: "Course created successfully",
      })
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      })
    }
  }

  const handleJoinCourse = async (data: { code: string }) => {
    try {
      const joinedCourse = await classroomService.joinClassroom(data)
      setClassrooms(prev => ({
        ...prev,
        enrolled: [joinedCourse, ...prev.enrolled]
      }))
      setJoinModalOpen(false)
      toast({
        title: "Success",
        description: `Joined ${joinedCourse.name} successfully`,
      })
    } catch (error: any) {
      console.error("Error joining course:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to join course",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await classroomService.deleteClassroom(courseId)
      setClassrooms(prev => ({
        ...prev,
        teaching: prev.teaching.filter(course => course.id !== courseId)
      }))
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading courses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Your Courses</h1>
            <p className="text-muted-foreground">
              Manage your teaching courses and enrolled classes
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setJoinModalOpen(true)} variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Join Course
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms.teaching.length}</div>
            <p className="text-xs text-muted-foreground">
              Courses you're teaching
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classrooms.enrolled.length}</div>
            <p className="text-xs text-muted-foreground">
              Courses you're learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classrooms.teaching.reduce((total, course) => total + course.studentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all your courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classrooms.teaching.length + classrooms.enrolled.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All your courses
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-6" />

      {/* Courses Tabs */}
      <Tabs defaultValue="teaching" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teaching">
            Teaching ({classrooms.teaching.length})
          </TabsTrigger>
          <TabsTrigger value="enrolled">
            Enrolled ({classrooms.enrolled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teaching" className="space-y-4">
          {classrooms.teaching.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Teaching Courses</CardTitle>
                <CardDescription className="text-center mb-4">
                  You haven't created any courses yet. Start by creating your first course.
                </CardDescription>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classrooms.teaching.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isTeacher={true}
                  onDelete={handleDeleteCourse}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-4">
          {classrooms.enrolled.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Enrolled Courses</CardTitle>
                <CardDescription className="text-center mb-4">
                  You haven't joined any courses yet. Use a course code to join a class.
                </CardDescription>
                <Button onClick={() => setJoinModalOpen(true)} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join a Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classrooms.enrolled.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isTeacher={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateCourseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateCourse}
      />
      
      <JoinCourseModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onSubmit={handleJoinCourse}
      />
    </div>
  )
}