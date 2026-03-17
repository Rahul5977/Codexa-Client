"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, Flame, Award, Target, Mail, Calendar as CalendarIcon, Star, ArrowLeft } from "lucide-react"
import { authService, type PublicUserProfile } from "@/api/services/auth"
import { toast } from "sonner"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { SemiCircularProgress } from "@/components/semi-circular-progress"
import { RecentSubmissions } from "@/components/recent-submissions"
import { getUserAnalytics, type UserAnalytics } from "@/api/services/analytics"

export default function UserProfileViewPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingFriend, setTogglingFriend] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      try {
        setLoading(true)
        const [profileData, analyticsData] = await Promise.all([
          authService.getPublicUserProfile(userId),
          getUserAnalytics(userId),
        ])

        if (!mountedRef.current) return
        setProfile(profileData)
        setAnalytics(analyticsData)
      } catch (error: any) {
        toast.error(error?.message || "Failed to load user profile")
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [userId])

  const handleToggleFriend = async () => {
    if (!profile || profile.isSelf) return

    try {
      setTogglingFriend(true)
      const result = await authService.toggleFriend(profile.id)
      setProfile((prev) => (prev ? { ...prev, isFriend: result.isFriend } : prev))
    } catch (error: any) {
      toast.error(error?.message || "Failed to update friend")
    } finally {
      setTogglingFriend(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  if (loading) {
    return (
      <BaseLayout title="Profile" description="View profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BaseLayout>
    )
  }

  if (!profile) {
    return (
      <BaseLayout title="Profile" description="View profile">
        <div className="px-4 lg:px-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              User not found.
            </CardContent>
          </Card>
        </div>
      </BaseLayout>
    )
  }

  const overview = analytics?.overview || {
    totalSolved: profile.totalSolved,
    totalAttempted: 0,
    successRate: 0,
    easySolved: profile.easySolved,
    mediumSolved: profile.mediumSolved,
    hardSolved: profile.hardSolved,
  }

  const streaks = analytics?.streaks || {
    current: profile.streakCurrent,
    max: profile.streakMax,
    lastActive: profile.lastActive,
  }

  const globalRank = analytics?.globalRank || null
  const problemStats = analytics?.problemStats || { total: 0, easy: 0, medium: 0, hard: 0 }
  const easyMax = Math.max(problemStats.easy, overview.easySolved, 0)
  const mediumMax = Math.max(problemStats.medium, overview.mediumSolved, 0)
  const hardMax = Math.max(problemStats.hard, overview.hardSolved, 0)

  return (
    <BaseLayout title="User Profile" description="View-only profile access">
      <div className="px-4 lg:px-6 space-y-6">
        <Button variant="outline" onClick={() => navigate("/users")}> 
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
        </Button>

        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-32 w-32 rounded-full border-4 border-primary/20">
                <AvatarImage src={profile.image_url} />
                <AvatarFallback className="text-2xl">{getInitials(profile.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <Badge variant="outline">{profile.role}</Badge>
                  {!profile.isSelf && (
                    <Button size="sm" variant={profile.isFriend ? "default" : "outline"} onClick={handleToggleFriend} disabled={togglingFriend}>
                      <Star className={`h-4 w-4 mr-1 ${profile.isFriend ? "fill-current" : ""}`} />
                      {profile.isFriend ? "Friend" : "Add Friend"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{overview.totalSolved}</span>
                    <span className="text-xs">Solved</span>
                  </Badge>

                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">{streaks.current}</span>
                    <span className="text-xs">Day Streak</span>
                  </Badge>

                  {globalRank && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">#{globalRank.rank}</span>
                      <span className="text-xs">Global</span>
                    </Badge>
                  )}

                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{overview.successRate}%</span>
                    <span className="text-xs">Success</span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SemiCircularProgress value={overview.easySolved} max={easyMax} label="Easy Problems" color="text-green-500" />
          <SemiCircularProgress value={overview.mediumSolved} max={mediumMax} label="Medium Problems" color="text-yellow-500" />
          <SemiCircularProgress value={overview.hardSolved} max={hardMax} label="Hard Problems" color="text-red-500" />
        </div>

        <div className="space-y-4">
          <ActivityHeatmap userId={profile.id} />
          <RecentSubmissions userId={profile.id} />
        </div>
      </div>
    </BaseLayout>
  )
}
