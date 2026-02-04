// Dashboard API types
export interface DashboardStats {
  totalProblems: number
  solvedProblems: number
  attemptedProblems: number
  currentStreak: number
  longestStreak: number
  acceptanceRate: number
  contestRating: number
  aiAnalysisScore: number
  rankPosition: number
}

export interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  status: 'solved' | 'attempted' | 'unsolved'
  acceptance: string
  tags: string[]
  description?: string
  timeComplexity?: string
  spaceComplexity?: string
  companies?: string[]
  createdAt: string
  updatedAt: string
}

export interface PerformanceData {
  weeklyStats: {
    week: string
    problemsSolved: number
    easyCount: number
    mediumCount: number
    hardCount: number
  }[]
  monthlyStats: {
    month: string
    problemsSolved: number
    easyCount: number
    mediumCount: number
    hardCount: number
  }[]
  topicProgress: {
    topic: string
    solved: number
    total: number
    percentage: number
  }[]
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  streakHistory: {
    date: string
    problemsSolved: number
    difficulty: Record<'Easy' | 'Medium' | 'Hard', number>
  }[]
}

export interface RecentSubmission {
  id: number
  problemId: number
  problemTitle: string
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error'
  language: string
  runtime: string
  memory: string
  submittedAt: string
}

// API request/response types
export interface GetProblemsRequest {
  page?: number
  pageSize?: number
  category?: string
  difficulty?: string // Allow 'All' as well
  status?: string // Allow 'All' as well
  search?: string
}

export interface GetProblemsResponse {
  problems: Problem[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasMore: boolean
}

export interface GetDashboardStatsResponse {
  stats: DashboardStats
}

export interface GetPerformanceDataResponse {
  performance: PerformanceData
}

export interface GetStreakDataResponse {
  streak: StreakData
}

export interface GetRecentSubmissionsResponse {
  submissions: RecentSubmission[]
}
