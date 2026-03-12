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
  const percentage = max > 0 ? (value / max) * 100 : 0
  const angle = (percentage / 100) * 180 // 0-180 degrees for semicircle
  
  // Calculate the end point of the progress arc
  const radius = 45
  const centerX = 50
  const centerY = 50
  
  // Convert angle to radians and calculate arc end point
  const endAngle = (angle - 90) * (Math.PI / 180) // -90 to start from bottom
  const startAngle = -90 * (Math.PI / 180)
  
  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)
  
  const largeArcFlag = angle > 90 ? 1 : 0
  
  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`

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
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={cn(color, "transition-all duration-500")}
              strokeLinecap="round"
            />
            
            {/* Center text */}
            <text
              x="50"
              y="42"
              textAnchor="middle"
              className="text-2xl font-bold fill-current"
            >
              {value}
            </text>
            <text
              x="50"
              y="52"
              textAnchor="middle"
              className="text-xs fill-current text-muted-foreground"
            >
              of {max}
            </text>
          </svg>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
      </CardContent>
    </Card>
  )
}
