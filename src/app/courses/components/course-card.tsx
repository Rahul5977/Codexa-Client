import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MoreHorizontal,
  Users,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type Classroom } from "@/api/services/classroom"
import { format } from "date-fns"

interface CourseCardProps {
  course: Classroom
  isTeacher: boolean
  onDelete?: (courseId: string) => void
}

export function CourseCard({ course, isTeacher, onDelete }: CourseCardProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(course.code)
    toast({
      title: "Course code copied",
      description: "The course code has been copied to your clipboard",
    })
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(course.id)
    }
    setShowDeleteDialog(false)
  }

  const handleCourseClick = () => {
    // Navigate to assignments page for both teachers and students
    navigate(`/courses/${course.id}/assignments`)
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={course.imageUrl || undefined} alt={course.name || 'Course'} />
                <AvatarFallback>
                  {course.name?.slice(0, 2).toUpperCase() || 'CO'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg leading-tight">{course.name}</CardTitle>
                {course.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </div>
            </div>
            {isTeacher && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Course Code */}
          {isTeacher && <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Course Code</p>
              <p className="text-lg font-mono font-bold">{course.code}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>}

          {/* Course Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course.studentCount || 0} students</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {(() => {
                  try {
                    if (isTeacher && course.createdAt) {
                      const date = new Date(course.createdAt)
                      return !isNaN(date.getTime()) ? `Created ${format(date, "MMM d, yyyy")}` : 'Created recently'
                    } else if (!isTeacher && course.joinedAt) {
                      const date = new Date(course.joinedAt)
                      return !isNaN(date.getTime()) ? `Joined ${format(date, "MMM d, yyyy")}` : 'Joined recently'
                    }
                    return isTeacher ? 'Created recently' : 'Joined recently'
                  } catch (error) {
                    return isTeacher ? 'Created recently' : 'Joined recently'
                  }
                })()}
              </span>
            </div>
          </div>

          {/* Teacher/Student Badge */}
          {!isTeacher && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {course.teacher?.name?.slice(0, 2).toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {course.teacher?.name || 'Teacher'}
                </span>
              </div>
              <Badge variant="default">Teacher</Badge>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/50 py-3">
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleCourseClick}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Course
            </Button>
            {isTeacher && (
              <Button variant="ghost" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{course.name}"? This action cannot be undone.
              All assignments, exams, and student data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}