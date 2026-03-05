import { apiClient } from "../client"
import { API_CONFIG } from "../config"
import type { PaginatedResponse, PaginationParams } from "../types/common"

export interface Assignment {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  classroomId: string
  createdAt: Date
  updatedAt: Date
  problems: AssignmentProblem[]
  submissions?: AssignmentSubmission[]
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
  name: string
  description: string
  startDate: Date
  endDate: Date
  classroomId: string
  problemIds: string[]
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
  ): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get(
      `${this.baseURL}/${classroomId}/assignments`,
      { params }
    )
    return response.data
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    const response = await apiClient.get(
      `${this.baseURL}/assignment/${assignmentId}`
    )
    return response.data
  }

  async createAssignment(data: CreateAssignmentDto): Promise<Assignment> {
    const response = await apiClient.post(
      `${this.baseURL}/${data.classroomId}/assignment`,
      data
    )
    return response.data
  }

  async submitAssignment(
    data: SubmitAssignmentDto
  ): Promise<AssignmentSubmission> {
    const response = await apiClient.post(
      `${this.baseURL}/assignment/${data.assignmentId}/submit`,
      data
    )
    return response.data
  }

  async getAssignmentSubmissions(
    assignmentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<AssignmentSubmission>> {
    const response = await apiClient.get(
      `${this.baseURL}/assignment/${assignmentId}/submissions`,
      { params }
    )
    return response.data
  }

  async getMySubmission(
    assignmentId: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/assignment/${assignmentId}/my-submission`
      )
      // Backend returns { data: { submission: {...} } } or { data: null }
      return response.data?.submission || null
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return null
      }
      throw error
    }
  }
}

export const assignmentService = new AssignmentService()
