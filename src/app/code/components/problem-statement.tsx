"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, TrendingUp, Building2, Code2, FileText, History, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Problem } from "@/api/services/problem"
import { Hints } from "./hints"
import { SubmissionsPanel } from "./submissions-panel"
import { useAuth } from "@/contexts/auth-context"

interface ProblemStatementProps {
  problem: Problem | null
  loading: boolean
  error: string | null
  activeTab?: "description" | "submissions" | "hints"
  onTabChange?: (tab: "description" | "submissions" | "hints") => void
  onSubmissionClick?: (submissionId: string) => void
  hideSubmissionsTab?: boolean
}

export function ProblemStatement({ problem, loading, error, activeTab: externalActiveTab, onTabChange, onSubmissionClick, hideSubmissionsTab = false }: ProblemStatementProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("description")
  const { user } = useAuth()

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
            {!hideSubmissionsTab && (
              <TabsTrigger value="submissions" className="gap-2">
                <History className="h-4 w-4" />
                <span className="font-medium">Submissions</span>
              </TabsTrigger>
            )}
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
                <div className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                  {problem.statement || "No description available for this problem."}
                </div>
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
                          <div>
                            <div className="text-muted-foreground font-semibold mb-1">Input:</div>
                            <pre className="text-foreground bg-muted/30 p-2 rounded border border-border/50 whitespace-pre-wrap break-words">{example.input}</pre>
                          </div>
                          <div>
                            <div className="text-muted-foreground font-semibold mb-1">Output:</div>
                            <pre className="text-primary font-semibold bg-muted/30 p-2 rounded border border-border/50 whitespace-pre-wrap break-words">{example.output}</pre>
                          </div>
                          {example.explanation && (
                            <div>
                              <div className="text-muted-foreground font-semibold mb-1">Explanation:</div>
                              <div className="text-muted-foreground bg-muted/20 p-2 rounded border border-border/50">{example.explanation}</div>
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

        {!hideSubmissionsTab && (
          <TabsContent value="submissions" className="flex-1 m-0 h-full">
            <SubmissionsPanel 
              problemId={problem.id}
              currentUserId={user?.id}
              onSubmissionClick={onSubmissionClick}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}