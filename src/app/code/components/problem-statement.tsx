"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, TrendingUp, Building2, Code2, FileText, History, XCircle, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Problem } from "@/api/services/problem"
import { Hints } from "./hints"
import { useSubmissionHistory } from "@/hooks/api/use-submissions"
import { useAuth } from "@/contexts/auth-context"

interface ProblemStatementProps {
  problem: Problem | null
  loading: boolean
  error: string | null
  activeTab?: "description" | "submissions" | "hints"
  onTabChange?: (tab: "description" | "submissions" | "hints") => void
}

// Map SubmissionStatus from backend to display format
const mapSubmissionStatus = (status: string): 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' => {
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

export function ProblemStatement({ problem, loading, error, activeTab: externalActiveTab, onTabChange }: ProblemStatementProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("description")
  const { user } = useAuth()
  const { submissions, loading: submissionsLoading, fetch: fetchSubmissions } = useSubmissionHistory(user?.id, problem?.id)
  
  // Use external tab if provided, otherwise use internal
  const activeTab = externalActiveTab || internalActiveTab
  const handleTabChange = (value: string) => {
    const tab = value as "description" | "submissions" | "hints"
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  // Fetch submissions when tab changes to submissions
  useEffect(() => {
    if (activeTab === 'submissions' && user && problem?.id) {
      fetchSubmissions()
    }
  }, [activeTab, user, problem?.id, fetchSubmissions])

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

  const getSubmissionStatusColor = (status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error') => {
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

  const getSubmissionStatusIcon = (status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error') => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'Wrong Answer':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'Time Limit Exceeded':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'Compilation Error':
        return <Code2 className="h-4 w-4 text-purple-500" />
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
            <TabsTrigger value="hints" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium">Hints</span>
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
                  {problem.status && getStatusIcon(problem.status)}
                  <h1 className="text-2xl font-bold tracking-tight">{problem.id}. {problem.title}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={cn("text-xs font-semibold px-3 py-1", getDifficultyColor(problem.difficulty))}>
                    {problem.difficulty}
                  </Badge>
                  {problem.acceptance && (
                    <Badge variant="outline" className="text-xs px-3 py-1 border-muted-foreground/20">
                      <TrendingUp className="h-3 w-3 mr-1.5" />
                      {problem.acceptance} Acceptance
                    </Badge>
                  )}
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
                  {problem.statement || "No description available for this problem."}
                </p>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Examples</h3>
                  <div className="space-y-6">
                    {problem.examples.map((example, index) => (
                      <div key={index} className="space-y-3">
                        <h4 className="font-semibold text-foreground">Example {index + 1}:</h4>
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground font-semibold min-w-22.5">Input:</span>
                            <span className="text-foreground">{example.input}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground font-semibold min-w-22.5">Output:</span>
                            <span className="text-primary font-semibold">{example.output}</span>
                          </div>
                          {example.explanation && (
                            <div className="flex gap-2">
                              <span className="text-muted-foreground font-semibold min-w-22.5">Explanation:</span>
                              <span className="text-muted-foreground">{example.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {problem.examples && problem.examples.length > 0 && <Separator className="bg-border/50" />}

              {/* Constraints */}
              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    Constraints
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {problem.constraints && problem.constraints.length > 0 && <Separator className="bg-border/50" />}

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

        <TabsContent value="hints" className="flex-1 m-0 h-full">
          <Hints problem={problem} />
        </TabsContent>

        <TabsContent value="submissions" className="flex-1 m-0 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-3">
              {submissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 overflow-x-auto">
                  {submissions && submissions.length > 0 ? (
                    submissions.map((submission) => {
                      const displayStatus = mapSubmissionStatus(submission.status)
                      const runtime = submission.time ? `${parseFloat(submission.time) * 1000}ms` : 'N/A'
                      const memory = submission.memory ? `${(submission.memory / 1024).toFixed(1)}MB` : 'N/A'
                      const timestamp = formatTimeAgo(submission.createdAt)
                    
                      return (
                        <Card key={submission.id} className="p-4 border-border/50 hover:shadow-md transition-all bg-linear-to-br from-muted/10 to-background">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-start gap-2 flex-1">
                            <div className="flex items-center gap-2">
                              {getSubmissionStatusIcon(displayStatus)}
                              <Badge className={cn("text-xs font-semibold", getSubmissionStatusColor(displayStatus))}>
                                {displayStatus}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-muted-foreground">Runtime:</span>
                                <span className="ml-2 font-medium">{runtime}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Memory:</span>
                                <span className="ml-2 font-medium">{memory}</span>
                              </div>
                              {submission.language && (
                                <div>
                                  <span className="text-muted-foreground">Language:</span>
                                  <span className="ml-2 font-medium capitalize">{submission.language}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {timestamp}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                      <p className="text-muted-foreground">
                        Start coding to see your submission history here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
