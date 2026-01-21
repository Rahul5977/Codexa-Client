"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Problem } from "@/api/types/dashboard"

interface TestCase {
  id: string
  input: string
  expectedOutput: string
  actualOutput?: string
  status?: 'pending' | 'passed' | 'failed' | 'error'
  executionTime?: number
  isCustom?: boolean
}

interface TestCasesProps {
  problem?: Problem | null
  loading?: boolean
}

const SAMPLE_TEST_CASES: TestCase[] = [
  {
    id: "1",
    input: "nums = [2,7,11,15], target = 9",
    expectedOutput: "[0,1]",
    status: 'passed',
    actualOutput: "[0,1]",
    executionTime: 12
  },
  {
    id: "2",
    input: "nums = [3,2,4], target = 6",
    expectedOutput: "[1,2]",
    status: 'passed',
    actualOutput: "[1,2]",
    executionTime: 8
  },
  {
    id: "3",
    input: "nums = [3,3], target = 6",
    expectedOutput: "[0,1]",
    status: 'failed',
    actualOutput: "[1,0]",
    executionTime: 15
  }
]

export function TestCases({ loading }: TestCasesProps) {

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
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
      case 'pending':
      default:
        return 'bg-muted text-muted-foreground'
    }
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

      {/* Content */}
      <div className="flex-1 bg-linear-to-b from-transparent to-muted/5">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {SAMPLE_TEST_CASES.map((testCase, index) => (
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
                      ⚡ {testCase.executionTime}ms
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
                        "text-xs p-2.5 rounded-lg block font-mono border",
                        testCase.status === 'passed'
                          ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50"
                          : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"
                      )}>
                        {testCase.actualOutput}
                      </code>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
