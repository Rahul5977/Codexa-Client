import { apiClient } from '../client'

export interface UserAnalytics {
  overview: {
    totalSolved: number
    totalAttempted: number
    successRate: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
  }
  streaks: {
    current: number
    max: number
    lastActive: Date | null
  }
  activityHeatmap: Record<string, number>
  topicStrengths: Array<{
    topic: string
    solved: number
    attempted: number
    strength: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
  }>
  efficiencyStats: Record<
    string,
    {
      totalTime: number
      count: number
      avgTime: number
    }
  >
  languageStats: Record<string, number>
  globalRank?: {
    rank: number
    percentile: number
    totalUsers: number
  }
}

export interface ActivityHeatmap {
  heatmap: Record<string, number>
  streak: {
    current: number
    max: number
  }
  stats: {
    totalActiveDays: number
    maxInDay: number
    totalSubmissions: number
  }
}

export interface TopicStrength {
  topic: string
  solved: number
  attempted: number
  strength: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
}

export interface EfficiencyMetrics {
  language?: string
  avgExecutionTime: number
  totalSubmissions: number
  percentile: number
  globalAvg: number
}

/**
 * Get complete analytics dashboard for a user
 */
export const getUserAnalytics = async (userId: string): Promise<UserAnalytics> => {
  const analyticsServiceUrl = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  const response = await apiClient.get<{ success: boolean; data: UserAnalytics }>(
    `${analyticsServiceUrl}/api/analytics/dashboard/${userId}`
  )
  return response.data.data
}

/**
 * Get activity heatmap for a user
 */
export const getActivityHeatmap = async (userId: string): Promise<ActivityHeatmap> => {
  const analyticsServiceUrl = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  const response = await apiClient.get<{ success: boolean; data: ActivityHeatmap }>(
    `${analyticsServiceUrl}/api/analytics/heatmap/${userId}`
  )
  return response.data.data
}

/**
 * Get topic strengths for a user (radar chart data)
 */
export const getTopicStrengths = async (userId: string): Promise<TopicStrength[]> => {
  const analyticsServiceUrl = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  const response = await apiClient.get<{ success: boolean; data: TopicStrength[] }>(
    `${analyticsServiceUrl}/api/analytics/topics/${userId}`
  )
  return response.data.data
}

/**
 * Get efficiency metrics for a user
 */
export const getEfficiencyMetrics = async (
  userId: string,
  language?: string
): Promise<EfficiencyMetrics> => {
  const analyticsServiceUrl = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  const params = language ? `?language=${language}` : ''
  const response = await apiClient.get<{ success: boolean; data: EfficiencyMetrics }>(
    `${analyticsServiceUrl}/api/analytics/efficiency/${userId}${params}`
  )
  return response.data.data
}

/**
 * Get global rank for a user
 */
export const getUserRank = async (userId: string): Promise<{
  rank: number
  percentile: number
  totalUsers: number
}> => {
  const analyticsServiceUrl = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  const response = await apiClient.get<{
    success: boolean
    data: {
      rank: number
      percentile: number
      totalUsers: number
    }
  }>(`${analyticsServiceUrl}/api/analytics/rank/${userId}`)
  return response.data.data
}
