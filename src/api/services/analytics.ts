import { apiClient } from '../client'

const rawAnalyticsServiceUrl =
  import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3005'

const normalizedAnalyticsServiceUrl = rawAnalyticsServiceUrl.replace(/\/$/, '')

const ANALYTICS_BASE_URL = normalizedAnalyticsServiceUrl.endsWith('/api/analytics')
  ? normalizedAnalyticsServiceUrl
  : normalizedAnalyticsServiceUrl.endsWith('/api')
    ? `${normalizedAnalyticsServiceUrl}/analytics`
    : `${normalizedAnalyticsServiceUrl}/api/analytics`

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
  problemStats?: {
    total: number
    easy: number
    medium: number
    hard: number
  }
}

export interface ActivityHeatmap {
  heatmap: Record<string, number>
  streak: {
    current: number
    max: number
    lastActive?: Date | null
  }
  summary: {
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
  const response = await apiClient.get<UserAnalytics>(`${ANALYTICS_BASE_URL}/dashboard/${userId}`)
  return response.data
}

/**
 * Get activity heatmap for a user
 */
export const getActivityHeatmap = async (userId: string): Promise<ActivityHeatmap> => {
  const response = await apiClient.get<ActivityHeatmap>(`${ANALYTICS_BASE_URL}/heatmap/${userId}`)
  return response.data
}

/**
 * Get topic strengths for a user (radar chart data)
 */
export const getTopicStrengths = async (userId: string): Promise<TopicStrength[]> => {
  const response = await apiClient.get<TopicStrength[]>(`${ANALYTICS_BASE_URL}/topics/${userId}`)
  return response.data
}

/**
 * Get efficiency metrics for a user
 */
export const getEfficiencyMetrics = async (
  userId: string,
  language?: string
): Promise<EfficiencyMetrics> => {
  const params = language ? `?language=${language}` : ''
  const response = await apiClient.get<EfficiencyMetrics>(`${ANALYTICS_BASE_URL}/efficiency/${userId}${params}`)
  return response.data
}

/**
 * Get global rank for a user
 */
export const getUserRank = async (userId: string): Promise<{
  rank: number
  percentile: number
  totalUsers: number
}> => {
  const response = await apiClient.get<{
    rank: number
    percentile: number
    totalUsers: number
  }>(`${ANALYTICS_BASE_URL}/rank/${userId}`)
  return response.data
}
