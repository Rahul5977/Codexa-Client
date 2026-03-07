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

export interface Exam {
  id: string
  title: string
  subtitle?: string
  description?: string
  startTime: Date
  duration: number // in minutes
  classroomId: string
  createdAt: Date
  updatedAt: Date
  problems: ExamProblem[]
  submissions?: ExamSubmission[]
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

export interface ExamProblem {
  id: string
  examId: string
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
    // Include test cases and function metadata for code execution
    testcases?: any[]
    functionName?: string
    parameters?: any
    returnType?: string
    codeStubs?: Record<string, string>
    // hiddenTestcases excluded for security (only used for grading)
  }
}

export interface ProctoringViolation {
  type: string
  timestamp: string
  description?: string
}

export interface ExamSubmission {
  id: string
  examId: string
  studentId: string
  solutions: Record<string, { code: string; language: string }> // problemId -> solution
  startedAt: Date
  submittedAt: Date | null
  finishedAt: Date | null
  grade?: number
  feedback?: string
  proctoringViolations?: ProctoringViolation[]
  tabSwitchCount?: number
  fullscreenExitCount?: number
  warningCount?: number
  autoSubmitted?: boolean
  createdAt: Date
  updatedAt: Date
  student?: {
    id: string
    name: string
    email: string
  }
  exam?: {
    id: string
    title: string
    startTime: Date
    duration: number
  }
}

export interface CreateExamDto {
  title: string
  subtitle?: string
  description?: string
  startTime: Date
  duration: number
  problems: Array<{
    problemId: string
    order: number
  }>
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

  async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/assignment/${assignmentId}/student/${studentId}/submission`
      )
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

  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<AssignmentSubmission> {
    const response = await apiClient.patch(
      `${this.baseURL}/assignment/${assignmentId}/submission/${submissionId}/grade`,
      { grade, feedback }
    )
    const data = response.data as { submission: AssignmentSubmission }
    return data.submission
  }

  async updateAssignmentDeadline(
    assignmentId: string,
    deadline: Date
  ): Promise<Assignment> {
    const response = await apiClient.patch(
      `${this.baseURL}/assignment/${assignmentId}/deadline`,
      { deadline: deadline.toISOString() }
    )
    const data = response.data as { assignment: Assignment }
    return data.assignment
  }

  // Exam methods
  async getClassroomExams(classroomId: string): Promise<Exam[]> {
    const response = await apiClient.get(
      `${this.baseURL}/${classroomId}/exams`
    )
    const exams = (response.data as any).exams as Exam[]
    return exams.map((exam: Exam) => ({
      ...exam,
      startTime: new Date(exam.startTime),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt),
    }))
  }

  async getExamById(examId: string): Promise<Exam> {
    const response = await apiClient.get(`${this.baseURL}/exam/${examId}`)
    const exam = (response.data as any).exam as Exam
    return {
      ...exam,
      startTime: new Date(exam.startTime),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt),
    }
  }

  async createExam(
    classroomId: string,
    examData: CreateExamDto
  ): Promise<Exam> {
    const response = await apiClient.post(
      `${this.baseURL}/${classroomId}/exam`,
      examData
    )
    const exam = (response.data as any).exam as Exam
    return {
      ...exam,
      startTime: new Date(exam.startTime),
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt),
    }
  }

  async startExam(examId: string): Promise<ExamSubmission> {
    const response = await apiClient.post(
      `${this.baseURL}/exam/${examId}/start`
    )
    const submission = (response.data as any).submission as ExamSubmission
    return {
      ...submission,
      startedAt: new Date(submission.startedAt),
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : null,
      finishedAt: submission.finishedAt ? new Date(submission.finishedAt) : null,
      createdAt: new Date(submission.createdAt),
      updatedAt: new Date(submission.updatedAt),
    }
  }

  async getMyExamSubmission(examId: string): Promise<ExamSubmission | null> {
    const response = await apiClient.get(
      `${this.baseURL}/exam/${examId}/my-submission`
    )
    // Backend returns: { statusCode, data: { submission } | null, message, success }
    // When no submission: data is null
    // When has submission: data is { submission: {...} }
    const responseData = response.data as any
    
    if (!responseData || responseData === null) {
      return null
    }
    
    const submission = responseData.submission as ExamSubmission | null
    
    if (!submission) {
      return null
    }
    
    return {
      ...submission,
      startedAt: new Date(submission.startedAt),
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : null,
      finishedAt: submission.finishedAt ? new Date(submission.finishedAt) : null,
      createdAt: new Date(submission.createdAt),
      updatedAt: new Date(submission.updatedAt),
    }
  }

  async updateExamSubmission(
    examId: string,
    solutions: Record<string, { code: string; language: string }>
  ): Promise<ExamSubmission> {
    const response = await apiClient.put(
      `${this.baseURL}/exam/${examId}/submission`,
      { solutions }
    )
    const submission = (response.data as any).submission as ExamSubmission
    return {
      ...submission,
      startedAt: new Date(submission.startedAt),
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : null,
      finishedAt: submission.finishedAt ? new Date(submission.finishedAt) : null,
      createdAt: new Date(submission.createdAt),
      updatedAt: new Date(submission.updatedAt),
    }
  }

  async finishExam(examId: string): Promise<ExamSubmission> {
    const response = await apiClient.post(
      `${this.baseURL}/exam/${examId}/finish`
    )
    const submission = (response.data as any).submission as ExamSubmission
    return {
      ...submission,
      startedAt: new Date(submission.startedAt),
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : null,
      finishedAt: submission.finishedAt ? new Date(submission.finishedAt) : null,
      createdAt: new Date(submission.createdAt),
      updatedAt: new Date(submission.updatedAt),
    }
  }

  async logProctoringViolation(
    examId: string,
    violation: { type: string; timestamp: string; description?: string }
  ): Promise<{ violationCount: number }> {
    const response = await apiClient.post(
      `${this.baseURL}/exam/${examId}/violation`,
      violation
    )
    return response.data as { violationCount: number }
  }

  async getExamSubmissions(examId: string): Promise<ExamSubmission[]> {
    const response = await apiClient.get(
      `${this.baseURL}/exam/${examId}/submissions`
    )
    const submissions = (response.data as any).submissions as ExamSubmission[]
    return submissions.map((submission: ExamSubmission) => ({
      ...submission,
      startedAt: new Date(submission.startedAt),
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : null,
      finishedAt: submission.finishedAt ? new Date(submission.finishedAt) : null,
      createdAt: new Date(submission.createdAt),
      updatedAt: new Date(submission.updatedAt),
    }))
  }

  async updateExamGrade(
    examId: string,
    studentId: string,
    gradeData: { grade?: number; feedback?: string }
  ): Promise<void> {
    await apiClient.put(
      `${this.baseURL}/exam/${examId}/grade/${studentId}`,
      gradeData
    )
  }
}

export const assignmentService = new AssignmentService()
