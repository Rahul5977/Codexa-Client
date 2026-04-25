"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { io } from "socket.io-client"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  communityService,
  type CommunityContestAnalysis,
  type CommunityLeaderboardEntry,
  type CommunityRoom,
  type RoomSubmission,
} from "@/api/services/community"
import { API_CONFIG } from "@/api/config"
import { generateCustomAIAnalysis, type AIAnalysisReport } from "@/api/services/ai-analytics"
import { useToast } from "@/hooks/use-toast"
import { Clock, Play, Square } from "lucide-react"

const LANGUAGE_NAMES: Record<number, string> = {
  63: "JavaScript",
  71: "Python",
  62: "Java",
  54: "C++",
  50: "C",
  60: "Go",
  74: "TypeScript",
}

export default function CommunityRoomPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get("invite")
  const { toast } = useToast()

  const [room, setRoom] = useState<CommunityRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingContest, setStartingContest] = useState(false)
  const [endingContest, setEndingContest] = useState(false)
  const [leaderboard, setLeaderboard] = useState<CommunityLeaderboardEntry[]>([])
  const [analysis, setAnalysis] = useState<CommunityContestAnalysis | null>(null)
  const [submissions, setSubmissions] = useState<RoomSubmission[]>([])
  const [aiInsights, setAiInsights] = useState<AIAnalysisReport | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null)

  const prevContestStatus = useRef<string | null>(null)
  const aiGeneratedForKey = useRef<string | null>(null)

  const contestStatus = room?.contest.status || "NOT_STARTED"
  const isContestActive = contestStatus === "ACTIVE"
  const isContestEnded = contestStatus === "ENDED"
  const isLobbyPhase = contestStatus === "NOT_STARTED"

  const derivedMetrics = useMemo(() => {
    if (!analysis) return null

    const totalAttempts = analysis.problemBreakdown.reduce((sum, problem) => sum + problem.totalAttempts, 0)
    const totalAccepted = analysis.problemBreakdown.reduce((sum, problem) => sum + problem.acceptedSubmissions, 0)
    const activeParticipants = analysis.leaderboard.filter((entry) => entry.totalAttempts > 0).length
    const participants = analysis.overview.totalMembers || 0
    const participationRate = participants > 0 ? Math.round((activeParticipants / participants) * 100) : 0
    const accuracy = totalAttempts > 0 ? ((totalAccepted / totalAttempts) * 100).toFixed(1) : "0.0"

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
        accuracy: (entry.solvedCount / entry.totalAttempts) * 100,
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
      hardestProblem,
      mostAttemptedProblem,
      bestAccuracyUser,
      fastestUser,
    }
  }, [analysis])

  const fetchRoom = async (options?: { silent?: boolean }) => {
    if (!roomId) return

    try {
      if (!options?.silent) {
        setLoading(true)
      }

      const data = await communityService.getRoomById(roomId)
      setRoom(data)

      if (data.contest.endedAt) {
        const diff = new Date(data.contest.endedAt).getTime() - Date.now()
        setTimeRemainingMs(Math.max(0, diff))
      } else {
        setTimeRemainingMs(null)
      }

      if (prevContestStatus.current && prevContestStatus.current !== data.contest.status && data.contest.status === "ACTIVE") {
        toast({ title: "Contest started", description: "Contest screen is now live for all room members." })
      }
      prevContestStatus.current = data.contest.status
    } catch (error: any) {
      toast({
        title: "Failed to load room",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  const fetchLeaderboard = async () => {
    if (!roomId) return
    try {
      const rows = await communityService.getLeaderboard(roomId)
      setLeaderboard(rows)
    } catch {
    }
  }

  const fetchAnalysis = async () => {
    if (!roomId || !isContestEnded) return
    try {
      const data = await communityService.getAnalysis(roomId)
      setAnalysis(data)
    } catch {
    }
  }

  const fetchSubmissions = async () => {
    if (!roomId || !isContestEnded) return
    try {
      const data = await communityService.getRoomSubmissions(roomId)
      setSubmissions(data)
    } catch {
      setSubmissions([])
    }
  }

  useEffect(() => {
    const joinIfNeeded = async () => {
      if (!inviteCode) {
        await fetchRoom()
        return
      }

      try {
        await communityService.joinRoomByInvite(inviteCode)
      } catch (error: any) {
        toast({
          title: "Join failed",
          description: error?.message || "Unable to join with this invite link",
          variant: "destructive",
        })
      } finally {
        await fetchRoom()
      }
    }

    void joinIfNeeded()
  }, [roomId, inviteCode])

  useEffect(() => {
    if (!roomId || isContestEnded) return

    void fetchLeaderboard()

    const socketBaseUrl = API_CONFIG.COMMUNITY_SERVICE_URL.replace(/\/api\/community\/?$/, "")
    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      withCredentials: true,
    })

    socket.on("connect", () => {
      socket.emit("room:join", roomId)
    })

    socket.on("room:updated", (payload: { roomId: string }) => {
      if (!payload?.roomId || payload.roomId !== roomId) return
      void fetchRoom({ silent: true })
      void fetchLeaderboard()
    })

    return () => {
      socket.emit("room:leave", roomId)
      socket.disconnect()
    }
  }, [roomId, isContestEnded])

  useEffect(() => {
    if (!room?.contest.endedAt || room.contest.status !== "ACTIVE") {
      setTimeRemainingMs(null)
      return
    }

    const tick = window.setInterval(() => {
      const remaining = new Date(room.contest.endedAt as string).getTime() - Date.now()
      setTimeRemainingMs(Math.max(0, remaining))
    }, 1000)

    return () => window.clearInterval(tick)
  }, [room?.contest.endedAt, room?.contest.status])

  useEffect(() => {
    if (!isContestEnded) {
      setAnalysis(null)
      setSubmissions([])
      setAiInsights(null)
      aiGeneratedForKey.current = null
      return
    }

    void fetchAnalysis()
    void fetchSubmissions()
  }, [isContestEnded, roomId])

  useEffect(() => {
    const generateAiInsights = async () => {
      if (!isContestEnded || !analysis || !derivedMetrics) {
        setAiInsights(null)
        aiGeneratedForKey.current = null
        return
      }

      const analysisKey = `${roomId}-${analysis.overview.endedAt}-${derivedMetrics.totalAttempts}-${derivedMetrics.totalAccepted}-${submissions.length}`
      if (aiGeneratedForKey.current === analysisKey && aiInsights) {
        return
      }

      try {
        setAiLoading(true)

        const problems = analysis.problemBreakdown.map((problem) => ({
          problemId: problem.problemId,
          title: problem.title,
          difficulty: problem.difficulty,
          solvedCount: problem.solvedCount,
          acceptedSubmissions: problem.acceptedSubmissions,
          totalAttempts: problem.totalAttempts,
          submissions: submissions
            .filter((submission) => submission.problemId === problem.problemId)
            .slice(0, 12)
            .map((submission) => ({
              userName: submission.userName,
              status: submission.status,
              language: LANGUAGE_NAMES[submission.languageId] || `Lang-${submission.languageId}`,
              executionTimeMs: submission.executionTime,
              memoryKb: submission.memory,
              submittedAt: submission.submittedAt,
              code: submission.code,
            })),
        }))

        const aiPromptPayload = {
          task: "contest_post_analysis",
          reportRequirements: {
            perProblemEfficiencyAnalysis: true,
            perUserOptimizationTips: true,
            shortOverallPerformanceReport: true,
          },
          instructions: [
            "Analyze actual submitted code per user and per problem.",
            "For each problem, compare approaches and mention likely time/space complexity.",
            "Provide optimization tips for each user's shown solution.",
            "Include a short overall contest performance report with patterns and recommendations.",
            "Keep feedback concrete and actionable.",
          ],
          overview: analysis.overview,
          leaderboard: analysis.leaderboard.map((entry, index) => ({
            rank: index + 1,
            name: entry.name,
            score: entry.score,
            solvedCount: entry.solvedCount,
            totalAttempts: entry.totalAttempts,
            totalTimeSec: entry.totalTimeSec,
          })),
          derivedMetrics,
          problems,
        }

        const report = await generateCustomAIAnalysis({
          code: JSON.stringify(aiPromptPayload, null, 2),
          language: "json",
          status: "ACCEPTED",
          executionTimeMs: Number(analysis.overview.durationMinutes || 0) * 60 * 1000,
          memoryKb: submissions.length,
          problemTitle: "Community Contest Post Analysis (Code Aware)",
          difficulty: "MIXED",
        })

        setAiInsights(report)
        aiGeneratedForKey.current = analysisKey
      } catch {
        setAiInsights(null)
        aiGeneratedForKey.current = null
      } finally {
        setAiLoading(false)
      }
    }

    void generateAiInsights()
  }, [isContestEnded, analysis, derivedMetrics, submissions, roomId, aiInsights])

  const handleStartContest = async () => {
    if (!roomId) return
    try {
      setStartingContest(true)
      await communityService.startContest(roomId)
      await fetchRoom()
      await fetchLeaderboard()
      toast({ title: "Contest started", description: "All users in room can now begin solving problems." })
    } catch (error: any) {
      toast({ title: "Failed to start contest", description: error?.message || "Please try again", variant: "destructive" })
    } finally {
      setStartingContest(false)
    }
  }

  const handleEndContest = async () => {
    if (!roomId) return
    try {
      setEndingContest(true)
      await communityService.endContest(roomId)
      await fetchRoom()
      await fetchLeaderboard()
      await fetchAnalysis()
      await fetchSubmissions()
      toast({ title: "Contest ended", description: "Final analysis is now available." })
    } catch (error: any) {
      toast({ title: "Failed to end contest", description: error?.message || "Please try again", variant: "destructive" })
    } finally {
      setEndingContest(false)
    }
  }

  const formatRemaining = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatExecutionTime = (value: number | null) => (value === null ? "-" : `${value} ms`)
  const formatMemory = (value: number | null) => (value === null ? "-" : `${value} KB`)
  const formatDelta = (value: number | null, unit: string) => {
    if (value === null) return "-"
    const sign = value > 0 ? "+" : ""
    const unitSuffix = unit ? ` ${unit}` : ""
    return `${sign}${value}${unitSuffix}`
  }

  return (
    <BaseLayout title="Community Room" description="Collaborative learning with friends">
      <div className="@container/main px-4 lg:px-6 mt-4 space-y-4">
        {isContestActive && timeRemainingMs !== null && (
          <Card>
            <CardContent className="py-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Time remaining: {formatRemaining(timeRemainingMs)}</span>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading room...</CardContent>
          </Card>
        ) : !room ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Room not found or access denied.</CardContent>
          </Card>
        ) : (
          <>
            {isLobbyPhase && (
              <Card>
                <CardHeader>
                  <CardTitle>Lobby Participants</CardTitle>
                  <CardDescription>{room.members.length} participant(s) joined</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {room.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <p className="font-medium text-sm">{member.name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant={member.role === "HOST" ? "default" : "secondary"}>{member.role}</Badge>
                    </div>
                  ))}

                  {room.isHost && (
                    <Button
                      className="w-full mt-2"
                      onClick={handleStartContest}
                      disabled={startingContest || room.problems.length === 0 || room.members.length < 2}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Contest
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {isContestActive && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Problems</CardTitle>
                    <CardDescription>All assigned contest problems</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {room.problems.map((problem) => (
                      <div key={problem.problemId} className="rounded-md border p-3 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{problem.title}</p>
                            <p className="text-xs text-muted-foreground">Solved by {problem.solvedCount} participant(s)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{problem.difficulty}</Badge>
                            <Button size="sm" onClick={() => navigate(`/code?id=${problem.problemId}&roomId=${roomId}`)}>
                              Solve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Leaderboard</CardTitle>
                    <CardDescription>Points update based on solve speed and attempts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No contest activity yet.</p>
                    ) : (
                      leaderboard.map((entry, index) => (
                        <div key={entry.userId} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">#{index + 1} {entry.name}</p>
                            <p className="text-xs text-muted-foreground">Solved {entry.solvedCount} • Attempts {entry.totalAttempts}</p>
                          </div>
                          <Badge>{entry.score} pts</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {isContestActive && room.isHost && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleEndContest} disabled={endingContest}>
                  <Square className="mr-2 h-4 w-4" />
                  End Contest
                </Button>
              </div>
            )}

            {isContestEnded && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Contest Analysis</CardTitle>
                  <CardDescription>Detailed post-contest report with AI insights.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!analysis ? (
                    <p className="text-sm text-muted-foreground">Loading analysis...</p>
                  ) : (
                    <>
                      {derivedMetrics && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Participants</p><p className="text-lg font-semibold text-primary">{analysis.overview.totalMembers}</p></div>
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Active Participants</p><p className="text-lg font-semibold text-primary">{derivedMetrics.activeParticipants}</p></div>
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Participation Rate</p><p className="text-lg font-semibold text-primary">{derivedMetrics.participationRate}%</p></div>
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Total Attempts</p><p className="text-lg font-semibold text-primary">{derivedMetrics.totalAttempts}</p></div>
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Overall Accuracy</p><p className="text-lg font-semibold text-primary">{derivedMetrics.accuracy}%</p></div>
                          <div className="rounded-md border border-primary/20 bg-background/85 p-3"><p className="text-xs text-muted-foreground">Problems</p><p className="text-lg font-semibold text-primary">{analysis.overview.totalProblems}</p></div>
                        </div>
                      )}

                      <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-primary/20 bg-card/90">
                          <CardHeader><CardTitle className="text-base">Top Insights</CardTitle></CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>Top Performer: <span className="font-medium">{analysis.leaderboard[0]?.name || "-"}</span></p>
                            <p>Fastest Solver: <span className="font-medium">{derivedMetrics?.fastestUser?.name || "-"}</span>{derivedMetrics?.fastestUser ? ` (${formatDuration(derivedMetrics.fastestUser.totalTimeSec)})` : ""}</p>
                            <p>Best Accuracy: <span className="font-medium">{derivedMetrics?.bestAccuracyUser?.name || "-"}</span></p>
                            <p>Hardest Problem: <span className="font-medium">{derivedMetrics?.hardestProblem?.title || "-"}</span></p>
                            <p>Most Attempted Problem: <span className="font-medium">{derivedMetrics?.mostAttemptedProblem?.title || "-"}</span></p>
                          </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-card/90">
                          <CardHeader><CardTitle className="text-base">AI Post-Contest Insights</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {aiLoading ? (
                              <p className="text-sm text-muted-foreground">Generating AI insights...</p>
                            ) : !aiInsights ? (
                              <p className="text-sm text-muted-foreground">AI insights unavailable right now.</p>
                            ) : (
                              <>
                                <p className="text-sm font-medium">{aiInsights.summary}</p>
                                {aiInsights.possibleOptimizations.slice(0, 4).map((item, index) => (
                                  <p key={`ai-${index}`} className="text-sm">• {item}</p>
                                ))}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border-primary/20 bg-card/90">
                        <CardHeader>
                          <CardTitle className="text-base">Problem-wise Code Analysis</CardTitle>
                          <CardDescription>Each problem includes the best contest code and your code for direct comparison.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {analysis.perProblemUserAnalysis.map((problem) => (
                              <AccordionItem key={problem.problemId} value={problem.problemId}>
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-left">
                                      <p className="text-sm font-semibold">{problem.title}</p>
                                      <p className="text-xs text-muted-foreground">Difficulty: {problem.difficulty || "-"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {problem.optimalSolution && (
                                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                          Optimal {problem.optimalSolution.efficiencyScore}
                                        </Badge>
                                      )}
                                      {problem.userSolution && (
                                        <Badge variant="outline" className="border-secondary/40 bg-secondary/80">
                                          Your {problem.userSolution.efficiencyScore}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                                      <p className="font-medium">Comparison Summary</p>
                                      <p className="text-muted-foreground">{problem.comparison.summary}</p>
                                      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
                                        <p>Efficiency Δ: {formatDelta(problem.comparison.efficiencyDelta, "pts")}</p>
                                        <p>Time Δ: {formatDelta(problem.comparison.timeDelta, "ms")}</p>
                                        <p>Memory Δ: {formatDelta(problem.comparison.memoryDelta, "KB")}</p>
                                        <p>Attempts Δ: {formatDelta(problem.comparison.attemptsDelta, "")}</p>
                                      </div>
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-2">
                                      <div className="rounded-md border border-primary/20 bg-background/90 p-3">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-sm font-semibold text-primary">Optimal Solution</p>
                                          {problem.optimalSolution && (
                                            <Badge variant="outline">{problem.optimalSolution.userName}</Badge>
                                          )}
                                        </div>
                                        {!problem.optimalSolution ? (
                                          <p className="text-xs text-muted-foreground">No accepted solution available.</p>
                                        ) : (
                                          <>
                                            <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                              <p>Language: {LANGUAGE_NAMES[problem.optimalSolution.languageId] || `Lang-${problem.optimalSolution.languageId}`}</p>
                                              <p>Attempts: {problem.optimalSolution.attemptsToSolve}</p>
                                              <p>Time: {formatExecutionTime(problem.optimalSolution.executionTime)}</p>
                                              <p>Memory: {formatMemory(problem.optimalSolution.memory)}</p>
                                            </div>
                                            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                                              <code>{problem.optimalSolution.code}</code>
                                            </pre>
                                          </>
                                        )}
                                      </div>

                                      <div className="rounded-md border border-secondary/30 bg-background/90 p-3">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-sm font-semibold">Your Solution</p>
                                          <Badge variant="secondary">{analysis.currentUser.name}</Badge>
                                        </div>
                                        {!problem.userSolution ? (
                                          <p className="text-xs text-muted-foreground">You did not submit this problem.</p>
                                        ) : (
                                          <>
                                            <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                              <p>Status: {problem.userSolution.status}</p>
                                              <p>Language: {LANGUAGE_NAMES[problem.userSolution.languageId] || `Lang-${problem.userSolution.languageId}`}</p>
                                              <p>Attempts: {problem.userSolution.attemptsToSolve}</p>
                                              <p>Time: {formatExecutionTime(problem.userSolution.executionTime)}</p>
                                              <p>Memory: {formatMemory(problem.userSolution.memory)}</p>
                                            </div>
                                            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                                              <code>{problem.userSolution.code}</code>
                                            </pre>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>

                      <Card className="border-primary/20 bg-card/90">
                        <CardHeader><CardTitle className="text-base">Final Leaderboard</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {analysis.leaderboard.map((entry, index) => (
                            <div key={entry.userId} className="grid grid-cols-8 items-center gap-2 rounded-md border px-3 py-2 text-sm">
                              <p className="font-semibold">#{index + 1}</p>
                              <p className="col-span-2 truncate">{entry.name}</p>
                              <p className="text-right font-medium">{entry.score} pts</p>
                              <p className="text-right text-xs text-muted-foreground">Solved {entry.solvedCount}</p>
                              <p className="text-right text-xs text-muted-foreground">Attempts {entry.totalAttempts}</p>
                              <p className="text-right text-xs text-muted-foreground">{formatDuration(entry.totalTimeSec)}</p>
                              <Badge variant="outline" className="justify-self-end">{entry.totalAttempts > 0 ? `${Math.round((entry.solvedCount / entry.totalAttempts) * 100)}%` : "0%"}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </BaseLayout>
  )
}
