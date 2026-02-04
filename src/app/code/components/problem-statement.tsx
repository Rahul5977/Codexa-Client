"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, TrendingUp, Building2, Code2, FileText, History, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Problem } from "@/api/services/problem"

interface ProblemStatementProps {
  problem: Problem | null
  loading: boolean
  error: string | null
  activeTab?: "description" | "submissions"
  onTabChange?: (tab: "description" | "submissions") => void
}

interface Submission {
  id: number
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error'
  language: string
  runtime: string
  memory: string
  timestamp: string
}

const SAMPLE_SUBMISSIONS: Submission[] = [
  {
    id: 1,
    status: 'Accepted',
    language: 'JavaScript',
    runtime: '68ms',
    memory: '42.1MB',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    status: 'Wrong Answer',
    language: 'Python',
    runtime: '125ms',
    memory: '38.5MB',
    timestamp: '1 day ago'
  },
  {
    id: 3,
    status: 'Accepted',
    language: 'TypeScript',
    runtime: '72ms',
    memory: '43.2MB',
    timestamp: '2 days ago'
  },
  {
    id: 4,
    status: 'Time Limit Exceeded',
    language: 'Java',
    runtime: '>2000ms',
    memory: '65.3MB',
    timestamp: '3 days ago'
  }
]

export function ProblemStatement({ problem, loading, error, activeTab: externalActiveTab, onTabChange }: ProblemStatementProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("description")
  
  // Use external tab if provided, otherwise use internal
  const activeTab = externalActiveTab || internalActiveTab
  const handleTabChange = (value: string) => {
    const tab = value as "description" | "submissions"
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Problem</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Problem Not Found</CardTitle>
            <CardDescription>The requested problem could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  const getStatusIcon = (status: Problem['status']) => {
    switch (status) {
      case 'solved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'attempted':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'unsolved':
        return <Code2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSubmissionStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Wrong Answer':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'Time Limit Exceeded':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'Runtime Error':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const getSubmissionStatusIcon = (status: Submission['status']) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'Wrong Answer':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'Time Limit Exceeded':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'Runtime Error':
        return <Code2 className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="border-b border-border/50 bg-linear-to-r from-muted/30 to-muted/10 p-2 shadow-sm">
          <TabsList className="h-11 bg-transparent">
            <TabsTrigger value="description" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Description</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <History className="h-4 w-4" />
              <span className="font-medium">Submissions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="description" className="flex-1 m-0 flex flex-col overflow-y-auto">
          {/* Problem Header */}
          <div className="p-3 border-b border-border/50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(problem.status)}
                  <h1 className="text-2xl font-bold tracking-tight">{problem.id}. {problem.title}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={cn("text-xs font-semibold px-3 py-1", getDifficultyColor(problem.difficulty))}>
                    {problem.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-3 py-1 border-muted-foreground/20">
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    {problem.acceptance} Acceptance
                  </Badge>
                  {problem.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-3 py-1 bg-secondary/50 hover:bg-secondary/70 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Problem Content */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-6">
              {/* Description */}
              <div>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {problem.description || "No description available for this problem."}
                </p>
              </div>

              {/* Examples */}
              <div>
                <div className="space-y-4">
                  <h4 className="font-semibold mb-3 text-foreground">Example 1:</h4>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground font-semibold min-w-22.5">Input:</span>
                      <span className="text-foreground">nums = [2,7,11,15], target = 9</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground font-semibold min-w-22.5">Output:</span>
                      <span className="text-primary font-semibold">[0,1]</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground font-semibold min-w-22.5">Explanation:</span>
                      <span className="text-muted-foreground">Because nums[0] + nums[1] == 9, we return [0, 1].</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Constraints */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Constraints
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>2 ≤ nums.length ≤ 10⁴</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>-10⁹ ≤ nums[i] ≤ 10⁹</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>-10⁹ ≤ target ≤ 10⁹</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Only one valid answer exists.</span></li>
                </ul>
              </div>

              <Separator className="bg-border/50" />

              {/* Companies */}
              {problem.companies && problem.companies.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Asked by Companies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {problem.companies.map((company) => (
                      <Badge key={company} variant="outline" className="text-xs px-3 py-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="submissions" className="flex-1 m-0 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-3">
              <div className="space-y-3 overflow-x-auto">
                {SAMPLE_SUBMISSIONS.map((submission) => (
                  <Card key={submission.id} className="p-4 border-border/50 hover:shadow-md transition-all bg-linear-to-br from-muted/10 to-background">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          {getSubmissionStatusIcon(submission.status)}
                          <Badge className={cn("text-xs font-semibold", getSubmissionStatusColor(submission.status))}>
                            {submission.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Runtime:</span>
                            <span className="ml-2 font-medium">{submission.runtime}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Memory:</span>
                            <span className="ml-2 font-medium">{submission.memory}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {submission.timestamp}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {SAMPLE_SUBMISSIONS.length === 0 && (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground">
                    Start coding to see your submission history here.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
