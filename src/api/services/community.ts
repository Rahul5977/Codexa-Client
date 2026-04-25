import { apiClient } from '../client'
import { API_CONFIG } from '../config'

const COMMUNITY_BASE_URL = API_CONFIG.COMMUNITY_SERVICE_URL

interface ApiResponseWrapper<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

export interface CommunityRoomMember {
  userId: string
  name: string
  email: string
  imageUrl?: string
  role: 'HOST' | 'PARTICIPANT'
  joinedAt: string
}

export interface CommunityRoomProblem {
  problemId: string
  title: string
  difficulty: string
  addedAt: string
  solvedCount: number
  solvedBy: Array<{
    userId: string
    name: string
    solvedAt: string
  }>
}

export interface CommunityContest {
  durationMinutes: number | null
  startedAt: string | null
  endedAt: string | null
  status: 'NOT_STARTED' | 'ACTIVE' | 'ENDED'
}

export interface CommunityRoom {
  id: string
  name: string
  inviteCode: string | null
  joinLink: string | null
  allowLateJoin: boolean
  isActive: boolean
  hostUserId: string
  hostName: string
  isHost: boolean
  createdAt: string
  contest: CommunityContest
  members: CommunityRoomMember[]
  problems: CommunityRoomProblem[]
}

export interface CommunityLeaderboardEntry {
  userId: string
  name: string
  email: string
  score: number
  solvedCount: number
  totalAttempts: number
  totalTimeSec: number
}

export interface CommunityContestAnalysis {
  overview: {
    totalMembers: number
    totalProblems: number
    durationMinutes: number | null
    startedAt: string | null
    endedAt: string | null
  }
  leaderboard: CommunityLeaderboardEntry[]
  currentUser: {
    userId: string
    name: string
  }
  problemBreakdown: Array<{
    problemId: string
    title: string
    difficulty: string
    solvedCount: number
    acceptedSubmissions: number
    totalAttempts: number
    firstSolver: {
      userId: string
      name: string
      solvedAt: string
    } | null
  }>
  perProblemUserAnalysis: Array<{
    problemId: string
    title: string
    difficulty: string
    optimalSolution: {
      submissionId: string
      userId: string
      userName: string
      code: string
      languageId: number
      status: string
      executionTime: number | null
      memory: number | null
      submittedAt: string
      attemptsToSolve: number
      efficiencyScore: number
    } | null
    userSolution: {
      submissionId: string
      userId: string
      userName: string
      code: string
      languageId: number
      status: string
      executionTime: number | null
      memory: number | null
      submittedAt: string
      attemptsToSolve: number
      efficiencyScore: number
    } | null
    comparison: {
      summary: string
      efficiencyDelta: number | null
      timeDelta: number | null
      memoryDelta: number | null
      attemptsDelta: number | null
    }
  }>
}

export interface CommunityMyRoom {
  id: string
  name: string
  isHost: boolean
  createdAt: string
  updatedAt: string
  contest: {
    startedAt: string | null
    endedAt: string | null
    status: 'NOT_STARTED' | 'ACTIVE' | 'ENDED'
  }
}

export interface UserContestHistory {
  id: string
  name: string
  hostUserId: string
  createdAt: string
  updatedAt: string
  contest: {
    startedAt: string | null
    endedAt: string | null
    status: 'NOT_STARTED' | 'ACTIVE' | 'ENDED'
  }
}

export interface RoomSubmission {
  id: string
  userId: string
  userName: string
  problemId: string
  problemTitle: string
  difficulty: string
  code: string
  languageId: number
  status: string
  executionTime: number | null
  memory: number | null
  submittedAt: string
}
export const communityService = {
  getMyRooms: async (): Promise<CommunityMyRoom[]> => {
    const response = await apiClient.get<ApiResponseWrapper<{ rooms: CommunityMyRoom[] }>>(
      `${COMMUNITY_BASE_URL}/rooms/my`,
    )

    return (response as any).data.rooms
  },

  getUserContestHistory: async (userId: string): Promise<UserContestHistory[]> => {
    const response = await apiClient.get<ApiResponseWrapper<{ rooms: UserContestHistory[] }>>(
      `${COMMUNITY_BASE_URL}/users/${userId}/contests`,
    )

    return (response as any).data.rooms
  },

  createRoom: async (payload: { name?: string; invitedFriendIds: string[] }) => {
    const response = await apiClient.post<ApiResponseWrapper<{
      id: string
      name: string
      inviteCode: string | null
      joinLink: string | null
      memberCount: number
    }>>(`${COMMUNITY_BASE_URL}/rooms`, payload)

    return (response as any).data
  },

  joinRoomByInvite: async (inviteCode: string) => {
    const response = await apiClient.post<ApiResponseWrapper<{
      roomId: string
      roomName: string
      inviteCode: string
    }>>(`${COMMUNITY_BASE_URL}/rooms/join/${inviteCode}`)

    return (response as any).data
  },

  getRoomById: async (roomId: string): Promise<CommunityRoom> => {
    const response = await apiClient.get<ApiResponseWrapper<CommunityRoom>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}`,
    )

    return (response as any).data
  },

  updateRoomSettings: async (
    roomId: string,
    payload: {
      name?: string
      allowLateJoin?: boolean
      isActive?: boolean
      contestDurationMinutes?: number | null
    },
  ) => {
    await apiClient.patch<ApiResponseWrapper<null>>(`${COMMUNITY_BASE_URL}/rooms/${roomId}/settings`, payload)
  },

  addProblems: async (roomId: string, problemIds: string[]) => {
    const response = await apiClient.post<ApiResponseWrapper<{ addedProblemIds: string[] }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/problems`,
      { problemIds },
    )

    return (response as any).data
  },

  removeProblems: async (roomId: string, problemIds: string[]) => {
    const response = await apiClient.post<ApiResponseWrapper<{ removedProblemIds: string[] }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/problems/remove`,
      { problemIds },
    )

    return (response as any).data
  },

  generateInviteLink: async (roomId: string): Promise<{ inviteCode: string; joinLink: string }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ inviteCode: string; joinLink: string }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/generate-invite`,
    )

    return (response as any).data
  },

  startContest: async (roomId: string) => {
    const response = await apiClient.post<ApiResponseWrapper<{ startedAt: string; endedAt: string | null }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/start-contest`,
    )
    return (response as any).data
  },

  endContest: async (roomId: string) => {
    const response = await apiClient.post<ApiResponseWrapper<{ endedAt: string }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/end-contest`,
    )
    return (response as any).data
  },

  getLeaderboard: async (roomId: string): Promise<CommunityLeaderboardEntry[]> => {
    const response = await apiClient.get<ApiResponseWrapper<{ leaderboard: CommunityLeaderboardEntry[] }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/leaderboard`,
    )
    return (response as any).data.leaderboard
  },

  getAnalysis: async (roomId: string): Promise<CommunityContestAnalysis> => {
    const response = await apiClient.get<ApiResponseWrapper<CommunityContestAnalysis>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/analysis`,
    )
    return (response as any).data
  },
  getRoomSubmissions: async (roomId: string): Promise<RoomSubmission[]> => {
    const response = await apiClient.get<ApiResponseWrapper<{ submissions: RoomSubmission[] }>>(
      `${COMMUNITY_BASE_URL}/rooms/${roomId}/submissions`,
    )
    return (response as any).data.submissions
  },
}
