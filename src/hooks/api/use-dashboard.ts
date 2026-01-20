import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/api/services/dashboard'
import type { 
  DashboardStats, 
  Problem, 
  PerformanceData, 
  StreakData, 
  RecentSubmission,
  GetProblemsRequest 
} from '@/api/types/dashboard'

// Generic API hook
interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Dashboard Stats Hook
export function useDashboardStats(): UseApiState<DashboardStats> {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getDashboardStats()
      
      if (response.success) {
        setData(response.data.stats)
      } else {
        setError(response.error || 'Failed to fetch dashboard stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Problems Hook with filtering and pagination
interface UseProblemsOptions extends GetProblemsRequest {
  enabled?: boolean
}

interface UseProblemsReturn extends UseApiState<Problem[]> {
  totalCount: number
  currentPage: number
  totalPages: number
  hasMore: boolean
}

export function useProblems(options: UseProblemsOptions = {}): UseProblemsReturn {
  const { enabled = true, ...params } = options
  const [data, setData] = useState<Problem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getProblems(params)
      
      if (response.success) {
        setData(response.data.problems)
        setTotalCount(response.data.totalCount)
        setCurrentPage(response.data.currentPage)
        setTotalPages(response.data.totalPages)
        setHasMore(response.data.hasMore)
      } else {
        setError(response.error || 'Failed to fetch problems')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [enabled, JSON.stringify(params)]) // Use JSON.stringify for deep comparison

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    totalCount,
    currentPage,
    totalPages,
    hasMore
  }
}

// Performance Data Hook
export function usePerformanceData(): UseApiState<PerformanceData> {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getPerformanceData()
      
      if (response.success) {
        setData(response.data.performance)
      } else {
        setError(response.error || 'Failed to fetch performance data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Streak Data Hook
export function useStreakData(): UseApiState<StreakData> {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getStreakData()
      
      if (response.success) {
        setData(response.data.streak)
      } else {
        setError(response.error || 'Failed to fetch streak data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Recent Submissions Hook
export function useRecentSubmissions(): UseApiState<RecentSubmission[]> {
  const [data, setData] = useState<RecentSubmission[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getRecentSubmissions()
      
      if (response.success) {
        setData(response.data.submissions)
      } else {
        setError(response.error || 'Failed to fetch recent submissions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Individual Problem Hook
export function useProblem(id: number, enabled: boolean = true): UseApiState<Problem> {
  const [data, setData] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled || !id) return

    try {
      setLoading(true)
      setError(null)
      const response = await dashboardService.getProblemById(id)
      
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || 'Problem not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [id, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
