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
    description?: string
    statement?: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    examples?: any[]
    constraints?: string[]
    tags?: string[]
    hints?: string[]
    companies?: string[]
    // testCases excluded for security
  }
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  solutions: Record<string, { code: string; language: string }> // problemId -> solution
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
  solutions: Record<string, { code: string; language: string }>
}

export interface AssignmentDraft {
  id: string
  assignmentId: string
  studentId: string
  problemId: string
  code: string
  languageId: number
  createdAt: Date
  updatedAt: Date
}

export interface SaveDraftDto {
  problemId: string
  code: string
  languageId: number
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
    const data = response.data as { assignment: Assignment }
    return data.assignment
  }

  async createAssignment(
    classroomId: string,
    data: CreateAssignmentDto
  ): Promise<Assignment> {
    const response = await apiClient.post(
      `${this.baseURL}/${classroomId}/assignment`,
      data
    )
    const responseData = response.data as { assignment: Assignment }
    return responseData.assignment
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

  async saveDraft(
    assignmentId: string,
    data: SaveDraftDto
  ): Promise<AssignmentDraft> {
    const response = await apiClient.post(
      `${this.baseURL}/assignment/${assignmentId}/draft`,
      data
    )
    const responseData = response.data as { draft: AssignmentDraft }
    return responseData.draft
  }

  async getDraft(
    assignmentId: string,
    problemId: string
  ): Promise<AssignmentDraft | null> {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/assignment/${assignmentId}/problem/${problemId}/draft`
      )
      const data = response.data as { draft?: AssignmentDraft } | null
      return data?.draft || null
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return null
      }
      throw error
    }
  }

  async getAssignmentDrafts(assignmentId: string): Promise<AssignmentDraft[]> {
    const response = await apiClient.get(
      `${this.baseURL}/assignment/${assignmentId}/drafts`
    )
    const data = response.data as { drafts: AssignmentDraft[] }
    return data.drafts || []
  }

  async deleteAssignmentDrafts(assignmentId: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/assignment/${assignmentId}/drafts`)
  }
}

export const assignmentService = new AssignmentService()
