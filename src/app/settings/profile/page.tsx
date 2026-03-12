"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Loader2, Trophy, Flame, Award, Target, Mail, Calendar as CalendarIcon } from "lucide-react"
import { useRef } from "react"
import { Logo } from "@/components/logo"
import { authService } from "@/api/services/auth"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { SemiCircularProgress } from "@/components/semi-circular-progress"
import { RecentSubmissions } from "@/components/recent-submissions"
import { getUserAnalytics, type UserAnalytics } from "@/api/services/analytics"

export default function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [useDefaultIcon, setUseDefaultIcon] = useState(true)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const { user, updateUser } = useAuth()

  // Fetch user profile and analytics on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      
      try {
        setIsFetchingProfile(true)
        const [userData, analyticsData] = await Promise.all([
          authService.me(),
          getUserAnalytics(user.id)
        ])
        
        // Set profile image
        if (userData.image_url) {
          setProfileImage(userData.image_url)
          setUseDefaultIcon(false)
        }
        
        setAnalytics(analyticsData)
      } catch (error: any) {
        console.error("Failed to fetch profile data:", error)
        // Set default analytics on error
        setAnalytics({
          overview: {
            totalSolved: 0,
            totalAttempted: 0,
            successRate: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
          },
          streaks: { current: 0, max: 0, lastActive: null },
          activityHeatmap: {},
          topicStrengths: [],
          efficiencyStats: {},
          languageStats: {},
        })
      } finally {
        setIsFetchingProfile(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 819200) {
      toast.error("File size exceeds 800KB limit")
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, and GIF are allowed")
      return
    }

    try {
      setIsUploadingImage(true)

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        setUseDefaultIcon(false)
      }
      reader.readAsDataURL(file)

      const updatedUser = await authService.updateProfilePicture(file)
      
      if (updateUser) {
        updateUser(updatedUser)
      }

      setProfileImage(updatedUser.image_url || null)
      toast.success("Profile picture updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload profile picture")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  if (isFetchingProfile) {
    return (
      <BaseLayout title="Profile" description="View and manage your profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BaseLayout>
    )
  }

  const overview = analytics?.overview || {
    totalSolved: 0,
    totalAttempted: 0,
    successRate: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  }

  const streaks = analytics?.streaks || { current: 0, max: 0, lastActive: null }
  const globalRank = analytics?.globalRank || null
  const problemStats = analytics?.problemStats || { total: 0, easy: 0, medium: 0, hard: 0 }

  return (
    <BaseLayout title="Profile" description="View and manage your profile">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Profile Header Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                {useDefaultIcon ? (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                    <Logo size={80} />
                  </div>
                ) : (
                  <Avatar className="h-32 w-32 rounded-full border-4 border-primary/20">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="text-2xl">{getInitials(user?.name || '')}</AvatarFallback>
                  </Avatar>
                )}
                
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full shadow-lg"
                  onClick={handleFileUpload}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/gif,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user?.name || 'User'}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">
                      Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Key Stats */}
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

        {/* Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SemiCircularProgress
            value={overview.easySolved}
            max={problemStats.easy || 50}
            label="Easy Problems"
            color="text-green-500"
          />
          <SemiCircularProgress
            value={overview.mediumSolved}
            max={problemStats.medium || 50}
            label="Medium Problems"
            color="text-yellow-500"
          />
          <SemiCircularProgress
            value={overview.hardSolved}
            max={problemStats.hard || 30}
            label="Hard Problems"
            color="text-red-500"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="w-full space-y-4 mt-6">
            {user?.id && <ActivityHeatmap userId={user.id} />}
          </TabsContent>
          
          <TabsContent value="submissions" className="w-full mt-6">
            {user?.id && <RecentSubmissions userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
