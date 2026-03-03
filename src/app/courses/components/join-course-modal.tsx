import React from "react"
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
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, Info } from "lucide-react"

const joinCourseSchema = z.object({
  code: z
    .string()
    .min(1, "Course code is required")
    .length(6, "Course code must be exactly 6 characters")
    .regex(/^[A-Z0-9]+$/, "Course code must contain only uppercase letters and numbers"),
})

type JoinCourseFormData = z.infer<typeof joinCourseSchema>

interface JoinCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: JoinCourseFormData) => Promise<void>
}

export function JoinCourseModal({ open, onOpenChange, onSubmit }: JoinCourseModalProps) {
  const form = useForm<JoinCourseFormData>({
    resolver: zodResolver(joinCourseSchema),
    defaultValues: {
      code: "",
    },
  })

  const isLoading = form.formState.isSubmitting

  const handleSubmit = async (data: JoinCourseFormData) => {
    try {
      // Convert to uppercase
      const submitData = {
        code: data.code.toUpperCase(),
      }
      await onSubmit(submitData)
      form.reset()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const formattedCode = value.toUpperCase().slice(0, 6)
    form.setValue("code", formattedCode)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Join Course</DialogTitle>
              <DialogDescription>
                Enter the 6-character course code provided by your teacher.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Course codes are case-insensitive and contain only letters and numbers.
            Ask your teacher for the course code if you don't have it.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC123"
                      className="text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                      {...field}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the exact 6-character code (e.g., ABC123)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Course
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}