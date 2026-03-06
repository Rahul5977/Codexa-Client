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
import { Loader2, FileText } from "lucide-react"
import { getAllProblems, type Problem } from "@/api/services/problem"
import { useToast } from "@/hooks/use-toast"

const createExamSchema = z.object({
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
  problemIds: z
    .array(z.string())
    .min(1, "Select at least one problem"),
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

  const form = useForm<CreateExamFormData>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      startTime: "",
      duration: 60,
      problemIds: [],
    },
  })

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
    } catch (error) {
      // Error handling is done in parent component
    }
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

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                  setSelectedProblems([])
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
