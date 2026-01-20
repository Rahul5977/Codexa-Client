import { API_CONFIG, ENDPOINTS } from '../config'
import { apiClient } from '../client'
import { MockDashboardService } from '../mock/dashboard-service'
import type { ApiResponse } from '../types/common'
import type { 
  GetProblemsRequest, 
  GetProblemsResponse,
  GetDashboardStatsResponse,
  GetPerformanceDataResponse,
  GetStreakDataResponse,
  GetRecentSubmissionsResponse,
  Problem
} from '../types/dashboard'

class DashboardService {
  private useMock: boolean

  constructor() {
    this.useMock = API_CONFIG.MOCK_ENABLED
  }

  async getDashboardStats(): Promise<ApiResponse<GetDashboardStatsResponse>> {
    if (this.useMock) {
      return MockDashboardService.getDashboardStats()
    }

    return apiClient.get<GetDashboardStatsResponse>(ENDPOINTS.DASHBOARD.STATS)
  }

  async getProblems(params: GetProblemsRequest = {}): Promise<ApiResponse<GetProblemsResponse>> {
    if (this.useMock) {
      return MockDashboardService.getProblems(params)
    }

    return apiClient.get<GetProblemsResponse>(ENDPOINTS.DASHBOARD.PROBLEMS, { params })
  }

  async getPerformanceData(): Promise<ApiResponse<GetPerformanceDataResponse>> {
    if (this.useMock) {
      return MockDashboardService.getPerformanceData()
    }

    return apiClient.get<GetPerformanceDataResponse>(ENDPOINTS.DASHBOARD.PERFORMANCE)
  }

  async getStreakData(): Promise<ApiResponse<GetStreakDataResponse>> {
    if (this.useMock) {
      return MockDashboardService.getStreakData()
    }

    return apiClient.get<GetStreakDataResponse>(ENDPOINTS.DASHBOARD.STREAK)
  }

  async getRecentSubmissions(): Promise<ApiResponse<GetRecentSubmissionsResponse>> {
    if (this.useMock) {
      return MockDashboardService.getRecentSubmissions()
    }

    return apiClient.get<GetRecentSubmissionsResponse>(ENDPOINTS.DASHBOARD.RECENT_SUBMISSIONS)
  }

  async getProblemById(id: number): Promise<ApiResponse<Problem | null>> {
    if (this.useMock) {
      return MockDashboardService.getProblemById(id)
    }

    return apiClient.get<Problem>(ENDPOINTS.PROBLEMS.DETAIL(id))
  }

  // Method to switch between mock and real API (useful for testing)
  setMockMode(enabled: boolean) {
    this.useMock = enabled
  }

  isMockMode(): boolean {
    return this.useMock
  }
}

export const dashboardService = new DashboardService()

// Export individual methods for easier importing
export const {
  getDashboardStats,
  getProblems,
  getPerformanceData,
  getStreakData,
  getRecentSubmissions,
  getProblemById
} = dashboardService
