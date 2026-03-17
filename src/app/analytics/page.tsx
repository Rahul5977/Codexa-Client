"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from "recharts"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useAuth } from "@/contexts/auth-context"
import {
  getTimeframeAnalytics,
  type AnalyticsPeriod,
  type TimeframeAnalytics,
} from "@/api/services/analytics"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const timeframeLabels: Record<AnalyticsPeriod, string> = {
  weekly: "Current week (Mon-Sun)",
  monthly: "Current month (1st-last day)",
  yearly: "Current year (Jan-Dec)",
}

const lineChartConfig = {
  solved: {
    label: "Problems Solved",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const getTagColor = (tag: string) => {
  // Stable per-tag hash so each tag keeps its color across renders/periods.
  let hash = 0
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash << 5) - hash + tag.charCodeAt(i)
    hash |= 0
  }

  const hue = Math.abs(hash) % 360
  const saturation = 62 + (Math.abs(hash) % 14)
  const lightness = 42 + (Math.abs(hash) % 10)
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

const difficultyColorMap: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#eab308",
  Hard: "#ef4444",
}

const difficultyChartConfig = {
  easy: { label: "Easy", color: "#22c55e" },
  medium: { label: "Medium", color: "#eab308" },
  hard: { label: "Hard", color: "#ef4444" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [activePeriod, setActivePeriod] = useState<AnalyticsPeriod>("weekly")
  const [analyticsByPeriod, setAnalyticsByPeriod] = useState<
    Partial<Record<AnalyticsPeriod, TimeframeAnalytics>>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState<string>("")

  const fetchPeriodData = async (period: AnalyticsPeriod) => {
    if (!user?.id || analyticsByPeriod[period]) return

    try {
      setLoading(true)
      setError(null)
      const data = await getTimeframeAnalytics(user.id, period)
      setAnalyticsByPeriod((prev) => ({ ...prev, [period]: data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeriodData(activePeriod)
  }, [activePeriod, user?.id])

  const currentData = analyticsByPeriod[activePeriod]

  const tagPieData = useMemo(
    () =>
      (currentData?.byTag || []).map((item) => ({
        ...item,
        fill: getTagColor(item.tag),
      })),
    [currentData]
  )

  const totalTagSolved = useMemo(
    () => tagPieData.reduce((sum, item) => sum + item.solved, 0),
    [tagPieData]
  )

  const difficultyPieData = useMemo(
    () =>
      (currentData?.byDifficulty || []).map((item) => ({
        ...item,
        fill: difficultyColorMap[item.difficulty] || "#94a3b8",
      })),
    [currentData]
  )

  useEffect(() => {
    if (
      difficultyPieData.length > 0 &&
      !difficultyPieData.some((item) => item.difficulty === activeDifficulty)
    ) {
      setActiveDifficulty(difficultyPieData[0].difficulty)
    }
  }, [difficultyPieData, activeDifficulty])

  const activeDifficultyIndex = useMemo(
    () => difficultyPieData.findIndex((item) => item.difficulty === activeDifficulty),
    [difficultyPieData, activeDifficulty]
  )

  return (
    <BaseLayout
      title="Analytics"
      description="Track your coding patterns across weekly, monthly, and yearly views"
    >
      <div className="@container/main px-4 lg:px-6 space-y-6">
        {!user?.id && (
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Please sign in to view your personal analytics.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {user?.id && (
          <>
            <Tabs
              value={activePeriod}
              onValueChange={(value) => setActivePeriod(value as AnalyticsPeriod)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading && !currentData && (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-90 w-full" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Skeleton className="h-90 w-full" />
                  <Skeleton className="h-90 w-full" />
                </div>
              </div>
            )}

            {error && !currentData && (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to load analytics</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {currentData && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Solved</CardDescription>
                      <CardTitle className="text-3xl">
                        {currentData.summary.totalSolved}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Active Buckets</CardDescription>
                      <CardTitle className="text-3xl">
                        {currentData.summary.activeBuckets}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Avg Per Active Bucket</CardDescription>
                      <CardTitle className="text-3xl">
                        {currentData.summary.avgSolvedPerActiveBucket}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Best Window</CardDescription>
                      <CardTitle className="text-2xl">
                        {currentData.summary.bestBucket
                          ? `${currentData.summary.bestBucket.label} (${currentData.summary.bestBucket.solved})`
                          : "No solved problems"}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Problems Solved Over Time</CardTitle>
                    <CardDescription>{timeframeLabels[activePeriod]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={lineChartConfig} className="aspect-auto h-90 w-full">
                      <AreaChart data={currentData.solvedOverTime} margin={{ top: 10, left: 12, right: 12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsSolvedFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-solved)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-solved)" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={24}
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          width={28}
                          axisLine={false}
                          tickLine={false}
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                          dataKey="solved"
                          type="monotone"
                          stroke="var(--color-solved)"
                          fill="url(#analyticsSolvedFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card data-chart="tags-breakdown" className="flex flex-col">
                    <ChartStyle
                      id="tags-breakdown"
                      config={Object.fromEntries(
                        tagPieData.map((item) => [
                          item.tag,
                          {
                            label: item.tag,
                            color: item.fill,
                          },
                        ])
                      ) satisfies ChartConfig}
                    />
                    <CardHeader>
                      <CardTitle>Solved by Tag</CardTitle>
                      <CardDescription>Color-coded by tag (hover chart for details)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 justify-center">
                      {tagPieData.length === 0 ? (
                        <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                          No tag data available in this period.
                        </div>
                      ) : (
                        <div className="flex w-full flex-col items-center gap-4">
                          <ChartContainer
                            id="tags-breakdown"
                            config={Object.fromEntries(
                              tagPieData.map((item) => [
                                item.tag,
                                {
                                  label: item.tag,
                                  color: item.fill,
                                },
                              ])
                            ) satisfies ChartConfig}
                            className="mx-auto aspect-square w-full max-w-[320px]"
                          >
                            <PieChart>
                              <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel nameKey="tag" />}
                              />
                              <Pie
                                data={tagPieData}
                                dataKey="solved"
                                nameKey="tag"
                                innerRadius={62}
                                strokeWidth={4}
                              >
                                <Label
                                  content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                      return (
                                        <text
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          <tspan
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            className="fill-foreground text-3xl font-bold"
                                          >
                                            {totalTagSolved}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 24}
                                            className="fill-muted-foreground"
                                          >
                                            Total tagged solves
                                          </tspan>
                                        </text>
                                      )
                                    }
                                  }}
                                />
                              </Pie>
                            </PieChart>
                          </ChartContainer>

                          <div className="flex w-full flex-wrap justify-center gap-2">
                            {tagPieData.slice(0, 6).map((item) => (
                              <span
                                key={item.tag}
                                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground"
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: item.fill }}
                                />
                                {item.tag}
                              </span>
                            ))}
                            {tagPieData.length > 6 && (
                              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                +{tagPieData.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card data-chart="difficulty-breakdown" className="flex flex-col">
                    <ChartStyle id="difficulty-breakdown" config={difficultyChartConfig} />
                    <CardHeader>
                      <CardTitle>Solved by Difficulty</CardTitle>
                      <CardDescription>Easy, Medium, Hard split</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 justify-center">
                      {difficultyPieData.every((item) => item.solved === 0) ? (
                        <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                          No solved problems in this period.
                        </div>
                      ) : (
                        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                          <div className="flex justify-center">
                            <ChartContainer
                              id="difficulty-breakdown"
                              config={difficultyChartConfig}
                              className="mx-auto aspect-square w-full max-w-[300px]"
                            >
                              <PieChart>
                                <ChartTooltip
                                  cursor={false}
                                  content={<ChartTooltipContent hideLabel nameKey="difficulty" />}
                                />
                                <Pie
                                  data={difficultyPieData}
                                  dataKey="solved"
                                  nameKey="difficulty"
                                  innerRadius={60}
                                  strokeWidth={5}
                                >
                                  <Label
                                    content={({ viewBox }) => {
                                      const activeItem =
                                        difficultyPieData[activeDifficultyIndex] || difficultyPieData[0]
                                      if (viewBox && "cx" in viewBox && "cy" in viewBox && activeItem) {
                                        return (
                                          <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                          >
                                            <tspan
                                              x={viewBox.cx}
                                              y={viewBox.cy}
                                              className="fill-foreground text-3xl font-bold"
                                            >
                                              {activeItem.solved}
                                            </tspan>
                                            <tspan
                                              x={viewBox.cx}
                                              y={(viewBox.cy || 0) + 24}
                                              className="fill-muted-foreground"
                                            >
                                              {activeItem.difficulty}
                                            </tspan>
                                          </text>
                                        )
                                      }
                                    }}
                                  />
                                </Pie>
                              </PieChart>
                            </ChartContainer>
                          </div>

                          <div className="flex flex-col justify-center space-y-4">
                            {difficultyPieData.map((item, index) => {
                              const isActive = index === activeDifficultyIndex

                              return (
                                <div
                                  key={item.difficulty}
                                  className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                                    isActive ? "bg-muted" : "hover:bg-muted/50"
                                  }`}
                                  onClick={() => setActiveDifficulty(item.difficulty)}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="flex h-3 w-3 shrink-0 rounded-full"
                                      style={{ backgroundColor: item.fill }}
                                    />
                                    <span className="font-medium">{item.difficulty}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">{item.solved}</div>
                                    <div className="text-sm text-muted-foreground">solved</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </BaseLayout>
  )
}
