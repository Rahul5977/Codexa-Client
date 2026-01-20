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
import { 
  mockDashboardStats, 
  allMockProblems, 
  mockPerformanceData, 
  mockStreakData,
  mockRecentSubmissions
} from './dashboard-data'

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API response wrapper
const createMockResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
})

// Mock service class
export class MockDashboardService {
  static async getDashboardStats(): Promise<ApiResponse<GetDashboardStatsResponse>> {
    await delay(300)
    
    return createMockResponse({
      stats: mockDashboardStats
    }, 'Dashboard stats retrieved successfully')
  }

  static async getProblems(params: GetProblemsRequest = {}): Promise<ApiResponse<GetProblemsResponse>> {
    await delay(400)
    
    const {
      page = 1,
      pageSize = 10,
      category,
      difficulty,
      status,
      search
    } = params

    // Filter problems based on parameters
    let filteredProblems = [...allMockProblems]

    if (search) {
      filteredProblems = filteredProblems.filter(problem =>
        problem.title.toLowerCase().includes(search.toLowerCase()) ||
        problem.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (category && category !== 'All') {
      filteredProblems = filteredProblems.filter(problem => problem.category === category)
    }

    if (difficulty && difficulty !== 'All') {
      filteredProblems = filteredProblems.filter(problem => problem.difficulty === difficulty)
    }

    if (status && status !== 'All') {
      const statusFilter = status.toLowerCase() as 'solved' | 'attempted' | 'unsolved'
      filteredProblems = filteredProblems.filter(problem => problem.status === statusFilter)
    }

    // Apply pagination
    const totalCount = filteredProblems.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedProblems = filteredProblems.slice(startIndex, endIndex)

    return createMockResponse({
      problems: paginatedProblems,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages
    }, `Retrieved ${paginatedProblems.length} problems`)
  }

  static async getPerformanceData(): Promise<ApiResponse<GetPerformanceDataResponse>> {
    await delay(350)
    
    return createMockResponse({
      performance: mockPerformanceData
    }, 'Performance data retrieved successfully')
  }

  static async getStreakData(): Promise<ApiResponse<GetStreakDataResponse>> {
    await delay(200)
    
    return createMockResponse({
      streak: mockStreakData
    }, 'Streak data retrieved successfully')
  }

  static async getRecentSubmissions(): Promise<ApiResponse<GetRecentSubmissionsResponse>> {
    await delay(250)
    
    return createMockResponse({
      submissions: mockRecentSubmissions
    }, 'Recent submissions retrieved successfully')
  }

  static async getProblemById(id: number): Promise<ApiResponse<Problem | null>> {
    await delay(200)
    
    const problem = allMockProblems.find(p => p.id === id)
    
    if (!problem) {
      return {
        success: false,
        data: null,
        error: 'Problem not found',
        timestamp: new Date().toISOString()
      }
    }

    return createMockResponse(problem, 'Problem retrieved successfully')
  }
}

// You can easily switch between mock and real API by changing this flag
export const useMockService = true
