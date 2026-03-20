import { apiClient } from "../client"

const rawCodeServiceUrl = import.meta.env.VITE_CODE_SERVICE_URL || "http://localhost:8003/api"

const CODE_SERVICE_URL = rawCodeServiceUrl.endsWith("/api")
  ? rawCodeServiceUrl
  : `${rawCodeServiceUrl.replace(/\/$/, "")}/api`

const unwrapData = <T>(response: any): T => {
  if (response && typeof response === "object" && "data" in response) {
    return response.data as T
  }
  return response as T
}

export interface IdeTreeNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: IdeTreeNode[]
}

export interface IdeWorkspaceData {
  tree: IdeTreeNode[]
  fileContents: Record<string, string>
  selectedNodeId?: string | null
  selectedLanguageId?: string
  stdin?: string
  stdinMode?: "manual" | "file"
  selectedStdinFileId?: string | null
  expandedFolderIds?: string[]
}

export interface GetIdeWorkspaceResponse {
  message: string
  workspace: IdeWorkspaceData | null
}

export const getIdeWorkspace = async (userId: string): Promise<GetIdeWorkspaceResponse> => {
  const response = await apiClient.get<GetIdeWorkspaceResponse>(`${CODE_SERVICE_URL}/ide-workspace/${userId}`)
  return unwrapData<GetIdeWorkspaceResponse>(response)
}

export const saveIdeWorkspace = async (userId: string, workspace: IdeWorkspaceData): Promise<{ message: string; updatedAt: string }> => {
  const response = await apiClient.put<{ message: string; updatedAt: string }>(`${CODE_SERVICE_URL}/ide-workspace/${userId}`, {
    workspace,
  })
  return unwrapData<{ message: string; updatedAt: string }>(response)
}
