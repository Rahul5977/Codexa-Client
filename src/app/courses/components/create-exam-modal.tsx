import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, FileText, Upload, X } from "lucide-react"
import { getAllProblems, type Problem } from "@/api/services/problem"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { AssignmentType, IdeAssignmentFile } from "@/api/services/assignment"
import { useToast } from "@/hooks/use-toast"

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

const ideFileSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  content: z.string(),
})

const createExamSchema = z
  .object({
    type: z.enum(["DSA", "IDE"]),
    title: z
      .string()
      .min(1, "Exam title is required")
      .max(100, "Exam title must be at most 100 characters"),
    subtitle: z
      .string()
      .max(200, "Subtitle must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must be at most 1000 characters")
      .optional(),
    startTime: z
      .string()
      .min(1, "Start date & time is required"),
    duration: z
      .number()
      .min(1, "Duration must be at least 1 minute")
      .max(600, "Duration cannot exceed 600 minutes"),
    problemIds: z.array(z.string()).optional().default([]),
    ideFiles: z.array(ideFileSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "DSA" && (!data.problemIds || data.problemIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["problemIds"],
        message: "Select at least one problem",
      })
    }

    if (data.type === "IDE" && (!data.ideFiles || data.ideFiles.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ideFiles"],
        message: "Upload at least one IDE file",
      })
    }
  })

export type CreateExamFormData = z.infer<typeof createExamSchema>

interface CreateExamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateExamFormData) => Promise<void>
}

export function CreateExamModal({ open, onOpenChange, onSubmit }: CreateExamModalProps) {
  const { toast } = useToast()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loadingProblems, setLoadingProblems] = useState(false)
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [ideFiles, setIdeFiles] = useState<IdeAssignmentFile[]>([])

  const form = useForm<CreateExamFormData>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      type: "DSA",
      title: "",
      subtitle: "",
      description: "",
      startTime: "",
      duration: 60,
      problemIds: [],
      ideFiles: [],
    },
  })
  const selectedType = form.watch("type")

  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    if (open) {
      fetchProblems()
    }
  }, [open])

  const fetchProblems = async () => {
    try {
      setLoadingProblems(true)
      const problemsData = await getAllProblems()
      setProblems(problemsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load problems",
        variant: "destructive",
      })
    } finally {
      setLoadingProblems(false)
    }
  }

  const handleProblemToggle = (problemId: string) => {
    const updatedSelection = selectedProblems.includes(problemId)
      ? selectedProblems.filter(id => id !== problemId)
      : [...selectedProblems, problemId]
    
    setSelectedProblems(updatedSelection)
    form.setValue("problemIds", updatedSelection)
  }

  const handleSubmit = async (data: CreateExamFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      setSelectedProblems([])
      setIdeFiles([])
    } catch (error) {
      // Error handling is done in parent component
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
        const nextFiles = [...previous, ...uniqueNewFiles]
        form.setValue("ideFiles", nextFiles)
        return nextFiles
      })

      toast({
        title: "Files Uploaded",
        description: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""} added`,
      })
    } catch (error) {
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
    const nextFiles = ideFiles.filter((file) => file.name !== name)
    setIdeFiles(nextFiles)
    form.setValue("ideFiles", nextFiles)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription>
                Set up a proctored exam with timer and problem selection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Exam Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        const nextType = value as AssignmentType
                        field.onChange(nextType)
                        if (nextType === "DSA") {
                          setIdeFiles([])
                          form.setValue("ideFiles", [])
                        } else {
                          setSelectedProblems([])
                          form.setValue("problemIds", [])
                        }
                      }}
                      className="grid gap-2"
                    >
                      <Label
                        htmlFor="exam-type-dsa"
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                      >
                        <RadioGroupItem id="exam-type-dsa" value="DSA" className="mt-0.5" />
                        <div>
                          <p className="font-medium">DSA</p>
                          <p className="text-sm text-muted-foreground">Problem-based exam with code submissions</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="exam-type-ide"
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                      >
                        <RadioGroupItem id="exam-type-ide" value="IDE" className="mt-0.5" />
                        <div>
                          <p className="font-medium">IDE</p>
                          <p className="text-sm text-muted-foreground">Workspace-based exam with uploaded files</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mid-Term Programming Exam"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the exam"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed exam instructions..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={600}
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedType === "DSA" ? (
              <div className="space-y-2">
                <FormLabel>Select Problems *</FormLabel>
                {loadingProblems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {problems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No problems available
                      </p>
                    ) : (
                      problems.map((problem) => (
                        <Card
                          key={problem.id}
                          className={`p-3 transition-colors ${
                            selectedProblems.includes(problem.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <Checkbox
                                checked={selectedProblems.includes(problem.id)}
                                onCheckedChange={() => handleProblemToggle(problem.id)}
                              />
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => handleProblemToggle(problem.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{problem.title}</span>
                                  <Badge
                                    variant={
                                      problem.difficulty === "EASY"
                                        ? "default"
                                        : problem.difficulty === "MEDIUM"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {problem.difficulty}
                                  </Badge>
                                </div>
                                {problem.tags && problem.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {problem.tags.slice(0, 3).map((tag, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {selectedProblems.length} problem(s) selected
                </p>
                {form.formState.errors.problemIds && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.problemIds.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <FormLabel>Upload IDE Files *</FormLabel>
                <div className="rounded-md border p-3 space-y-3">
                  <div>
                    <Input
                      type="file"
                      multiple
                      onChange={handleUploadIdeFiles}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload question documents and dataset files for the IDE exam.
                    </p>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {ideFiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">No files uploaded yet</p>
                    ) : (
                      ideFiles.map((file) => (
                        <div key={file.name} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{file.name}</span>
                            <span className="text-muted-foreground">({Math.ceil(file.size / 1024)} KB)</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIdeFile(file.name)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {form.formState.errors.ideFiles && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.ideFiles.message as string}
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                  setSelectedProblems([])
                  setIdeFiles([])
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Exam
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
