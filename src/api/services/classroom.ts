import { apiClient } from "../client"
import { API_CONFIG } from "../config"

// Types for classroom
export interface Classroom {
  id: string
  name: string
  description?: string
  code: string
  imageUrl?: string
  teacher: {
    id: string
    name: string
    email: string
  }
  studentCount: number
  createdAt: string
  updatedAt: string
  joinedAt?: string // for student enrollments
}

export interface CreateClassroomRequest {
  name: string
  description?: string
  imageUrl?: string
}

export interface JoinClassroomRequest {
  code: string
}

export interface ClassroomResponse {
  teaching: Classroom[]
  enrolled: Classroom[]
}

export interface Student {
  id: string
  name: string
  email: string
  currentRating: number
  totalSolved: number
  easyCount: number
  mediumCount: number
  hardCount: number
  joinedAt: string
}

export interface ClassroomStudentsResponse {
  classroom: {
    id: string
    name: string
    teacher: {
      id: string
      name: string
      email: string
    }
  }
  students: Student[]
  totalStudents: number
}

// Classroom Service
export class ClassroomService {
  private baseURL = `${API_CONFIG.CLASSROOM_SERVICE_URL}/classroom`

  /**
   * Get user's classrooms (both teaching and enrolled)
   */
  async getMyClassrooms(): Promise<ClassroomResponse> {
    const response = await apiClient.get(`${this.baseURL}/my-classrooms`)
    return response.data.data
  }

  /**
   * Get a specific classroom by ID
   */
  async getClassroomById(classroomId: string): Promise<Classroom> {
    const response = await apiClient.get(`${this.baseURL}/${classroomId}`)
    return response.data.data.classroom
  }

  /**
   * Create a new classroom (teachers only)
   */
  async createClassroom(data: CreateClassroomRequest): Promise<Classroom> {
    const response = await apiClient.post(`${this.baseURL}/create`, data)
    return response.data.data.classroom
  }

  /**
   * Join a classroom using code (students only)
   */
  async joinClassroom(data: JoinClassroomRequest): Promise<Classroom> {
    const response = await apiClient.post(`${this.baseURL}/join`, data)
    return response.data.data.classroom
  }

  /**
   * Get enrolled students in a classroom (teachers only)
   */
  async getClassroomStudents(classroomId: string): Promise<ClassroomStudentsResponse> {
    const response = await apiClient.get(`${this.baseURL}/${classroomId}/students`)
    return response.data.data
  }

  /**
   * Update classroom details (teachers only)
   */
  async updateClassroom(classroomId: string, data: Partial<CreateClassroomRequest>): Promise<Classroom> {
    const response = await apiClient.put(`${this.baseURL}/${classroomId}`, data)
    return response.data.data.classroom
  }

  /**
   * Delete a classroom (teachers only)
   */
  async deleteClassroom(classroomId: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/${classroomId}`)
  }
}

// Export singleton instance
export const classroomService = new ClassroomService()