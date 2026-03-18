"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CartesianGrid, Label, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { BaseLayout } from "@/components/layouts/base-layout"
import { useAuth } from "@/contexts/auth-context"
import {
  getTimeframeAnalytics,
  type AnalyticsPeriod,
  type TimeframeAnalytics,
} from "@/api/services/analytics"
import { authService, type UsersListItem } from "@/api/services/auth"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Check, ChevronsUpDown } from "lucide-react"

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

const comparePalette = [
  "#0ea5e9",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
  "#f59e0b",
]

const getCompareColor = (index: number) => comparePalette[index % comparePalette.length]

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
  const { toast } = useToast()

  const [activePeriod, setActivePeriod] = useState<AnalyticsPeriod>("weekly")
  const [analyticsCache, setAnalyticsCache] = useState<
    Record<string, Partial<Record<AnalyticsPeriod, TimeframeAnalytics>>>
  >({})
  const analyticsCacheRef = useRef<
    Record<string, Partial<Record<AnalyticsPeriod, TimeframeAnalytics>>>
  >({})
  const inFlightFetchesRef = useRef<Set<string>>(new Set())
  const loadedFriendsForUserRef = useRef<string | null>(null)

  const [friends, setFriends] = useState<UsersListItem[]>([])
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false)
  const [friendSearch, setFriendSearch] = useState("")
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [compareFriendIds, setCompareFriendIds] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState<string>("")

  useEffect(() => {
    analyticsCacheRef.current = analyticsCache
  }, [analyticsCache])

  const ensureTimeframeForUser = useCallback(async (userId: string, period: AnalyticsPeriod) => {
    const cache = analyticsCacheRef.current
    if (cache[userId]?.[period]) return

    const key = `${userId}:${period}`
    if (inFlightFetchesRef.current.has(key)) return

    inFlightFetchesRef.current.add(key)
    try {
      const data = await getTimeframeAnalytics(userId, period)
      setAnalyticsCache((prev) => {
        if (prev[userId]?.[period]) return prev
        return {
          ...prev,
          [userId]: {
            ...(prev[userId] || {}),
            [period]: data,
          },
        }
      })
    } finally {
      inFlightFetchesRef.current.delete(key)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    const loadMyData = async () => {
      try {
        setLoading(true)
        setError(null)
        await ensureTimeframeForUser(user.id, activePeriod)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMyData()

    return () => {
      cancelled = true
    }
  }, [activePeriod, ensureTimeframeForUser, user?.id])

  useEffect(() => {
    if (!user?.id) return

    if (loadedFriendsForUserRef.current === user.id) return

    let cancelled = false
    const loadFriends = async () => {
      try {
        const data = await authService.listUsers({ friend: "true" })
        if (!cancelled) {
          loadedFriendsForUserRef.current = user.id
          const onlyFriends = data.filter((item) => item.isFriend && !item.isSelf)
          setFriends(onlyFriends)
          setSelectedFriendIds((prev) => prev.filter((id) => onlyFriends.some((f) => f.id === id)))
          setCompareFriendIds((prev) => prev.filter((id) => onlyFriends.some((f) => f.id === id)))
        }
      } catch {
        if (!cancelled) {
          toast({
            title: "Unable to load friends",
            description: "Friend comparison is temporarily unavailable.",
            variant: "destructive",
          })
        }
      }
    }

    loadFriends()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || compareFriendIds.length === 0) return

    let cancelled = false
    const loadComparePeriod = async () => {
      try {
        setCompareLoading(true)
        setError(null)
        const ids = [user.id, ...compareFriendIds]
        await Promise.all(ids.map((id) => ensureTimeframeForUser(id, activePeriod)))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load comparison analytics")
        }
      } finally {
        if (!cancelled) {
          setCompareLoading(false)
        }
      }
    }

    loadComparePeriod()

    return () => {
      cancelled = true
    }
  }, [activePeriod, compareFriendIds, ensureTimeframeForUser, user?.id])

  const currentData = user?.id ? analyticsCache[user.id]?.[activePeriod] : undefined

  const selectedFriendNames = useMemo(
    () => friends.filter((f) => selectedFriendIds.includes(f.id)).map((f) => f.name),
    [friends, selectedFriendIds]
  )

  const compareUsers = useMemo(() => {
    if (!user?.id) return []

    const ids = [user.id, ...compareFriendIds]
    return ids.map((id, index) => {
      const isMe = id === user.id
      const friend = friends.find((f) => f.id === id)
      return {
        id,
        name: isMe ? "You" : friend?.name || "Friend",
        color: getCompareColor(index),
        data: analyticsCache[id]?.[activePeriod],
      }
    })
  }, [activePeriod, analyticsCache, compareFriendIds, friends, user?.id])

  const isCompareMode = compareFriendIds.length > 0

  const lineChartData = useMemo(() => {
    if (!isCompareMode) {
      return currentData?.solvedOverTime || []
    }

    const base = compareUsers.find((item) => item.data)?.data
    if (!base) return []

    return base.solvedOverTime.map((bucket, index) => {
      const row: Record<string, string | number> = {
        key: bucket.key,
        label: bucket.label,
      }

      compareUsers.forEach((series) => {
        row[series.id] = series.data?.solvedOverTime[index]?.solved || 0
      })

      return row
    })
  }, [compareUsers, currentData, isCompareMode])

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriendIds((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId)
      }

      if (prev.length >= 10) {
        toast({
          title: "Selection limit reached",
          description: "You can compare with at most 10 friends at once.",
          variant: "destructive",
        })
        return prev
      }

      return [...prev, friendId]
    })
  }

  const handleCompare = async () => {
    if (!user?.id) return

    setCompareFriendIds(selectedFriendIds)
  }

  const clearComparison = () => {
    setSelectedFriendIds([])
    setCompareFriendIds([])
  }

  const filteredFriends = useMemo(() => {
    const query = friendSearch.trim().toLowerCase()
    if (!query) return friends
    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) ||
        friend.email.toLowerCase().includes(query)
    )
  }, [friendSearch, friends])

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

  const getTagPieData = (data?: TimeframeAnalytics) =>
    (data?.byTag || []).map((item) => ({
      ...item,
      fill: getTagColor(item.tag),
    }))

  const getDifficultyPieData = (data?: TimeframeAnalytics) =>
    (data?.byDifficulty || []).map((item) => ({
      ...item,
      fill: difficultyColorMap[item.difficulty] || "#94a3b8",
    }))

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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Compare With Friends</CardTitle>
                <CardDescription>
                  Select up to 10 friends, then compare trends and distribution charts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Popover open={friendDropdownOpen} onOpenChange={setFriendDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between sm:w-[320px]">
                        <span className="truncate text-left">
                          {selectedFriendIds.length > 0
                            ? `${selectedFriendIds.length} friend${selectedFriendIds.length > 1 ? "s" : ""} selected`
                            : "Select friends"}
                        </span>
                        <ChevronsUpDown className="size-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] p-3" align="start">
                      <div className="space-y-2">
                        <Input
                          placeholder="Search friends..."
                          value={friendSearch}
                          onChange={(event) => setFriendSearch(event.target.value)}
                        />
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {filteredFriends.length === 0 ? (
                            <p className="py-2 text-sm text-muted-foreground">No friends found.</p>
                          ) : (
                            filteredFriends.map((friend) => {
                              const checked = selectedFriendIds.includes(friend.id)
                              const disabled = !checked && selectedFriendIds.length >= 10

                              return (
                                <button
                                  key={friend.id}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-muted"
                                  onClick={() => handleFriendToggle(friend.id)}
                                  disabled={disabled}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{friend.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{friend.email}</p>
                                  </div>
                                  <Checkbox checked={checked} className="ml-2" />
                                </button>
                              )
                            })
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedFriendIds.length}/10 selected
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={handleCompare}
                    disabled={compareLoading || loading || !user?.id}
                    className="sm:w-auto"
                  >
                    {compareLoading ? "Comparing..." : "Compare"}
                  </Button>

                  {isCompareMode && (
                    <Button variant="ghost" onClick={clearComparison} className="sm:w-auto">
                      Clear
                    </Button>
                  )}
                </div>

                {selectedFriendNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFriendNames.map((name) => (
                      <Badge key={name} variant="outline" className="gap-1">
                        <Check className="size-3" />
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                      <LineChart data={lineChartData} margin={{ top: 10, left: 12, right: 12, bottom: 0 }}>
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
                        {!isCompareMode && (
                          <Line
                            dataKey="solved"
                            type="monotone"
                            stroke="var(--color-solved)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        )}
                        {isCompareMode &&
                          compareUsers.map((series) => (
                            <Line
                              key={series.id}
                              dataKey={series.id}
                              name={series.name}
                              type="monotone"
                              stroke={series.color}
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 4 }}
                              connectNulls
                            />
                          ))}
                      </LineChart>
                    </ChartContainer>
                    {isCompareMode && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {compareUsers.map((series) => (
                          <span
                            key={series.id}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: series.color }}
                            />
                            {series.name}
                          </span>
                        ))}
                      </div>
                    )}
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
                      <CardTitle>
                        {isCompareMode ? "Solved by Tag (Comparison)" : "Solved by Tag"}
                      </CardTitle>
                      <CardDescription>
                        {isCompareMode
                          ? "One pie per selected user"
                          : "Color-coded by tag (hover chart for details)"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 justify-center">
                      {!isCompareMode && tagPieData.length === 0 ? (
                        <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                          No tag data available in this period.
                        </div>
                      ) : !isCompareMode ? (
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
                      ) : (
                        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                          {compareUsers.map((series) => {
                            const pieData = getTagPieData(series.data)
                            const total = pieData.reduce((sum, item) => sum + item.solved, 0)

                            return (
                              <div key={series.id} className="rounded-lg border p-3">
                                <p className="mb-2 text-sm font-semibold">{series.name}</p>
                                {pieData.length === 0 ? (
                                  <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                                    No tag data
                                  </div>
                                ) : (
                                  <ChartContainer
                                    id={`tags-breakdown-${series.id}`}
                                    config={Object.fromEntries(
                                      pieData.map((item) => [
                                        item.tag,
                                        {
                                          label: item.tag,
                                          color: item.fill,
                                        },
                                      ])
                                    ) satisfies ChartConfig}
                                    className="mx-auto aspect-square w-full max-w-[230px]"
                                  >
                                    <PieChart>
                                      <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel nameKey="tag" />}
                                      />
                                      <Pie data={pieData} dataKey="solved" nameKey="tag" innerRadius={44} strokeWidth={3}>
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
                                                    className="fill-foreground text-xl font-bold"
                                                  >
                                                    {total}
                                                  </tspan>
                                                </text>
                                              )
                                            }
                                          }}
                                        />
                                      </Pie>
                                    </PieChart>
                                  </ChartContainer>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card data-chart="difficulty-breakdown" className="flex flex-col">
                    <ChartStyle id="difficulty-breakdown" config={difficultyChartConfig} />
                    <CardHeader>
                      <CardTitle>
                        {isCompareMode ? "Solved by Difficulty (Comparison)" : "Solved by Difficulty"}
                      </CardTitle>
                      <CardDescription>
                        {isCompareMode ? "One pie per selected user" : "Easy, Medium, Hard split"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 justify-center">
                      {!isCompareMode && difficultyPieData.every((item) => item.solved === 0) ? (
                        <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                          No solved problems in this period.
                        </div>
                      ) : !isCompareMode ? (
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
                      ) : (
                        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                          {compareUsers.map((series) => {
                            const pieData = getDifficultyPieData(series.data)
                            const total = pieData.reduce((sum, item) => sum + item.solved, 0)

                            return (
                              <div key={series.id} className="rounded-lg border p-3">
                                <p className="mb-2 text-sm font-semibold">{series.name}</p>
                                {total === 0 ? (
                                  <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                                    No solved problems
                                  </div>
                                ) : (
                                  <>
                                    <ChartContainer
                                      id={`difficulty-breakdown-${series.id}`}
                                      config={difficultyChartConfig}
                                      className="mx-auto aspect-square w-full max-w-[230px]"
                                    >
                                      <PieChart>
                                        <ChartTooltip
                                          cursor={false}
                                          content={<ChartTooltipContent hideLabel nameKey="difficulty" />}
                                        />
                                        <Pie
                                          data={pieData}
                                          dataKey="solved"
                                          nameKey="difficulty"
                                          innerRadius={44}
                                          strokeWidth={3}
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
                                                      className="fill-foreground text-xl font-bold"
                                                    >
                                                      {total}
                                                    </tspan>
                                                  </text>
                                                )
                                              }
                                            }}
                                          />
                                        </Pie>
                                      </PieChart>
                                    </ChartContainer>

                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                      {pieData.map((item) => (
                                        <div
                                          key={`${series.id}-${item.difficulty}`}
                                          className="rounded-md border p-2 text-center"
                                        >
                                          <p className="text-xs text-muted-foreground">{item.difficulty}</p>
                                          <p className="text-sm font-semibold">{item.solved}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })}
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
