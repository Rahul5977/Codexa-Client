import { API_CONFIG } from "../config"
import { MockDashboardService } from "../mock/dashboard-service"
import type { ApiResponse } from "../types/common"
import type {
  GetProblemsRequest,
  GetProblemsResponse,
  GetDashboardStatsResponse,
  GetPerformanceDataResponse,
  GetStreakDataResponse,
  GetRecentSubmissionsResponse,
  Problem,
} from "../types/dashboard"
import { getAllProblems, getProblemById as getProblem } from "./problem"
import { getSubmissions } from "./submission"
import { authService } from "./auth"

class DashboardService {
  private useMock: boolean

  constructor() {
    this.useMock = API_CONFIG.MOCK_ENABLED
  }

  async getDashboardStats(): Promise<ApiResponse<GetDashboardStatsResponse>> {
    if (this.useMock) {
      return MockDashboardService.getDashboardStats()
    }

    // Since there's no dedicated dashboard stats endpoint, we'll aggregate from available data
    try {
      const user = await authService.me()

      // Create stats from user data
      const stats = {
        solvedProblems: user.totalSolved || 0,
        totalProblems: user.totalSolved + 50, // Placeholder - need to get actual total from problems API
        attemptedProblems: user.totalSolved + 10, // Placeholder
        acceptanceRate: user.totalSolved > 0 ? 75 : 0, // Placeholder
        currentStreak: 0, // Not available in current backend
        longestStreak: 0, // Not available in current backend
        contestRating: user.currentRating || 0,
        rankPosition: 1000, // Placeholder - not available
        aiAnalysisScore: 75, // Placeholder - not available
      }

      return {
        success: true,
        data: { stats },
        message: "Dashboard stats fetched successfully",
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      return {
        success: false,
        data: {
          stats: {
            solvedProblems: 0,
            totalProblems: 0,
            attemptedProblems: 0,
            acceptanceRate: 0,
            currentStreak: 0,
            longestStreak: 0,
            contestRating: 0,
            rankPosition: 0,
            aiAnalysisScore: 0,
          },
        },
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard stats",
        message: "Error fetching stats",
      }
    }
  }

  async getProblems(
    params: GetProblemsRequest = {}
  ): Promise<ApiResponse<GetProblemsResponse>> {
    if (this.useMock) {
      return MockDashboardService.getProblems(params)
    }

    try {
      // Use the problem service to get all problems
      const allProblems = await getAllProblems()

      // Ensure allProblems is an array
      if (!Array.isArray(allProblems)) {
        throw new Error("Invalid response format: expected array of problems")
      }

      // Transform backend problem format to dashboard problem format
      let problems = allProblems.map((p) => ({
        id: parseInt(p.id) || 0,
        title: p.title,
        difficulty: p.difficulty,
        category: p.tags[0] || "General",
        tags: p.tags || [],
        status: "unsolved" as const, // TODO: Get actual status from submissions
        acceptanceRate: 50, // Placeholder
        submissions: 0, // Placeholder
      }))

      // Apply filters
      if (params.search) {
        const search = params.search.toLowerCase()
        problems = problems.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.tags.some((tag) => tag.toLowerCase().includes(search))
        )
      }

      if (params.category && params.category !== "All") {
        problems = problems.filter((p) => p.category === params.category)
      }

      if (params.difficulty && params.difficulty !== "All") {
        problems = problems.filter((p) => p.difficulty === params.difficulty)
      }

      if (params.status && params.status !== "all") {
        problems = problems.filter((p) => p.status === params.status)
      }

      // Pagination
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const totalCount = problems.length
      const totalPages = Math.ceil(totalCount / pageSize)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedProblems = problems.slice(start, end)

      return {
        success: true,
        data: {
          problems: paginatedProblems,
          totalCount,
          currentPage: page,
          totalPages,
          hasMore: page < totalPages,
        },
        message: "Problems fetched successfully",
      }
    } catch (error) {
      console.error("Error fetching problems:", error)
      return {
        success: false,
        data: {
          problems: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false,
        },
        error:
          error instanceof Error ? error.message : "Failed to fetch problems",
        message: "Error fetching problems",
      }
    }
  }

  async getPerformanceData(): Promise<ApiResponse<GetPerformanceDataResponse>> {
    if (this.useMock) {
      return MockDashboardService.getPerformanceData()
    }

    // Placeholder: Performance data not available in backend yet
    return {
      success: true,
      data: {
        performance: {
          chartData: [],
          stats: {
            avgTimePerProblem: 0,
            bestLanguage: "Unknown",
            mostSolvedCategory: "Unknown",
          },
        },
      },
      message: "Performance data not yet available",
    }
  }

  async getStreakData(): Promise<ApiResponse<GetStreakDataResponse>> {
    if (this.useMock) {
      return MockDashboardService.getStreakData()
    }

    // Placeholder: Streak data not available in backend yet
    return {
      success: true,
      data: {
        streak: {
          current: 0,
          longest: 0,
          calendar: [],
        },
      },
      message: "Streak data not yet available",
    }
  }

  async getRecentSubmissions(): Promise<
    ApiResponse<GetRecentSubmissionsResponse>
  > {
    if (this.useMock) {
      return MockDashboardService.getRecentSubmissions()
    }

    try {
      // Get current user
      const user = await authService.me()

      // Get recent submissions
      const submissions = await getSubmissions(user.id)

      // Transform to dashboard format
      const recentSubmissions = submissions.slice(0, 5).map((s) => ({
        id: s.id,
        problemId: 0, // Need to parse from submission
        problemTitle: "Problem", // Need to fetch problem details
        status: s.status,
        language: "Unknown", // Need language mapping
        submittedAt: s.createdAt,
        runtime: s.time || "0ms",
        memory: s.memory ? `${s.memory}KB` : "0KB",
      }))

      return {
        success: true,
        data: { submissions: recentSubmissions },
        message: "Recent submissions fetched successfully",
      }
    } catch (error) {
      return {
        success: false,
        data: { submissions: [] },
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch submissions",
        message: "Error fetching submissions",
      }
    }
  }

  async getProblemById(id: number): Promise<ApiResponse<Problem | null>> {
    if (this.useMock) {
      return MockDashboardService.getProblemById(id)
    }

    try {
      const problem = await getProblem(id.toString())

      return {
        success: true,
        data: {
          id: parseInt(problem.id) || 0,
          title: problem.title,
          difficulty: problem.difficulty,
          category: problem.tags[0] || "General",
          tags: problem.tags,
          status: "unsolved" as const,
          acceptanceRate: 50,
          submissions: 0,
        },
        message: "Problem fetched successfully",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to fetch problem",
        message: "Error fetching problem",
      }
    }
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
  getProblemById,
} = dashboardService
