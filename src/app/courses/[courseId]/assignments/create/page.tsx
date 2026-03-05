"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, X, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { assignmentService, type CreateAssignmentDto } from "@/api/services/assignment"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ProblemInput {
    id: string
    problemId: string
    points: number
}

export default function CreateAssignmentPage() {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    })
    const [problems, setProblems] = useState<ProblemInput[]>([])
    const [newProblemId, setNewProblemId] = useState("")
    const [newProblemPoints, setNewProblemPoints] = useState(100)

    const handleAddProblem = () => {
        if (!newProblemId.trim()) {
            toast({
                title: "Error",
                description: "Please enter a problem ID",
                variant: "destructive",
            })
            return
        }

        if (problems.some(p => p.problemId === newProblemId)) {
            toast({
                title: "Error",
                description: "This problem has already been added",
                variant: "destructive",
            })
            return
        }

        setProblems([
            ...problems,
            {
                id: crypto.randomUUID(),
                problemId: newProblemId,
                points: newProblemPoints,
            },
        ])
        setNewProblemId("")
        setNewProblemPoints(100)
    }

    const handleRemoveProblem = (id: string) => {
        setProblems(problems.filter(p => p.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Please enter an assignment name",
                variant: "destructive",
            })
            return
        }

        if (problems.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one problem",
                variant: "destructive",
            })
            return
        }

        if (formData.startDate >= formData.endDate) {
            toast({
                title: "Error",
                description: "End date must be after start date",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)

            const assignmentData: CreateAssignmentDto = {
                name: formData.name,
                description: formData.description || "",
                startDate: formData.startDate,
                endDate: formData.endDate,
                classroomId: courseId as string,
                problemIds: problems.map(p => p.problemId),
            }

            await assignmentService.createAssignment(assignmentData)

            toast({
                title: "Success",
                description: "Assignment created successfully",
            })

            navigate(`/courses/${courseId}`)
        } catch (error: any) {
            console.error("Error creating assignment:", error)
            toast({
                title: "Error",
                description: error?.message || "Failed to create assignment",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <BaseLayout>
            <div className="container max-w-4xl py-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/courses/${courseId}`)}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Course
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Assignment</CardTitle>
                        <CardDescription>
                            Add problems and set deadlines for your students
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Assignment Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Assignment Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Week 1 - Array Problems"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the assignment objectives and requirements..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={4}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.startDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.startDate ? (
                                                    format(formData.startDate, "PPP p")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.startDate}
                                                onSelect={(date) =>
                                                    date && setFormData({ ...formData, startDate: date })
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.endDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.endDate ? (
                                                    format(formData.endDate, "PPP p")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.endDate}
                                                onSelect={(date) =>
                                                    date && setFormData({ ...formData, endDate: date })
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Problems Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Problems *</Label>
                                    <span className="text-sm text-muted-foreground">
                                        {problems.length} problem{problems.length !== 1 ? "s" : ""} added
                                    </span>
                                </div>

                                {/* Add Problem Input */}
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Enter problem ID"
                                            value={newProblemId}
                                            onChange={(e) => setNewProblemId(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleAddProblem()
                                                }
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddProblem}
                                        size="default"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </div>

                                {/* Problems List */}
                                {problems.length > 0 && (
                                    <div className="space-y-2">
                                        {problems.map((problem) => (
                                            <div
                                                key={problem.id}
                                                className="flex items-center justify-between rounded-lg border p-3"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-mono text-sm">
                                                        {problem.problemId}
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveProblem(problem.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/courses/${courseId}`)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Assignment
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </BaseLayout>
    )
}