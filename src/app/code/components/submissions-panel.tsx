"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, Code2, XCircle, History, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubmissionHistory } from "@/hooks/api/use-submissions"

interface SubmissionsPanelProps {
  problemId: string
  currentUserId?: string
  onSubmissionClick?: (submissionId: string) => void
}

// Language mapping
const LANGUAGE_ID_TO_NAME: Record<number, string> = {
  50: "C",
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
  72: "Ruby",
  73: "Rust",
  74: "TypeScript",
  78: "Kotlin",
  60: "Go",
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

export function SubmissionsPanel({ problemId, currentUserId, onSubmissionClick }: SubmissionsPanelProps) {
  const [showMySubmissions, setShowMySubmissions] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<number[]>([])
  
  // Determine which submissions to fetch
  const shouldFetchAll = !showMySubmissions
  const userId = showMySubmissions ? currentUserId : undefined
  const status = shouldFetchAll ? 'ACCEPTED' : undefined
  const languageIds = selectedLanguages.length > 0 ? selectedLanguages : undefined
  
  const { submissions, loading, fetch: fetchSubmissions } = useSubmissionHistory(
    userId,
    problemId,
    status,
    languageIds,
    shouldFetchAll // Include user info when showing all submissions
  )

  // Fetch all submissions initially to determine available languages
  const { submissions: allSubmissions, fetch: fetchAllSubmissions } = useSubmissionHistory(
    undefined, // All users
    problemId,
    showMySubmissions ? undefined : 'ACCEPTED', // Only accepted if showing all submissions
    undefined, // No language filter
    false // Don't need user info for language extraction
  )

  // Fetch all submissions once to get available languages
  useEffect(() => {
    if (problemId) {
      fetchAllSubmissions()
    }
  }, [problemId, showMySubmissions, fetchAllSubmissions])

  // Extract available languages from all submissions
  useEffect(() => {
    const languages = new Set<number>()
    allSubmissions.forEach(sub => {
      if (sub.languageId) {
        languages.add(sub.languageId)
      }
    })
    setAvailableLanguages(Array.from(languages).sort())
  }, [allSubmissions])

  // Fetch filtered submissions when filters change
  useEffect(() => {
    if (problemId && (selectedLanguages.length > 0 || showMySubmissions)) {
      fetchSubmissions()
    }
  }, [problemId, selectedLanguages, showMySubmissions, fetchSubmissions])

  // Display submissions from filtered or all submissions
  const displaySubmissions = selectedLanguages.length > 0 || showMySubmissions ? submissions : allSubmissions

  const toggleLanguage = (langId: number) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langId)) {
        return prev.filter(id => id !== langId)
      } else {
        return [...prev, langId]
      }
    })
  }

  const toggleMySubmissions = () => {
    setShowMySubmissions(prev => !prev)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter chips */}
      <div className="p-3 border-b border-border/50 bg-muted/20">
        <div className="flex flex-wrap gap-2">
          {/* My Solutions chip */}
          {currentUserId && (
            <Badge
              variant={showMySubmissions ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                showMySubmissions 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10"
              )}
              onClick={toggleMySubmissions}
            >
              <User className="h-3 w-3 mr-1" />
              My Solutions
            </Badge>
          )}
          
          {/* Language filter chips */}
          {availableLanguages.map((langId) => (
            <Badge
              key={langId}
              variant={selectedLanguages.includes(langId) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                selectedLanguages.includes(langId)
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "hover:bg-blue-500/10"
              )}
              onClick={() => toggleLanguage(langId)}
            >
              <Code2 className="h-3 w-3 mr-1" />
              {LANGUAGE_ID_TO_NAME[langId] || `Lang ${langId}`}
            </Badge>
          ))}
        </div>
        
        {/* Active filter description */}
        <div className="mt-2 text-xs text-muted-foreground">
          {showMySubmissions 
            ? "Showing all your submissions (correct and incorrect)" 
            : "Showing all correct submissions from the community"}
          {selectedLanguages.length > 0 && ` • Filtered by ${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Submissions list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {displaySubmissions && displaySubmissions.length > 0 ? (
                displaySubmissions.map((submission) => {
                  const displayStatus = mapSubmissionStatus(submission.status)
                  const runtime = submission.time ? `${parseFloat(submission.time) * 1000}ms` : 'N/A'
                  const memory = submission.memory ? `${(submission.memory / 1024).toFixed(1)}MB` : 'N/A'
                  const timestamp = formatTimeAgo(submission.createdAt)
                  const isCurrentUserSubmission = submission.userId === currentUserId
                  const displayName = submission.user?.name || "Anonymous"

                  return (
                    <Card
                      key={submission.id}
                      className={cn(
                        "p-4 border-border/50 hover:shadow-md transition-all cursor-pointer hover:border-primary/30 bg-linear-to-br from-muted/10 to-background",
                        isCurrentUserSubmission && "border-primary/50 bg-primary/5"
                      )}
                      onClick={() => onSubmissionClick?.(submission.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-start gap-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getSubmissionStatusIcon(displayStatus)}
                            <Badge className={cn("text-xs font-semibold", getSubmissionStatusColor(displayStatus))}>
                              {displayStatus}
                            </Badge>
                            {submission.language && (
                              <Badge variant="outline" className="text-xs">
                                {submission.language}
                              </Badge>
                            )}
                            {!showMySubmissions && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-xs",
                                  isCurrentUserSubmission && "bg-primary/20 text-primary"
                                )}
                              >
                                <User className="h-3 w-3 mr-1" />
                                {isCurrentUserSubmission ? "You" : displayName}
                              </Badge>
                            )}
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
                    {showMySubmissions 
                      ? "You haven't submitted any solutions yet." 
                      : "No correct submissions found for this problem."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
