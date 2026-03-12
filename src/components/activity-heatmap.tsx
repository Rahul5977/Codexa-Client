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
          summary: { totalActiveDays: 0, maxInDay: 0, totalSubmissions: 0 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHeatmap()
  }, [userId])

  // Generate last 365 days grouped by weeks
  const generateYearGrid = () => {
    const weeks: Date[][] = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364) // Go back 364 days (365 days total including today)
    
    // Find the Sunday before start date to align weeks properly
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)
    
    let currentWeek: Date[] = []
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 1) // Include today
    
    const currentDate = new Date(startDate)
    while (currentDate < endDate) {
      currentWeek.push(new Date(currentDate))
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Add remaining days if any
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }
    
    return weeks
  }

  const getDayActivity = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const count = heatmap?.heatmap[dateStr] || 0
    return count
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30 hover:bg-muted/50'
    if (count === 1) return 'bg-green-500/30 hover:bg-green-500/40'
    if (count === 2) return 'bg-green-500/50 hover:bg-green-500/60'
    if (count === 3) return 'bg-green-500/70 hover:bg-green-500/80'
    return 'bg-green-500/90 hover:bg-green-500'
  }

  // Get month labels for the grid
  const getMonthLabels = (weeks: Date[][]) => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1
    
    weeks.forEach((week, idx) => {
      const firstDay = week[0]
      const month = firstDay.getMonth()
      
      if (month !== lastMonth && idx > 0) {
        labels.push({
          month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: idx
        })
        lastMonth = month
      } else if (idx === 0) {
        labels.push({
          month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: idx
        })
        lastMonth = month
      }
    })
    
    return labels
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Annual Activity Heatmap
          </CardTitle>
          <CardDescription>Your problem-solving activity over the past year</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  const weeks = generateYearGrid()
  const monthLabels = getMonthLabels(weeks)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Annual Activity Heatmap
            </CardTitle>
            <CardDescription>Your problem-solving activity over the past year</CardDescription>
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
          {/* GitHub-style contribution graph */}
          <div className="w-full overflow-hidden">
            <div className="w-full">
              {/* Month labels */}
              <div className="flex mb-1 ml-7">
                {monthLabels.map((label, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-muted-foreground flex-shrink-0"
                    style={{ 
                      marginLeft: idx === 0 ? '0' : `${(label.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 11}px`,
                      minWidth: '30px'
                    }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex gap-0.5">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 justify-around pr-1.5 flex-shrink-0">
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Sun</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Mon</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Tue</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Wed</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Thu</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Fri</div>
                  <div className="h-2.5 text-[10px] text-muted-foreground leading-tight">Sat</div>
                </div>
                
                {/* Weeks */}
                <div className="flex gap-0.5 flex-1">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-0.5 flex-shrink-0" style={{ minWidth: '10px' }}>
                      {week.map((date, dayIdx) => {
                        const count = getDayActivity(date)
                        const dateStr = date.toISOString().split('T')[0]
                        const isToday = dateStr === today
                        
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "w-2.5 h-2.5 rounded-sm transition-all cursor-pointer group relative flex-shrink-0",
                              getIntensityClass(count),
                              isToday && "ring-1 ring-primary"
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
                  {heatmap.summary.totalSubmissions}
                </div>
                <div className="text-xs text-muted-foreground">Total Submissions</div>
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
