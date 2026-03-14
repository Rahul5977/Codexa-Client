import { apiClient } from '../client'

const rawCodeServiceUrl =
  import.meta.env.VITE_CODE_SERVICE_URL || 'http://localhost:8003/api'

const CODE_SERVICE_URL = rawCodeServiceUrl.endsWith('/api')
  ? rawCodeServiceUrl
  : `${rawCodeServiceUrl.replace(/\/$/, '')}/api`

const unwrapData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T
  }
  return response as T
}

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
  user?: {
    id: string
    name: string
    email: string
  }
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
  problemId: string
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
  problemId?: string
  status: SubmissionStatus
  stdout?: string
  stderr?: string
  time?: string
  memory?: number
  createdAt: string
  languageId: number
  language?: string
  code?: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
  }
}

/**
 * Run code (dry run without submission)
 */
export const runCode = async (data: RunCodeInput): Promise<RunCodeResult> => {
  const response = await apiClient.post<RunCodeResult>(
    `${CODE_SERVICE_URL}/submissions/run`,
    data
  )
  return unwrapData<RunCodeResult>(response)
}

/**
 * Submit code for evaluation
 */
export const submitCode = async (data: CreateSubmissionInput): Promise<{ message: string; submissionId: string }> => {
  const response = await apiClient.post<{ message: string; submissionId: string }>(
    `${CODE_SERVICE_URL}/submissions`,
    data
  )
  return unwrapData<{ message: string; submissionId: string }>(response)
}

/**
 * Get submission by ID (for polling)
 */
export const getSubmissionById = async (id: string): Promise<{ message: string; submission: SubmissionResult }> => {
  const response = await apiClient.get<{ message: string; submission: SubmissionResult }>(
    `${CODE_SERVICE_URL}/submissions/${id}`
  )
  return unwrapData<{ message: string; submission: SubmissionResult }>(response)
}

/**
 * Get all submissions for a user/problem
 */
export const getSubmissions = async (
  userId?: string, 
  problemId?: string, 
  status?: SubmissionStatus,
  languageIds?: number[],
  includeUser?: boolean
): Promise<SubmissionResult[]> => {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId)
  if (problemId) params.append('problemId', problemId)
  if (status) params.append('status', status)
  if (languageIds && languageIds.length > 0) params.append('languageIds', languageIds.join(','))
  if (includeUser) params.append('includeUser', 'true')
  
  const response = await apiClient.get<SubmissionResult[]>(
    `${CODE_SERVICE_URL}/submissions?${params.toString()}`
  )
  return unwrapData<SubmissionResult[]>(response)
}
