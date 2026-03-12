"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { getActivityHeatmap, type ActivityHeatmap } from "@/api/services/analytics"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CompactCalendarProps {
  userId: string
}

export function CompactCalendar({ userId }: CompactCalendarProps) {
  const [heatmap, setHeatmap] = useState<ActivityHeatmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getDayActivity = (date: Date | null) => {
    if (!date) return { count: 0, type: 'empty' }
    
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    
    if (compareDate > today) {
      return { count: 0, type: 'future' }
    }
    
    const count = heatmap?.heatmap[dateStr] || 0
    return { count, type: count > 0 ? 'active' : 'inactive' }
  }

  const getDayClass = (activity: { count: number, type: string }, isToday: boolean) => {
    const baseClass = "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer"
    
    if (activity.type === 'empty') {
      return cn(baseClass, "invisible")
    }
    
    if (isToday) {
      return cn(baseClass, "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2")
    }
    
    if (activity.type === 'future') {
      return cn(baseClass, "bg-muted/30 text-muted-foreground border border-dashed")
    }
    
    if (activity.type === 'active') {
      // Green intensity based on count
      if (activity.count >= 3) return cn(baseClass, "bg-green-500/80 text-white hover:bg-green-500")
      if (activity.count === 2) return cn(baseClass, "bg-green-500/60 text-white hover:bg-green-500")
      return cn(baseClass, "bg-green-500/40 text-white hover:bg-green-500")
    }
    
    // Inactive (past day with no activity)
    return cn(baseClass, "bg-red-500/20 text-foreground hover:bg-red-500/30")
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    )
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {monthName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {heatmap && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{heatmap.streak.current} day streak</span>
            <span className="text-xs">• Best: {heatmap.streak.max}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
              const activity = getDayActivity(date)
              const today = isToday(date)
              
              return (
                <div
                  key={idx}
                  className={getDayClass(activity, today)}
                  title={date ? `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${activity.count} solved` : ''}
                >
                  {date && date.getDate()}
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/20" />
              <span>No activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/40" />
              <span>1-2 solved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/80" />
              <span>3+ solved</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
