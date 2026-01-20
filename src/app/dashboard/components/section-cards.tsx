import { TrendingUp, Code2, Target, Zap, Brain, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/api/use-dashboard"

export function SectionCards() {
  const { data: stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                --
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="@container/card col-span-full">
          <CardHeader>
            <CardDescription className="text-red-500">Error loading dashboard stats</CardDescription>
            <CardTitle className="text-sm text-muted-foreground">{error}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Problems Solved</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            {stats.solvedProblems}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              {stats.acceptanceRate}% acceptance
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.solvedProblems} of {stats.totalProblems} problems <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.attemptedProblems} attempted problems
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Streak</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            🔥 {stats.currentStreak} days
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Longest: {stats.longestStreak} days <Target className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Keep solving to maintain streak!
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Contest Rating</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            {stats.contestRating}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Rank #{stats.rankPosition.toLocaleString()}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Competitive Programming Rating <Zap className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Top performer in contests
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>AI Analysis Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            {stats.aiAnalysisScore}/100
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Improving
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Code quality analysis <Brain className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Based on solution patterns
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
