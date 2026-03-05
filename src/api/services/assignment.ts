import { apiClient } from "../client"
import { API_CONFIG } from "../config"
import type { PaginatedResponse, PaginationParams } from "../types/common"

export interface Assignment {
  id: string
  title: string
  subtitle?: string
  description?: string
  deadline: Date
  classroomId: string
  createdAt: Date
  updatedAt: Date
  problems: AssignmentProblem[]
  submissions?: AssignmentSubmission[]
  classroom?: {
    id: string
    name: string
    teacher: {
      id: string
      name: string
      email: string
    }
  }
  _count?: {
    submissions: number
  }
}

export interface AssignmentProblem {
  id: string
  assignmentId: string
  problemId: string
  problem: {
    id: string
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    testCases: any[]
  }
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  solutions: Record<string, string> // problemId -> solution code
  submittedAt: Date
  grade?: number
  feedback?: string
  student: {
    id: string
    name: string
    email: string
  }
}

export interface CreateAssignmentDto {
  title: string
  subtitle?: string
  description?: string
  deadline: Date
  problems: Array<{
    problemId: string
    order: number
  }>
}

export interface SubmitAssignmentDto {
  assignmentId: string
  solutions: Record<string, string>
}

export class AssignmentService {
  private baseURL = `${API_CONFIG.CLASSROOM_SERVICE_URL}/classroom`

  async getClassroomAssignments(
    classroomId: string,
    params?: PaginationParams
  ): Promise<{ assignments: Assignment[] }> {
    const response = await apiClient.get(
      `${this.baseURL}/${classroomId}/assignments`,
      { params }
    )
    return response.data as { assignments: Assignment[] }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    const response = await apiClient.get(
      `${this.baseURL}/assignment/${assignmentId}`
    )
    return response.data as Assignment
  }

  async createAssignment(
    classroomId: string,
    data: CreateAssignmentDto
  ): Promise<Assignment> {
    const response = await apiClient.post(
      `${this.baseURL}/${classroomId}/assignment`,
      data
    )
    return response.data as Assignment
  }

  async submitAssignment(
    data: SubmitAssignmentDto
  ): Promise<AssignmentSubmission> {
    const response = await apiClient.post(
      `${this.baseURL}/assignment/${data.assignmentId}/submit`,
      data
    )
    return response.data as AssignmentSubmission
  }

  async getAssignmentSubmissions(
    assignmentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<AssignmentSubmission>> {
    const response = await apiClient.get(
      `${this.baseURL}/assignment/${assignmentId}/submissions`,
      { params }
    )
    return response.data as PaginatedResponse<AssignmentSubmission>
  }

  async getMySubmission(
    assignmentId: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/assignment/${assignmentId}/my-submission`
      )
      // Backend returns { data: { submission: {...} } } or { data: null }
      const data = response.data as { submission?: AssignmentSubmission } | null
      return data?.submission || null
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return null
      }
      throw error
    }
  }
}

export const assignmentService = new AssignmentService()