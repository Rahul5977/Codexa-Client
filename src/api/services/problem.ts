import { apiClient } from "../client"

// Types for problems
export interface Example {
  input: string
  output: string
  explanation?: string
}

export interface TestCase {
  input: string
  output: string
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD"

export interface Problem {
  id: string
  title: string
  difficulty: Difficulty
  statement: string
  examples: Example[]
  constraints: string[]
  tags: string[]
  hints: string[]
  companies: string[]
  testcases: TestCase[]
  createdAt: string
  updatedAt: string
}

export interface CreateProblemInput {
  title: string
  difficulty: Difficulty
  statement: string
  examples: Example[]
  constraints: string[]
  tags: string[]
  hints: string[]
  companies: string[]
  testcases: TestCase[]
}

export interface UpdateProblemInput extends Partial<CreateProblemInput> {}

// Backend API response wrapper
interface ApiResponseWrapper<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

/**
 * Get all problems
 */
export const getAllProblems = async (): Promise<Problem[]> => {
  const problemServiceUrl =
    import.meta.env.VITE_PROBLEM_SERVICE_URL || "http://localhost:3002/api"
  const response = await apiClient.get<ApiResponseWrapper<Problem[]>>(
    `${problemServiceUrl}/problems`
  )
  return response.data
}

/**
 * Get problem by ID
 */
export const getProblemById = async (id: string): Promise<Problem> => {
  const problemServiceUrl =
    import.meta.env.VITE_PROBLEM_SERVICE_URL || "http://localhost:3002/api"
  const response = await apiClient.get<ApiResponseWrapper<Problem>>(
    `${problemServiceUrl}/problems/${id}`
  )
  return response.data
}

/**
 * Create a new problem (Admin/Teacher only)
 */
export const createProblem = async (
  data: CreateProblemInput
): Promise<Problem> => {
  const problemServiceUrl =
    import.meta.env.VITE_PROBLEM_SERVICE_URL || "http://localhost:3002/api"
  const response = await apiClient.post<ApiResponseWrapper<Problem>>(
    `${problemServiceUrl}/problems`,
    data
  )
  return response.data
}

/**
 * Update a problem (Admin/Teacher only)
 */
export const updateProblem = async (
  id: string,
  data: UpdateProblemInput
): Promise<Problem> => {
  const problemServiceUrl =
    import.meta.env.VITE_PROBLEM_SERVICE_URL || "http://localhost:3002/api"
  const response = await apiClient.put<ApiResponseWrapper<Problem>>(
    `${problemServiceUrl}/problems/${id}`,
    data
  )
  return response.data
}

/**
 * Delete a problem (Admin/Teacher only)
 */
export const deleteProblem = async (id: string): Promise<void> => {
  const problemServiceUrl =
    import.meta.env.VITE_PROBLEM_SERVICE_URL || "http://localhost:3002/api"
  await apiClient.delete(`${problemServiceUrl}/problems/${id}`)
}
