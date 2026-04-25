"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { communityService, type CommunityContestAnalysis } from "@/api/services/community"
import { generateCustomAIAnalysis, type AIAnalysisReport } from "@/api/services/ai-analytics"
import { useToast } from "@/hooks/use-toast"

export default function CommunityRoomAnalysisPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<CommunityContestAnalysis | null>(null)
  const [aiInsights, setAiInsights] = useState<AIAnalysisReport | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const derivedMetrics = useMemo(() => {
    if (!analysis) return null

    const totalAttempts = analysis.problemBreakdown.reduce((sum, problem) => sum + problem.totalAttempts, 0)
    const totalAccepted = analysis.problemBreakdown.reduce((sum, problem) => sum + problem.acceptedSubmissions, 0)
    const activeParticipants = analysis.leaderboard.filter((entry) => entry.totalAttempts > 0).length
    const participants = analysis.overview.totalMembers || 0
    const participationRate = participants > 0 ? Math.round((activeParticipants / participants) * 100) : 0
    const accuracy = totalAttempts > 0 ? ((totalAccepted / totalAttempts) * 100).toFixed(1) : "0.0"
    const avgAttemptsPerProblem = analysis.problemBreakdown.length > 0
      ? (totalAttempts / analysis.problemBreakdown.length).toFixed(1)
      : "0.0"

    const hardestProblem = analysis.problemBreakdown
      .map((problem) => ({
        ...problem,
        solveRate: participants > 0 ? (problem.solvedCount / participants) * 100 : 0,
      }))
      .sort((left, right) => left.solveRate - right.solveRate)[0] || null

    const mostAttemptedProblem = [...analysis.problemBreakdown]
      .sort((left, right) => right.totalAttempts - left.totalAttempts)[0] || null

    const bestAccuracyUser = analysis.leaderboard
      .filter((entry) => entry.totalAttempts > 0)
      .map((entry) => ({
        ...entry,
        accuracy: entry.totalAttempts > 0 ? (entry.solvedCount / entry.totalAttempts) * 100 : 0,
      }))
      .sort((left, right) => right.accuracy - left.accuracy)[0] || null

    const fastestUser = [...analysis.leaderboard]
      .filter((entry) => entry.solvedCount > 0)
      .sort((left, right) => left.totalTimeSec - right.totalTimeSec)[0] || null

    return {
      totalAttempts,
      totalAccepted,
      activeParticipants,
      participationRate,
      accuracy,
      avgAttemptsPerProblem,
      hardestProblem,
      mostAttemptedProblem,
      bestAccuracyUser,
      fastestUser,
    }
  }, [analysis])

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!roomId) return

      try {
        setLoading(true)
        const data = await communityService.getAnalysis(roomId)
        setAnalysis(data)
      } catch (error: any) {
        toast({
          title: "Failed to load contest analysis",
          description: error?.message || "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchAnalysis()
  }, [roomId, toast])

  useEffect(() => {
    const generateAiInsights = async () => {
      if (!analysis || !derivedMetrics) return

      try {
        setAiLoading(true)

        const inputPayload = {
          overview: analysis.overview,
          leaderboard: analysis.leaderboard.map((entry, index) => ({
            rank: index + 1,
            name: entry.name,
            score: entry.score,
            solvedCount: entry.solvedCount,
            totalAttempts: entry.totalAttempts,
            totalTimeSec: entry.totalTimeSec,
          })),
          problemBreakdown: analysis.problemBreakdown,
          derivedMetrics,
        }

        const aiResult = await generateCustomAIAnalysis({
          code: JSON.stringify(inputPayload, null, 2),
          language: "json",
          status: "ACCEPTED",
          executionTimeMs: Number(analysis.overview.durationMinutes || 0) * 60 * 1000,
          memoryKb: derivedMetrics.totalAttempts,
          problemTitle: "Community Contest Post Analysis",
          difficulty: "MIXED",
        })

        setAiInsights(aiResult)
      } catch {
        setAiInsights(null)
      } finally {
        setAiLoading(false)
      }
    }

    void generateAiInsights()
  }, [analysis, derivedMetrics])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <BaseLayout title="Contest Analysis" description="Compare room performance after contest completion">
      <div className="@container/main px-4 lg:px-6 mt-4 space-y-4">
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to={`/community/rooms/${roomId}`}>Back to Room</Link>
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading analysis...</CardContent>
          </Card>
        ) : !analysis ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">No analysis data available.</CardContent>
          </Card>
        ) : !derivedMetrics ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Unable to compute analysis metrics.</CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Contest Overview</CardTitle>
                <CardDescription>High-level performance and participation summary</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="text-lg font-semibold">{analysis.overview.totalMembers}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Active Participants</p>
                  <p className="text-lg font-semibold">{derivedMetrics.activeParticipants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Participation Rate</p>
                  <p className="text-lg font-semibold">{derivedMetrics.participationRate}%</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Total Attempts</p>
                  <p className="text-lg font-semibold">{derivedMetrics.totalAttempts}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Overall Accuracy</p>
                  <p className="text-lg font-semibold">{derivedMetrics.accuracy}%</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Avg Attempts / Problem</p>
                  <p className="text-lg font-semibold">{derivedMetrics.avgAttemptsPerProblem}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Insights</CardTitle>
                  <CardDescription>Who led, who was fastest, and where the contest was hardest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Top Performer: <span className="font-medium">{analysis.leaderboard[0]?.name || "-"}</span></p>
                  <p>
                    Fastest Solver: <span className="font-medium">{derivedMetrics.fastestUser?.name || "-"}</span>
                    {derivedMetrics.fastestUser ? ` (${formatDuration(derivedMetrics.fastestUser.totalTimeSec)})` : ""}
                  </p>
                  <p>
                    Best Accuracy: <span className="font-medium">{derivedMetrics.bestAccuracyUser?.name || "-"}</span>
                    {derivedMetrics.bestAccuracyUser
                      ? ` (${Math.round((derivedMetrics.bestAccuracyUser.solvedCount / Math.max(1, derivedMetrics.bestAccuracyUser.totalAttempts)) * 100)}%)`
                      : ""}
                  </p>
                  <p>
                    Hardest Problem: <span className="font-medium">{derivedMetrics.hardestProblem?.title || "-"}</span>
                    {derivedMetrics.hardestProblem
                      ? ` (${(analysis.overview.totalMembers > 0
                        ? (derivedMetrics.hardestProblem.solvedCount / analysis.overview.totalMembers) * 100
                        : 0).toFixed(1)}% solve rate)`
                      : ""}
                  </p>
                  <p>
                    Most Attempted Problem: <span className="font-medium">{derivedMetrics.mostAttemptedProblem?.title || "-"}</span>
                    {derivedMetrics.mostAttemptedProblem ? ` (${derivedMetrics.mostAttemptedProblem.totalAttempts} attempts)` : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Post-Contest Insights</CardTitle>
                  <CardDescription>Automated recommendations generated from contest data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiLoading ? (
                    <p className="text-sm text-muted-foreground">Generating AI insights...</p>
                  ) : !aiInsights ? (
                    <p className="text-sm text-muted-foreground">AI insights unavailable right now. Core metrics above are still complete.</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{aiInsights.summary}</p>
                      {aiInsights.possibleOptimizations.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recommended focus areas</p>
                          <div className="space-y-1">
                            {aiInsights.possibleOptimizations.slice(0, 5).map((item, idx) => (
                              <p key={`ai-opt-${idx}`} className="text-sm">• {item}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Final Leaderboard</CardTitle>
                <CardDescription>Score, solve count, attempts, and cumulative solve time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.leaderboard.map((entry, index) => (
                  <div key={entry.userId} className="grid grid-cols-8 items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <p className="font-semibold">#{index + 1}</p>
                    <p className="col-span-2 truncate">{entry.name}</p>
                    <p className="text-right font-medium">{entry.score} pts</p>
                    <p className="text-right text-xs text-muted-foreground">Solved {entry.solvedCount}</p>
                    <p className="text-right text-xs text-muted-foreground">Attempts {entry.totalAttempts}</p>
                    <p className="text-right text-xs text-muted-foreground">{formatDuration(entry.totalTimeSec)}</p>
                    <Badge variant="outline" className="justify-self-end">
                      {entry.totalAttempts > 0 ? `${Math.round((entry.solvedCount / entry.totalAttempts) * 100)}%` : "0%"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problem Breakdown</CardTitle>
                <CardDescription>Difficulty-wise outcomes and per-problem efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.problemBreakdown.map((problem) => {
                  const solveRate = analysis.overview.totalMembers > 0
                    ? ((problem.solvedCount / analysis.overview.totalMembers) * 100).toFixed(1)
                    : "0.0"
                  const acceptanceRate = problem.totalAttempts > 0
                    ? ((problem.acceptedSubmissions / problem.totalAttempts) * 100).toFixed(1)
                    : "0.0"

                  return (
                    <div key={problem.problemId} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{problem.title}</p>
                        <Badge variant="outline">{problem.difficulty}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solve Rate: {solveRate}% • Acceptance: {acceptanceRate}% • Attempts: {problem.totalAttempts}
                        {problem.firstSolver ? ` • First Solver: ${problem.firstSolver.name}` : ""}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </BaseLayout>
  )
}
