"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Target, TrendingUp, Flame, Code2, Award } from "lucide-react"
import { getUserAnalytics, type UserAnalytics } from "@/api/services/analytics"
import { toast } from "sonner"

interface UserStatsCardProps {
  userId: string
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const data = await getUserAnalytics(userId)
        setAnalytics(data)
      } catch (error: any) {
        console.error("Failed to fetch analytics:", error)
        // Set default empty analytics on error
        setAnalytics({
          overview: {
            totalSolved: 0,
            totalAttempted: 0,
            successRate: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
          },
          streaks: {
            current: 0,
            max: 0,
            lastActive: null,
          },
          activityHeatmap: {},
          topicStrengths: [],
          efficiencyStats: {},
          languageStats: {},
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Always show stats, even if they're all 0
  const { overview, streaks, globalRank } = analytics || {
    overview: {
      totalSolved: 0,
      totalAttempted: 0,
      successRate: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
    },
    streaks: {
      current: 0,
      max: 0,
      lastActive: null,
    },
    globalRank: null,
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Solved */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Solved
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSolved}</div>
            <p className="text-xs text-muted-foreground">
              out of {overview.totalAttempted} attempted
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalSolved}/{overview.totalAttempted} problems
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streaks.current}</div>
            <p className="text-xs text-muted-foreground">
              Max: {streaks.max} days
            </p>
          </CardContent>
        </Card>

        {/* Global Rank */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Global Rank
            </CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {globalRank ? `#${globalRank.rank}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {globalRank ? `Top ${globalRank.percentile.toFixed(1)}%` : 'No ranking yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Problem Difficulty Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge className="mb-2 bg-green-500 hover:bg-green-600">
                Easy
              </Badge>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {overview.easySolved}
              </div>
              <p className="text-xs text-muted-foreground mt-1">solved</p>
            </div>
            <div className="text-center">
              <Badge className="mb-2 bg-yellow-500 hover:bg-yellow-600">
                Medium
              </Badge>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {overview.mediumSolved}
              </div>
              <p className="text-xs text-muted-foreground mt-1">solved</p>
            </div>
            <div className="text-center">
              <Badge className="mb-2 bg-red-500 hover:bg-red-600">
                Hard
              </Badge>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {overview.hardSolved}
              </div>
              <p className="text-xs text-muted-foreground mt-1">solved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Stats */}
      {analytics?.languageStats && Object.keys(analytics.languageStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Most Used Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.languageStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([lang, count]) => (
                  <Badge key={lang} variant="outline" className="text-sm">
                    {lang}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
