"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react"
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
  isHidden?: boolean
}

interface TestCasesProps {
  problem?: Problem | null
  loading?: boolean
  runResults?: RunCodeResult[]
  submission?: SubmissionResult | null
  isRunning?: boolean
  teacherTestCases?: { testcases: { input: string; output: string }[]; hiddenTestcases: { input: string; output: string }[] } | null
  customTestCases?: Array<{ id: string; input: string; expectedOutput: string }>
  onCustomTestCaseChange?: (id: string, field: "input" | "expectedOutput", value: string) => void
  onCustomTestCaseRemove?: (id: string) => void
}

export function TestCases({
  problem,
  loading,
  runResults,
  submission,
  isRunning,
  teacherTestCases,
  customTestCases = [],
  onCustomTestCaseChange,
  onCustomTestCaseRemove,
}: TestCasesProps) {

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

  // If teacher test cases are provided, use them instead of problem examples
  if (teacherTestCases) {
    teacherTestCases.testcases.forEach((tc, index) => {
      testCases.push({
        id: `visible-${index}`,
        input: tc.input,
        expectedOutput: tc.output,
        status: isRunning ? 'running' : 'pending',
        isHidden: false
      })
    })
    teacherTestCases.hiddenTestcases.forEach((tc, index) => {
      testCases.push({
        id: `hidden-${index}`,
        input: tc.input,
        expectedOutput: tc.output,
        status: isRunning ? 'running' : 'pending',
        isHidden: true
      })
    })
  } else if (problem?.examples) {
    problem.examples.forEach((example, index) => {
      testCases.push({
        id: `example-${index}`,
        input: example.input,
        expectedOutput: example.output,
        status: isRunning ? 'running' : 'pending'
      })
    })
  }

  customTestCases.forEach((testCase) => {
    testCases.push({
      id: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      status: isRunning ? 'running' : 'pending',
      isCustom: true,
    })
  })

  // Show run result - takes priority over submission
  if (runResults && runResults.length > 0) {
    console.log('Processing run results:', runResults)
    runResults.forEach((runResult, index) => {
      if (testCases[index] && runResult) {
        const actualOut = (runResult.stdout || '').trim()
        const expectedOut = testCases[index].expectedOutput.trim()
        const isCorrect = expectedOut === ''
          ? !(runResult.stderr || runResult.compile_output)
          : actualOut === expectedOut

        console.log(`Test case ${index + 1}:`, {
          actualOutput: actualOut,
          expectedOutput: expectedOut,
          isCorrect,
          status: runResult.status
        })

        testCases[index] = {
          ...testCases[index],
          actualOutput: runResult.stdout || runResult.stderr || runResult.compile_output || 'No output',
          status: runResult.stderr || runResult.compile_output ? 'error' :
            isCorrect ? 'passed' : 'failed',
          executionTime: runResult.time ? parseFloat(runResult.time) * 1000 : undefined
        }
      }
    })
  }
  // Show submission result only if no run results
  else if (submission && testCases.length > 0) {
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
      {/* Run Results Summary Header */}
      {runResults && runResults.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-lg">Run Results</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(
                    "text-sm font-semibold px-3 py-1",
                    testCases.every(tc => tc.status === 'passed') ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      testCases.some(tc => tc.status === 'error') ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {testCases.filter(tc => tc.status === 'passed').length} / {testCases.length} Passed
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        {testCase.isHidden && (
                          <Badge className="text-xs font-semibold ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Hidden
                          </Badge>
                        )}
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
                      <div className="text-muted-foreground font-semibold mb-1">Input:</div>
                      {testCase.isCustom && onCustomTestCaseChange ? (
                        <Textarea
                          value={testCase.input}
                          onChange={(e) => onCustomTestCaseChange(testCase.id, "input", e.target.value)}
                          rows={3}
                          placeholder="Enter custom input"
                          className="font-mono"
                        />
                      ) : (
                        <pre className="text-foreground bg-muted/30 p-2 rounded border border-border/50 whitespace-pre-wrap break-words text-sm font-mono">
                          {testCase.input}
                        </pre>
                      )}
                    </div>

                    <div>
                      <div className="text-muted-foreground font-semibold mb-1">Expected Output:</div>
                      {testCase.isCustom && onCustomTestCaseChange ? (
                        <Textarea
                          value={testCase.expectedOutput}
                          onChange={(e) => onCustomTestCaseChange(testCase.id, "expectedOutput", e.target.value)}
                          rows={3}
                          placeholder="Optional for custom tests"
                          className="font-mono"
                        />
                      ) : (
                        <pre className="text-primary font-semibold bg-muted/30 p-2 rounded border border-border/50 whitespace-pre-wrap break-words text-sm font-mono">
                          {testCase.expectedOutput}
                        </pre>
                      )}
                    </div>

                    {testCase.isCustom && onCustomTestCaseRemove && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onCustomTestCaseRemove(testCase.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove Custom Test
                        </Button>
                      </div>
                    )}

                    {testCase.actualOutput && (
                      <div>
                        <div className="text-muted-foreground font-semibold mb-1">Actual Output:</div>
                        <pre className={cn(
                          "p-2 rounded border whitespace-pre-wrap break-words text-sm font-mono",
                          testCase.status === 'passed'
                            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50 font-semibold"
                            : testCase.status === 'error'
                              ? "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50"
                              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"
                        )}>
                          {testCase.actualOutput}
                        </pre>
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