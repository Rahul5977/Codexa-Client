"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Problem } from "@/api/services/problem"
import { type RunCodeResult, type SubmissionResult } from "@/api/services/submission"

interface TestCase {
  id: string
  input: string
  expectedOutput: string
  actualOutput?: string
  status?: 'pending' | 'passed' | 'failed' | 'error' | 'running'
  executionTime?: number
  isCustom?: boolean
}

interface TestCasesProps {
  problem?: Problem | null
  loading?: boolean
  runResult?: RunCodeResult | null
  submission?: SubmissionResult | null
  isRunning?: boolean
}

export function TestCases({ problem, loading, runResult, submission, isRunning }: TestCasesProps) {
  
  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'error':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'running':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending':
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Build test cases from problem or results
  const testCases: TestCase[] = []
  
  if (problem?.examples) {
    problem.examples.forEach((example, index) => {
      testCases.push({
        id: `example-${index}`,
        input: example.input,
        expectedOutput: example.output,
        status: isRunning ? 'running' : 'pending'
      })
    })
  }

  // Show run result
  if (runResult && testCases.length > 0) {
    testCases[0] = {
      ...testCases[0],
      actualOutput: runResult.stdout || runResult.stderr || runResult.compile_output || 'No output',
      status: runResult.status === 'Accepted' ? 'passed' : runResult.stderr || runResult.compile_output ? 'error' : 'failed',
      executionTime: runResult.time ? parseFloat(runResult.time) * 1000 : undefined
    }
  }

  // Show submission result
  if (submission && testCases.length > 0) {
    const submissionStatus = submission.status
    let status: TestCase['status'] = 'pending'
    
    if (submissionStatus === 'PENDING' || submissionStatus === 'PROCESSING') {
      status = 'running'
    } else if (submissionStatus === 'ACCEPTED') {
      status = 'passed'
    } else if (submissionStatus === 'WRONG_ANSWER') {
      status = 'failed'
    } else {
      status = 'error'
    }
    
    testCases.forEach((tc, index) => {
      testCases[index] = {
        ...tc,
        actualOutput: submission.stdout || submission.stderr || 'Processing...',
        status: status,
        executionTime: submission.time ? parseFloat(submission.time) * 1000 : undefined
      }
    })
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">

      <div className="flex-1 bg-linear-to-b from-transparent to-muted/5">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {testCases.length === 0 ? (
              <Card className="p-8 text-center border-border/50">
                <p className="text-muted-foreground">No test cases available. Run your code to see results.</p>
              </Card>
            ) : (
              testCases.map((testCase, index) => (
                <Card key={testCase.id} className="p-4 border-border/50 shadow-sm hover:shadow-md transition-all bg-linear-to-br from-muted/10 to-background">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(testCase.status)}
                      <div>
                        <span className="font-bold text-base">
                          Test Case {index + 1}
                          {testCase.isCustom && " (Custom)"}
                        </span>
                        <Badge className={cn("text-xs font-semibold ml-2", getStatusColor(testCase.status))}>
                          {testCase.status || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    {testCase.executionTime && (
                      <Badge variant="outline" className="text-xs px-2 py-1 border-muted-foreground/20">
                        ⚡ {testCase.executionTime.toFixed(2)}ms
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-muted-foreground font-semibold mb-1.5 text-xs uppercase tracking-wide">Input:</div>
                      <code className="text-xs bg-muted/50 p-2.5 rounded-lg block font-mono border border-border/30">
                        {testCase.input}
                      </code>
                    </div>

                    <div>
                      <div className="text-muted-foreground font-semibold mb-1.5 text-xs uppercase tracking-wide">Expected Output:</div>
                      <code className="text-xs bg-muted/50 p-2.5 rounded-lg block font-mono border border-border/30">
                        {testCase.expectedOutput}
                      </code>
                    </div>

                    {testCase.actualOutput && (
                      <div>
                        <div className="text-muted-foreground font-semibold mb-1.5 text-xs uppercase tracking-wide">Actual Output:</div>
                        <code className={cn(
                          "text-xs p-2.5 rounded-lg block font-mono border whitespace-pre-wrap",
                          testCase.status === 'passed'
                            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"
                            : testCase.status === 'error'
                            ? "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50"
                            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"
                        )}>
                          {testCase.actualOutput}
                        </code>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
