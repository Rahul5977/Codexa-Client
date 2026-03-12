"use client"

import { useEffect, useState } from "react"
import { Flame, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserAnalytics } from "@/api/services/analytics"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface StreakIndicatorProps {
  className?: string
}

export function StreakIndicator({ className }: StreakIndicatorProps) {
  const { user } = useAuth()
  const [streak, setStreak] = useState<{ current: number; max: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const data = await getUserAnalytics(user.id)
        // Safely access streaks with fallback
        setStreak(data?.streaks || { current: 0, max: 0 })
      } catch (error: any) {
        console.error("Failed to fetch streak:", error)
        // Set default values on error
        setStreak({ current: 0, max: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchStreak()
  }, [user?.id])

  if (loading) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">--</span>
      </Badge>
    )
  }

  if (!streak || !user) {
    return null
  }

  const isOnStreak = streak.current > 0
  const streakColor = isOnStreak ? "text-orange-500" : "text-muted-foreground"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isOnStreak ? "default" : "outline"} 
            className={cn(
              "gap-1 cursor-pointer transition-all hover:scale-105",
              isOnStreak && "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400",
              className
            )}
          >
            <Flame className={cn("h-3 w-3", streakColor)} />
            <span className="text-xs font-semibold">
              {streak.current} {streak.current === 1 ? 'day' : 'days'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <div className="space-y-1">
            <p className="font-semibold">Current Streak: {streak.current} days</p>
            <p className="text-xs text-muted-foreground">Longest Streak: {streak.max} days</p>
            {!isOnStreak && (
              <p className="text-xs text-orange-500">Solve a problem today to start a streak!</p>
            )}
            {isOnStreak && (
              <p className="text-xs text-green-500">Keep it up! Don't break the streak!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
