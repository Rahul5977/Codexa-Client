"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SemiCircularProgressProps {
  value: number
  max: number
  label: string
  color?: string
  className?: string
}

export function SemiCircularProgress({ 
  value, 
  max, 
  label, 
  color = "text-primary",
  className 
}: SemiCircularProgressProps) {
  const safeMax = Math.max(0, max)
  const clampedValue = Math.min(Math.max(0, value), safeMax)
  const percentage = safeMax > 0 ? (clampedValue / safeMax) * 100 : 0

  // Exact same path for background + progress
  const arcPath = "M 5 50 A 45 45 0 0 1 95 50"
  const arcLength = Math.PI * 45 // semicircle length = πr
  const progressLength = (percentage / 100) * arcLength

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-center">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
          <svg viewBox="0 0 100 60" className="w-full h-full">
            {/* Background arc */}
            <path
              d={arcPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d={arcPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={cn(color, "transition-all duration-500")}
              strokeLinecap="round"
              strokeDasharray={`${progressLength} ${arcLength}`}
            />
            
            {/* Center text */}
            <text
              x="50"
              y="42"
              textAnchor="middle"
              className="text-2xl font-bold fill-current"
            >
              {clampedValue}
            </text>
            <text
              x="50"
              y="52"
              textAnchor="middle"
              className="text-xs fill-current text-muted-foreground"
            >
              of {safeMax}
            </text>
          </svg>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Solved Percentage</p>
        </div>
      </CardContent>
    </Card>
  )
}
