"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Flame } from "lucide-react"
import { getActivityHeatmap, type ActivityHeatmap } from "@/api/services/analytics"
import { cn } from "@/lib/utils"

interface ActivityHeatmapProps {
  userId: string
}

export function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const [heatmap, setHeatmap] = useState<ActivityHeatmap | null>(null)
  const [loading, setLoading] = useState(true)

  const formatLocalDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const fetchHeatmap = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const data = await getActivityHeatmap(userId)
        setHeatmap(data)
      } catch (error: any) {
        console.error("Failed to fetch activity heatmap:", error)
        setHeatmap({
          heatmap: {},
          streak: { current: 0, max: 0 },
          summary: { totalActiveDays: 0, maxInDay: 0, totalSolved: 0, totalSubmissions: 0 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHeatmap()
  }, [userId])

  // Generate current calendar year grid (Jan -> Dec), grouped by weeks
  const generateYearGrid = (year: number) => {
    const weeks: Date[][] = []
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31)

    // Align to full week boundaries so rows remain Sun-Sat
    const startDate = new Date(yearStart)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const endDate = new Date(yearEnd)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    let currentWeek: Date[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      currentWeek.push(new Date(currentDate))
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return weeks
  }

  const getDayActivity = (date: Date) => {
    const localKey = formatLocalDateKey(date)
    const count = heatmap?.heatmap[localKey] ?? 0
    return count
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30 hover:bg-muted/50'
    if (count === 1) return 'bg-green-500/30 hover:bg-green-500/40'
    if (count === 2) return 'bg-green-500/50 hover:bg-green-500/60'
    if (count === 3) return 'bg-green-500/70 hover:bg-green-500/80'
    return 'bg-green-500/90 hover:bg-green-500'
  }

  // Get fixed Jan-Dec labels with week-column index
  const getMonthLabels = (weeks: Date[][], year: number) => {
    const labels: { month: string; weekIndex: number }[] = []

    for (let month = 0; month < 12; month++) {
      const firstDate = new Date(year, month, 1)
      const weekIndex = weeks.findIndex(
        (week) => week.some((day) => day.toDateString() === firstDate.toDateString())
      )

      if (weekIndex >= 0) {
        labels.push({
          month: firstDate.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        })
      }
    }
    
    return labels
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Yearly Activity Heatmap
          </CardTitle>
          <CardDescription>Your problem-solving activity from Jan to Dec</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  const currentYear = new Date().getFullYear()
  const weeks = generateYearGrid(currentYear)
  const monthLabels = getMonthLabels(weeks, currentYear)
  const today = formatLocalDateKey(new Date())

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Yearly Activity Heatmap
            </CardTitle>
            <CardDescription>{`Your ${currentYear} activity from Jan to Dec`}</CardDescription>
          </div>
          {heatmap && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">{heatmap.streak.current} day streak</span>
              </div>
              <div className="text-muted-foreground">
                Best: {heatmap.streak.max} days
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Full-width yearly contribution grid */}
          <div className="w-full">
            <div className="w-full">
              {/* Month labels */}
              <div
                className="mb-1 ml-9 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
              >
                {monthLabels.map((label, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] text-muted-foreground"
                    style={{ gridColumn: `${label.weekIndex + 1} / span 2` }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex gap-1">
                {/* Day labels */}
                <div className="grid grid-rows-7 gap-1 pr-1.5 text-[10px] text-muted-foreground">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                
                {/* Weeks */}
                <div
                  className="grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="grid grid-rows-7 gap-1">
                      {week.map((date, dayIdx) => {
                        const count = getDayActivity(date)
                        const localDateKey = formatLocalDateKey(date)
                        const isToday = localDateKey === today
                        const isCurrentYear = date.getFullYear() === currentYear
                        
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "w-full aspect-square rounded-sm transition-all cursor-pointer group relative",
                              getIntensityClass(count),
                              isToday && "ring-1 ring-primary",
                              !isCurrentYear && "opacity-20"
                            )}
                            title={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${count} ${count === 1 ? 'problem' : 'problems'} solved`}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border">
                              <div className="font-semibold">{count} solved</div>
                              <div className="text-muted-foreground text-[10px]">
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground border-t">
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30" title="No activity" />
                <div className="w-3 h-3 rounded-sm bg-green-500/30" title="1 problem" />
                <div className="w-3 h-3 rounded-sm bg-green-500/50" title="2 problems" />
                <div className="w-3 h-3 rounded-sm bg-green-500/70" title="3 problems" />
                <div className="w-3 h-3 rounded-sm bg-green-500/90" title="4+ problems" />
              </div>
              <span>More</span>
            </div>
          </div>
          
          {/* Stats summary */}
          {heatmap?.summary && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {heatmap.summary.totalActiveDays}
                </div>
                <div className="text-xs text-muted-foreground">Active Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {heatmap.summary.totalSolved ?? heatmap.summary.totalSubmissions}
                </div>
                <div className="text-xs text-muted-foreground">Total Solved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {heatmap.summary.maxInDay}
                </div>
                <div className="text-xs text-muted-foreground">Best Day</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
