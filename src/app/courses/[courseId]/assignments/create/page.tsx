"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, X, Loader2, Calendar as CalendarIcon, Search, Code2, CheckCircle2, Upload, FileText } from "lucide-react"
import { assignmentService, type AssignmentType, type CreateAssignmentDto, type IdeAssignmentFile } from "@/api/services/assignment"
import { getAllProblems, type Problem } from "@/api/services/problem"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import CreateProblemModal from "./components/create-problem-modal"

interface ProblemInput {
    id: string
    problemId: string
}

const BINARY_FILE_EXTENSIONS = new Set(["pdf", "xlsx", "xls", "png", "jpg", "jpeg"])

const readTeacherUploadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))

        const ext = file.name.split(".").pop()?.toLowerCase() || ""
        if (BINARY_FILE_EXTENSIONS.has(ext)) {
            reader.readAsDataURL(file)
            return
        }

        reader.readAsText(file)
    })
}

export default function CreateAssignmentPage() {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [loadingProblems, setLoadingProblems] = useState(true)
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        description: "",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    const [problems, setProblems] = useState<ProblemInput[]>([])
    const [allProblems, setAllProblems] = useState<Problem[]>([])
    const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateProblemModal, setShowCreateProblemModal] = useState(false)
    const [assignmentType, setAssignmentType] = useState<AssignmentType>("DSA")
    const [ideFiles, setIdeFiles] = useState<IdeAssignmentFile[]>([])
    const [showIdeFileModal, setShowIdeFileModal] = useState(false)

    useEffect(() => {
        fetchProblems()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProblems(allProblems)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredProblems(
                allProblems.filter(
                    (p) =>
                        p.title.toLowerCase().includes(query) ||
                        p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
                        p.difficulty.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, allProblems])

    const fetchProblems = async () => {
        try {
            setLoadingProblems(true)
            const problemsData = await getAllProblems()
            setAllProblems(problemsData)
            setFilteredProblems(problemsData)
        } catch (error) {
            console.error("Error fetching problems:", error)
            toast({
                title: "Error",
                description: "Failed to load problems",
                variant: "destructive",
            })
        } finally {
            setLoadingProblems(false)
        }
    }

    const handleAddProblem = (problemId: string) => {
        if (problems.some(p => p.problemId === problemId)) {
            toast({
                title: "Already Added",
                description: "This problem has already been added to the assignment",
                variant: "default",
            })
            return
        }

        setProblems([
            ...problems,
            {
                id: crypto.randomUUID(),
                problemId: problemId,
            },
        ])

        toast({
            title: "Problem Added",
            description: "Problem has been added to the assignment",
        })
    }

    const handleRemoveProblem = (id: string) => {
        setProblems(problems.filter(p => p.id !== id))
    }

    const handleProblemCreated = (newProblem: Problem) => {
        setAllProblems([newProblem, ...allProblems])
        handleAddProblem(newProblem.id)
        setShowCreateProblemModal(false)
        toast({
            title: "Success",
            description: "Problem created and added to assignment",
        })
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case "EASY":
                return "text-green-600 bg-green-100 dark:bg-green-900/30"
            case "MEDIUM":
                return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30"
            case "HARD":
                return "text-red-600 bg-red-100 dark:bg-red-900/30"
            default:
                return "text-gray-600 bg-gray-100 dark:bg-gray-900/30"
        }
    }

    const isProblemSelected = (problemId: string) => {
        return problems.some(p => p.problemId === problemId)
    }

    const getSelectedProblemDetails = (problemId: string) => {
        return allProblems.find(p => p.id === problemId)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast({
                title: "Error",
                description: "Please enter an assignment title",
                variant: "destructive",
            })
            return
        }

        if (assignmentType === "DSA" && problems.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one problem",
                variant: "destructive",
            })
            return
        }

        if (assignmentType === "IDE" && ideFiles.length === 0) {
            toast({
                title: "Upload Required",
                description: "Please upload at least one question or dataset file",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)

            const assignmentData: CreateAssignmentDto = {
                type: assignmentType,
                title: formData.title,
                subtitle: formData.subtitle || undefined,
                description: formData.description || undefined,
                deadline: formData.deadline,
                problems: assignmentType === "DSA"
                    ? problems.map((p, index) => ({
                        problemId: p.problemId,
                        order: index + 1,
                    }))
                    : undefined,
                ideFiles: assignmentType === "IDE" ? ideFiles : undefined,
            }

            await assignmentService.createAssignment(courseId as string, assignmentData)

            toast({
                title: "Success",
                description: "Assignment created successfully",
            })

            navigate(`/courses/${courseId}/assignments`)
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

    const handleUploadIdeFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        if (files.length === 0) {
            return
        }

        try {
            const uploadedFiles = await Promise.all(
                files.map(async (file): Promise<IdeAssignmentFile> => ({
                    name: file.name,
                    mimeType: file.type || "application/octet-stream",
                    size: file.size,
                    content: await readTeacherUploadFile(file),
                }))
            )

            setIdeFiles((previous) => {
                const existingNames = new Set(previous.map((file) => file.name))
                const uniqueNewFiles = uploadedFiles.filter((file) => !existingNames.has(file.name))
                return [...previous, ...uniqueNewFiles]
            })

            toast({
                title: "Files Uploaded",
                description: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""} added to this IDE assignment`,
            })
        } catch (error) {
            console.error("Failed to upload IDE files", error)
            toast({
                title: "Upload Failed",
                description: "One or more files could not be read",
                variant: "destructive",
            })
        } finally {
            event.target.value = ""
        }
    }

    const handleRemoveIdeFile = (name: string) => {
        setIdeFiles((previous) => previous.filter((file) => file.name !== name))
    }

    return (
        <BaseLayout>
            <div className="py-6 px-4 lg:px-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/courses/${courseId}/assignments`)}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Course
                </Button>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Assignment Details */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assignment Details</CardTitle>
                                <CardDescription>
                                    Basic information about the assignment
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Assignment Title */}
                                    <div className="space-y-3">
                                        <Label>Assignment Type *</Label>
                                        <RadioGroup
                                            value={assignmentType}
                                            onValueChange={(value) => setAssignmentType(value as AssignmentType)}
                                            className="grid gap-2"
                                        >
                                            <Label
                                                htmlFor="assignment-type-dsa"
                                                className={cn(
                                                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                                                    assignmentType === "DSA" && "border-primary bg-primary/5"
                                                )}
                                            >
                                                <RadioGroupItem id="assignment-type-dsa" value="DSA" className="mt-0.5" />
                                                <div>
                                                    <div className="font-medium">DSA Assignment</div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Students solve selected coding problems one by one.
                                                    </p>
                                                </div>
                                            </Label>
                                            <Label
                                                htmlFor="assignment-type-ide"
                                                className={cn(
                                                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                                                    assignmentType === "IDE" && "border-primary bg-primary/5"
                                                )}
                                            >
                                                <RadioGroupItem id="assignment-type-ide" value="IDE" className="mt-0.5" />
                                                <div>
                                                    <div className="font-medium">IDE Assignment</div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Upload question and dataset files, then students solve inside the online IDE.
                                                    </p>
                                                </div>
                                            </Label>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., Week 1 - Arrays"
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            required
                                        />
                                    </div>

                                    {/* Subtitle */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subtitle">Subtitle</Label>
                                        <Input
                                            id="subtitle"
                                            placeholder="e.g., Data Structures Practice"
                                            value={formData.subtitle}
                                            onChange={(e) =>
                                                setFormData({ ...formData, subtitle: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Assignment objectives..."
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            rows={4}
                                        />
                                    </div>

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <Label>Deadline *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.deadline && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.deadline ? (
                                                        format(formData.deadline, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.deadline}
                                                    onSelect={(date) =>
                                                        date && setFormData({ ...formData, deadline: date })
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Separator />

                                    {assignmentType === "DSA" ? (
                                        <div className="space-y-2">
                                            <Label>Selected Problems ({problems.length})</Label>
                                            {problems.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No problems selected yet
                                                </p>
                                            ) : (
                                                <ScrollArea className="h-[200px]">
                                                    <div className="space-y-2">
                                                        {problems.map((problem) => {
                                                            const details = getSelectedProblemDetails(problem.problemId)
                                                            return (
                                                                <div
                                                                    key={problem.id}
                                                                    className="flex items-start justify-between rounded-lg border p-2 text-sm"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-sm">
                                                                            {details?.title || problem.problemId}
                                                                        </p>
                                                                        {details && (
                                                                            <Badge
                                                                                className={cn("mt-1 text-xs", getDifficultyColor(details.difficulty))}
                                                                            >
                                                                                {details.difficulty}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveProblem(problem.id)}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label>Uploaded Files ({ideFiles.length})</Label>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setShowIdeFileModal(true)}>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Manage Files
                                                </Button>
                                            </div>
                                            {ideFiles.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Upload question PDF and dataset files for this IDE assignment.
                                                </p>
                                            ) : (
                                                <ScrollArea className="h-[200px]">
                                                    <div className="space-y-2">
                                                        {ideFiles.map((file) => (
                                                            <div key={file.name} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-medium">{file.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveIdeFile(file.name)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Buttons */}
                                    <div className="flex flex-col gap-2 pt-4">
                                        <Button type="submit" disabled={loading} className="w-full">
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Assignment
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate(`/courses/${courseId}/assignments`)}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Problem Selection / IDE Files */}
                    <div className="lg:col-span-2">
                        {assignmentType === "DSA" ? (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Add Problems</CardTitle>
                                            <CardDescription>
                                                Select existing problems or create new ones
                                            </CardDescription>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => setShowCreateProblemModal(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create New Problem
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search problems by title, tag, or difficulty..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    {loadingProblems ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : filteredProblems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No problems found</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {searchQuery ? "Try adjusting your search" : "Create your first problem to get started"}
                                            </p>
                                            <Button
                                                onClick={() => setShowCreateProblemModal(true)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Problem
                                            </Button>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[600px]">
                                            <div className="space-y-3">
                                                {filteredProblems.map((problem) => {
                                                    const isSelected = isProblemSelected(problem.id)
                                                    return (
                                                        <Card
                                                            key={problem.id}
                                                            className={cn(
                                                                "transition-all cursor-pointer hover:shadow-md",
                                                                isSelected && "ring-2 ring-primary"
                                                            )}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    const problemToRemove = problems.find(p => p.problemId === problem.id)
                                                                    if (problemToRemove) {
                                                                        handleRemoveProblem(problemToRemove.id)
                                                                    }
                                                                } else {
                                                                    handleAddProblem(problem.id)
                                                                }
                                                            }}
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <h3 className="font-semibold">{problem.title}</h3>
                                                                            {isSelected && (
                                                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                                            {problem.statement}
                                                                        </p>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <Badge className={getDifficultyColor(problem.difficulty)}>
                                                                                {problem.difficulty}
                                                                            </Badge>
                                                                            {problem.tags.slice(0, 3).map((tag) => (
                                                                                <Badge key={tag} variant="outline" className="text-xs">
                                                                                    {tag}
                                                                                </Badge>
                                                                            ))}
                                                                            {problem.tags.length > 3 && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    +{problem.tags.length - 3} more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={isSelected ? "default" : "outline"}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            if (isSelected) {
                                                                                const problemToRemove = problems.find(p => p.problemId === problem.id)
                                                                                if (problemToRemove) {
                                                                                    handleRemoveProblem(problemToRemove.id)
                                                                                }
                                                                            } else {
                                                                                handleAddProblem(problem.id)
                                                                            }
                                                                        }}
                                                                    >
                                                                        {isSelected ? (
                                                                            <>
                                                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                                Added
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Plus className="mr-1 h-3 w-3" />
                                                                                Add
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>IDE Assignment Files</CardTitle>
                                    <CardDescription>
                                        Upload question PDFs and datasets. Students will receive these files inside the online IDE explorer.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button type="button" onClick={() => setShowIdeFileModal(true)}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Files
                                    </Button>
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Supported files: PDF, CSV, XLSX, TXT, images, and code files.
                                    </div>
                                    {ideFiles.length > 0 ? (
                                        <div className="space-y-2">
                                            {ideFiles.map((file) => (
                                                <div key={file.name} className="flex items-center justify-between rounded-md border p-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{file.name}</div>
                                                        <div className="text-xs text-muted-foreground">{file.mimeType} • {Math.ceil(file.size / 1024)} KB</div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveIdeFile(file.name)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Problem Modal */}
            <CreateProblemModal
                open={showCreateProblemModal}
                onOpenChange={setShowCreateProblemModal}
                onProblemCreated={handleProblemCreated}
            />

            <Dialog open={showIdeFileModal} onOpenChange={setShowIdeFileModal}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Upload IDE Assignment Files</DialogTitle>
                        <DialogDescription>
                            Upload question and dataset files (for example, PDF, CSV, XLSX). These files will appear in the student IDE explorer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById("ide-file-upload-input")?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Files
                        </Button>
                        <input
                            id="ide-file-upload-input"
                            type="file"
                            multiple
                            className="hidden"
                            accept=".pdf,.csv,.xlsx,.xls,.txt,.ipynb,.py,.java,.c,.cpp,.json,.md,.png,.jpg,.jpeg"
                            onChange={handleUploadIdeFiles}
                        />

                        <ScrollArea className="h-52 rounded-md border p-2">
                            {ideFiles.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    No files uploaded yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ideFiles.map((file) => (
                                        <div key={file.name} className="flex items-center justify-between rounded-md border p-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">{file.name}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">{file.mimeType} • {Math.ceil(file.size / 1024)} KB</div>
                                            </div>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveIdeFile(file.name)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowIdeFileModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </BaseLayout>
    )
}