"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, XCircle, Clock, Code2, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { type SubmissionResult, getSubmissionById } from "@/api/services/submission"
import { toast } from "sonner"

interface SubmissionDetailsProps {
  submissionId: string | null
}

type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error'

const mapSubmissionStatus = (status: string): SubmissionStatus => {
  switch (status) {
    case 'ACCEPTED':
      return 'Accepted'
    case 'WRONG_ANSWER':
      return 'Wrong Answer'
    case 'TIME_LIMIT_EXCEEDED':
      return 'Time Limit Exceeded'
    case 'COMPILATION_ERROR':
      return 'Compilation Error'
    case 'ERROR':
    case 'MEMORY_LIMIT_EXCEEDED':
      return 'Runtime Error'
    default:
      return 'Runtime Error'
  }
}

const getSubmissionStatusColor = (status: SubmissionStatus) => {
  switch (status) {
    case 'Accepted':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'Wrong Answer':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'Time Limit Exceeded':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'Compilation Error':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'Runtime Error':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
}

const getSubmissionStatusIcon = (status: SubmissionStatus) => {
  switch (status) {
    case 'Accepted':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'Wrong Answer':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'Time Limit Exceeded':
      return <Clock className="h-5 w-5 text-orange-500" />
    case 'Compilation Error':
      return <Code2 className="h-5 w-5 text-purple-500" />
    case 'Runtime Error':
      return <Code2 className="h-5 w-5 text-yellow-500" />
  }
}

const formatTimeAgo = (date: string | Date) => {
  const now = new Date()
  const submittedAt = new Date(date)
  const diffMs = now.getTime() - submittedAt.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  return 'Just now'
}

export function SubmissionDetails({ submissionId }: SubmissionDetailsProps) {
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    if (submissionId) {
      fetchSubmission(submissionId)
    }
  }, [submissionId])

  const fetchSubmission = async (id: string) => {
    setLoading(true)
    try {
      const result = await getSubmissionById(id)
      setSubmission(result.submission)
    } catch (error) {
      console.error('Error fetching submission:', error)
      toast.error('Failed to load submission details')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (submission?.code) {
      try {
        await navigator.clipboard.writeText(submission.code)
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
        toast.success('Code copied to clipboard')
      } catch (err) {
        toast.error('Failed to copy code')
      }
    }
  }

  if (!submissionId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <Code2 className="h-20 w-20 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No Submission Selected</h3>
          <p className="text-sm">
            Click on a submission from the Submissions tab to view details
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full p-6 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p>Failed to load submission</p>
        </div>
      </div>
    )
  }

  const displayStatus = mapSubmissionStatus(submission.status)

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSubmissionStatusIcon(displayStatus)}
            <h2 className="text-2xl font-bold">{displayStatus}</h2>
          </div>
          <Badge className={cn("text-sm font-semibold px-4 py-1.5", getSubmissionStatusColor(displayStatus))}>
            {submission.status}
          </Badge>
        </div>

        <Separator />

        {/* Statistics Grid */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Runtime</div>
              <div className="text-2xl font-bold">
                {submission.time ? `${(parseFloat(submission.time) * 1000).toFixed(2)}ms` : 'N/A'}
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Memory</div>
              <div className="text-2xl font-bold">
                {submission.memory ? `${(submission.memory / 1024).toFixed(2)}MB` : 'N/A'}
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Language</div>
              <div className="text-2xl font-bold capitalize">
                {submission.language || 'Unknown'}
              </div>
            </Card>
          </div>
        </div>

        {/* Output/Error Messages */}
        {submission.stdout && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">Output</h3>
            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">{submission.stdout}</pre>
            </Card>
          </div>
        )}

        {submission.stderr && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-red-600 dark:text-red-400">Error</h3>
            <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">{submission.stderr}</pre>
            </Card>
          </div>
        )}

        <Separator />

        {/* Submitted Code */}
        {submission.code && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Your Code</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyCode}
                className="h-8"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <Card className="p-4 bg-muted/20">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                <code>{submission.code}</code>
              </pre>
            </Card>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground pt-4 border-t border-border/50">
          Submitted {formatTimeAgo(submission.createdAt)}
        </div>
      </div>
    </ScrollArea>
  )
}
