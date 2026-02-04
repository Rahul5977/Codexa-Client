import { apiClient } from '../client'

// Types for submissions
export type SubmissionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'

export interface Submission {
  id: string
  userId: string
  problemId: string
  code: string
  languageId: number
  status: SubmissionStatus
  stdout?: string
  stderr?: string
  time?: string
  memory?: number
  createdAt: string
  updatedAt: string
}

export interface CreateSubmissionInput {
  userId: string
  problemId: string
  code: string
  languageId: number
}

export interface RunCodeInput {
  code: string
  languageId: number
  stdin?: string
}

export interface RunCodeResult {
  status: string
  stdout?: string
  stderr?: string
  compile_output?: string
  time?: string
  memory?: number
}

export interface SubmissionResult {
  id: string
  status: SubmissionStatus
  stdout?: string
  stderr?: string
  time?: string
  memory?: number
  createdAt: string
  languageId: number
}

/**
 * Run code (dry run without submission)
 */
export const runCode = async (data: RunCodeInput): Promise<RunCodeResult> => {
  const codeServiceUrl = import.meta.env.VITE_CODE_SERVICE_URL || 'http://localhost:3004'
  const response = await apiClient.post<RunCodeResult>(
    `${codeServiceUrl}/submissions/run`,
    data
  )
  return response.data
}

/**
 * Submit code for evaluation
 */
export const submitCode = async (data: CreateSubmissionInput): Promise<{ message: string; submissionId: string }> => {
  const codeServiceUrl = import.meta.env.VITE_CODE_SERVICE_URL || 'http://localhost:3004'
  const response = await apiClient.post<{ message: string; submissionId: string }>(
    `${codeServiceUrl}/submissions`,
    data
  )
  return response.data
}

/**
 * Get submission by ID (for polling)
 */
export const getSubmissionById = async (id: string): Promise<{ message: string; submission: SubmissionResult }> => {
  const codeServiceUrl = import.meta.env.VITE_CODE_SERVICE_URL || 'http://localhost:3004'
  const response = await apiClient.get<{ message: string; submission: SubmissionResult }>(
    `${codeServiceUrl}/submissions/${id}`
  )
  return response.data
}

/**
 * Get all submissions for a user/problem
 */
export const getSubmissions = async (userId?: string, problemId?: string): Promise<SubmissionResult[]> => {
  const codeServiceUrl = import.meta.env.VITE_CODE_SERVICE_URL || 'http://localhost:3004'
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (problemId) params.append('problemId', problemId)
  
  const response = await apiClient.get<SubmissionResult[]>(
    `${codeServiceUrl}/submissions?${params.toString()}`
  )
  return response.data
}
