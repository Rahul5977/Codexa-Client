"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Flame } from "lucide-react"
import { getActivityHeatmap, type ActivityHeatmap } from "@/api/services/analytics"
import { cn } from "@/lib/utils"

interface ActivityCalendarProps {
  userId: string
}

export function ActivityCalendar({ userId }: ActivityCalendarProps) {
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
        // Set default empty heatmap on error
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

  // Generate calendar data for past 90 days and next 7 days
  const generateCalendarDays = () => {
    const days = []
    const today = new Date()
    
    // Past 90 days
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    
    // Next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    
    return days
  }

  const getDayStatus = (date: Date) => {
    const dateStr = formatLocalDateKey(date)
    const today = formatLocalDateKey(new Date())
    
    if (dateStr > today) {
      return { type: 'future', count: 0 }
    }
    
    const count = heatmap?.heatmap[dateStr] || 0
    return {
      type: count > 0 ? 'active' : 'inactive',
      count
    }
  }

  const getIntensityClass = (status: { type: string, count: number }) => {
    if (status.type === 'future') {
      return 'bg-muted/30 border-dashed border'
    }
    
    if (status.type === 'inactive') {
      return 'bg-red-500/20 hover:bg-red-500/30'
    }
    
    // Green intensity based on activity count
    if (status.count === 1) return 'bg-green-500/40 hover:bg-green-500/50'
    if (status.count === 2) return 'bg-green-500/60 hover:bg-green-500/70'
    if (status.count >= 3) return 'bg-green-500/80 hover:bg-green-500/90'
    
    return 'bg-muted/50'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Calendar
          </CardTitle>
          <CardDescription>Your daily problem-solving activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const days = generateCalendarDays()
  const weeks = []
  
  // Group days into weeks (7 days per row)
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Calendar
            </CardTitle>
            <CardDescription>Your daily problem-solving activity</CardDescription>
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
        <div className="space-y-2">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          
          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((date, dayIdx) => {
                  const status = getDayStatus(date)
                  const dateStr = formatLocalDateKey(date)
                  const isToday = dateStr === formatLocalDateKey(new Date())
                  
                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "aspect-square rounded-sm transition-colors cursor-pointer relative group",
                        getIntensityClass(status),
                        isToday && "ring-2 ring-primary ring-offset-1"
                      )}
                      title={`${dateStr}${status.type === 'future' ? ' (upcoming)' : ''}: ${status.count} ${status.count === 1 ? 'submission' : 'submissions'}`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {status.type === 'future' ? (
                          <span className="block">Upcoming</span>
                        ) : (
                          <span className="block">{status.count} solved</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500/20" title="No activity" />
                <div className="w-3 h-3 rounded-sm bg-green-500/40" title="1 submission" />
                <div className="w-3 h-3 rounded-sm bg-green-500/60" title="2 submissions" />
                <div className="w-3 h-3 rounded-sm bg-green-500/80" title="3+ submissions" />
              </div>
              <span>More</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/30 border border-dashed" />
              <span>Future days</span>
            </div>
          </div>
          
          {/* Stats summary */}
          {heatmap?.summary && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
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
