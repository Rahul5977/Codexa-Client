import { TrendingUp, Code2, Target, Zap, Brain } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Problems Solved</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            23
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +5 this week
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Great progress this week <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            8 Easy, 12 Medium, 3 Hard
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Streak</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            🔥 7 days
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
            Keep the momentum going <Target className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Longest streak: 15 days
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Contest Rating</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-yellow-500" />
            1,847
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +127
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Specialist rank achieved <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Global rank: #2,345</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>AI Analysis Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            92%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +8.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Excellent code quality <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Avg complexity: O(n log n)</div>
        </CardFooter>
      </Card>
    </div>
  )
}
