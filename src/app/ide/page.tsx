import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import {
  FolderPlus,
  FilePlus2,
  Folder,
  FolderOpen,
  FileCode2,
  Play,
  Loader2,
  TerminalSquare,
  Trash2,
  ChevronRight,
  Check,
  X,
  Upload,
  Send,
  ArrowLeft,
  Brain,
  AlertCircle,
  RefreshCw,
  Clock,
  Camera,
  Mic,
  Maximize,
  ShieldAlert,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import { submitExecution, waitForExecutionResult, type ExecutionArtifact, type ExecutionRequest } from "@/api/services/execution-engine"
import { getIdeWorkspace, saveIdeWorkspace } from "@/api/services/ide-workspace"
import { assignmentService, type AssignmentIdeWorkspace, type IdeAssignmentFile, type Exam, type ExamSubmission } from "@/api/services/assignment"
import { generateCustomAIAnalysis, type AIAnalysisReport } from "@/api/services/ai-analytics"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useProctoring } from "@/hooks/use-proctoring"

type IdeLanguage = {
  id: ExecutionRequest["lang"]
  label: string
  monaco: string
  extension: string
}

type TreeNode = {
  id: string
  name: string
  type: "file" | "folder"
  children?: TreeNode[]
}

type FileEntry = {
  id: string
  path: string
}

type NewNodeType = "file" | "folder"

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"])
const BINARY_PREVIEW_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf"])
const MAX_RUNTIME_FILE_BYTES = 1024 * 1024
const MAX_RUNTIME_REFERENCED_FILE_BYTES = 1024 * 1024
const MAX_RUNTIME_TOTAL_BYTES = 5 * 1024 * 1024
const AI_SUPPORTED_EXTENSIONS = new Set([
  "py",
  "cpp",
  "cc",
  "cxx",
  "c",
  "java",
  "js",
  "ts",
  "tsx",
  "jsx",
  "go",
  "rs",
  "rb",
  "php",
  "cs",
  "kt",
  "swift",
  "sql",
  "json",
  "yml",
  "yaml",
  "sh",
  "md",
  "txt",
])

const LANGUAGE_TO_AI_LABEL: Partial<Record<ExecutionRequest["lang"], string>> = {
  python3: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
}

const isExecutionLanguage = (value: string): value is ExecutionRequest["lang"] => {
  return IDE_LANGUAGES.some((language) => language.id === value)
}

const IDE_LANGUAGES: IdeLanguage[] = [
  { id: "python3", label: "Python 3", monaco: "python", extension: "py" },
  { id: "cpp", label: "C++", monaco: "cpp", extension: "cpp" },
  { id: "c", label: "C", monaco: "c", extension: "c" },
  { id: "java", label: "Java", monaco: "java", extension: "java" },
]

const DEFAULT_TREE: TreeNode[] = [
  {
    id: "folder-src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "file-main-py",
        name: "main.py",
        type: "file",
      },
    ],
  },
]

const DEFAULT_FILE_CONTENT: Record<string, string> = {
  "file-main-py": "print(\"Hello Codexa IDE\")\n",
}

const createWorkspaceFromIdeFiles = (files: IdeAssignmentFile[]): AssignmentIdeWorkspace => {
  const baseTree: TreeNode[] = [{ id: "folder-assignment", name: "assignment-files", type: "folder", children: [] }]
  const baseContents: Record<string, string> = {}

  if (files.length === 0) {
    const placeholderId = "file-assignment-readme"
    const folderNode = baseTree[0]
    if (folderNode.type === "folder") {
      folderNode.children = [{ id: placeholderId, name: "README.md", type: "file" }]
    }
    baseContents[placeholderId] =
      "# IDE Exam Workspace\n\nNo starter files were uploaded for this exam.\nYou can create files/folders and continue your solution here.\n"

    return {
      tree: baseTree,
      fileContents: baseContents,
      selectedNodeId: placeholderId,
      selectedLanguageId: "python3",
      stdin: "",
      stdinMode: "manual",
      selectedStdinFileId: null,
      expandedFolderIds: ["folder-assignment"],
    }
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const fileId = `file-assignment-${index}-${Date.now()}`
    const folderNode = baseTree[0]
    if (folderNode.type === "folder") {
      folderNode.children = [...(folderNode.children || []), { id: fileId, name: file.name, type: "file" }]
    }
    baseContents[fileId] = file.content || ""
  }

  const selectedNodeId = (baseTree[0].type === "folder" ? baseTree[0].children?.[0]?.id : null) || ""

  return {
    tree: baseTree,
    fileContents: baseContents,
    selectedNodeId,
    selectedLanguageId: "python3",
    stdin: "",
    stdinMode: "manual",
    selectedStdinFileId: null,
    expandedFolderIds: ["folder-assignment"],
  }
}

const resolveDefaultFolderId = (nodes: TreeNode[]): string | null => {
  const srcFolder = nodes.find((node) => node.type === "folder" && node.name === "src")
  if (srcFolder) {
    return srcFolder.id
  }

  const firstFolder = nodes.find((node) => node.type === "folder")
  return firstFolder?.id || null
}

const resolveLanguageByFileName = (fileName: string): IdeLanguage | null => {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (!ext) {
    return null
  }

  return IDE_LANGUAGES.find((language) => language.extension === ext) || null
}

const updateNodeChildren = (
  nodes: TreeNode[],
  targetId: string,
  updater: (children: TreeNode[]) => TreeNode[]
): TreeNode[] => {
  return nodes.map((node) => {
    if (node.id === targetId && node.type === "folder") {
      return {
        ...node,
        children: updater(node.children || []),
      }
    }

    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, targetId, updater),
      }
    }

    return node
  })
}

const findNodeById = (nodes: TreeNode[], targetId: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }

    if (node.type === "folder" && node.children) {
      const found = findNodeById(node.children, targetId)
      if (found) {
        return found
      }
    }
  }

  return null
}

const findParentFolderId = (
  nodes: TreeNode[],
  targetId: string,
  parentFolderId: string | null = null
): string | null | undefined => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return parentFolderId
    }

    if (node.type === "folder" && node.children) {
      const resolved = findParentFolderId(node.children, targetId, node.id)
      if (resolved !== undefined) {
        return resolved
      }
    }
  }

  return undefined
}

const generateNodeId = (type: NewNodeType) => {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

  return `${type}-${randomPart}`
}

const removeNodeById = (nodes: TreeNode[], targetId: string): TreeNode[] => {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => {
      if (node.type === "folder" && node.children) {
        return {
          ...node,
          children: removeNodeById(node.children, targetId),
        }
      }

      return node
    })
}

const collectFileEntries = (nodes: TreeNode[], parentPath = ""): FileEntry[] => {
  return nodes.flatMap((node) => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name

    if (node.type === "file") {
      return [{ id: node.id, path: currentPath }]
    }

    return collectFileEntries(node.children || [], currentPath)
  })
}

const readBrowserFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))

    const ext = extensionOf(file.name)
    if (BINARY_PREVIEW_EXTENSIONS.has(ext)) {
      reader.readAsDataURL(file)
      return
    }

    reader.readAsText(file)
  })
}

const getEditorLanguage = (fileName: string): string => {
  const codeLanguage = resolveLanguageByFileName(fileName)
  if (codeLanguage) {
    return codeLanguage.monaco
  }

  const extension = fileName.split(".").pop()?.toLowerCase()
  if (extension === "json") return "json"
  if (extension === "md") return "markdown"
  if (extension === "csv" || extension === "txt") return "plaintext"
  if (extension === "pdf" || IMAGE_EXTENSIONS.has(extension || "")) return "plaintext"

  return "plaintext"
}

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || ""

const isBinaryPreviewFile = (fileName: string) => BINARY_PREVIEW_EXTENSIONS.has(extensionOf(fileName))

const artifactToStoredContent = (artifact: ExecutionArtifact) => {
  if (artifact.encoding === "base64") {
    const mimeType = artifact.mimeType || "application/octet-stream"
    return `data:${mimeType};base64,${artifact.content}`
  }

  return artifact.content
}

const upsertTreeFileByPath = (nodes: TreeNode[], fullPath: string): TreeNode[] => {
  const segments = fullPath.split("/").filter(Boolean)
  if (segments.length === 0) {
    return nodes
  }

  const visit = (items: TreeNode[], depth: number): TreeNode[] => {
    const segment = segments[depth]
    const isLeaf = depth === segments.length - 1

    if (isLeaf) {
      const existingFile = items.find((node) => node.type === "file" && node.name === segment)
      if (existingFile) {
        return items
      }

      return [
        ...items,
        {
          id: `file-artifact-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          name: segment,
          type: "file",
        },
      ]
    }

    const existingFolder = items.find((node) => node.type === "folder" && node.name === segment)
    if (existingFolder) {
      return items.map((node) => {
        if (node.id !== existingFolder.id) {
          return node
        }

        return {
          ...node,
          children: visit(node.children || [], depth + 1),
        }
      })
    }

    const newFolder: TreeNode = {
      id: `folder-artifact-${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${depth}`,
      name: segment,
      type: "folder",
      children: visit([], depth + 1),
    }

    return [...items, newFolder]
  }

  return visit(nodes, 0)
}

const findFolderIdByPath = (nodes: TreeNode[], folderPath: string): string | null => {
  const segments = folderPath.split("/").filter(Boolean)
  if (segments.length === 0) {
    return null
  }

  let currentNodes = nodes
  let found: TreeNode | null = null

  for (const segment of segments) {
    const next = currentNodes.find((node) => node.type === "folder" && node.name === segment)
    if (!next) {
      return null
    }

    found = next
    currentNodes = next.children || []
  }

  return found?.id || null
}

const buildPythonRuntimeSource = (sourceCode: string): string => {
  return [
    "try:",
    "    import matplotlib",
    "    matplotlib.use('Agg')",
    "    import matplotlib.pyplot as _plt",
    "    _codexa_plot_count = {'value': 0}",
    "    _codexa_original_show = _plt.show",
    "    def _codexa_show(*args, **kwargs):",
    "        _codexa_plot_count['value'] += 1",
    "        _plt.savefig(f'codexa_plot_{_codexa_plot_count[\"value\"]}.png')",
    "        try:",
    "            return _codexa_original_show(*args, **kwargs)",
    "        except Exception:",
    "            return None",
    "    _plt.show = _codexa_show",
    "except Exception:",
    "    pass",
    "",
    sourceCode,
  ].join("\n")
}

const isReferencedRuntimeFile = (sourceCode: string, path: string): boolean => {
  const normalizedSource = sourceCode.replace(/\r\n/g, "\n")
  const normalizedPath = path.replace(/\\/g, "/")
  const fileName = normalizedPath.split("/").pop() || normalizedPath

  return [normalizedPath, `./${normalizedPath}`, `../${normalizedPath}`, fileName].some(
    (token) => token.length > 0 && normalizedSource.includes(token)
  )
}

const preparePythonRuntimeFiles = (
  files: FileEntry[],
  selectedFileId: string,
  selectedFilePath: string,
  contentById: Record<string, string>,
  sourceCode: string
): Array<{ path: string; content: string }> => {
  const encoder = new TextEncoder()
  let totalBytes = 0

  const shouldIncludeRuntimeFile = (path: string, content: string, forceInclude = false) => {
    if (isBinaryPreviewFile(path)) {
      return false
    }

    if (content.startsWith("data:")) {
      return false
    }

    const fileBytes = encoder.encode(content).length
    const maxFileBytes = forceInclude ? MAX_RUNTIME_REFERENCED_FILE_BYTES : MAX_RUNTIME_FILE_BYTES
    if (fileBytes === 0 || fileBytes > maxFileBytes) {
      return false
    }

    if (totalBytes + fileBytes > MAX_RUNTIME_TOTAL_BYTES) {
      return false
    }

    totalBytes += fileBytes
    return true
  }

  const baseFiles = files
    .filter((file) => file.id !== selectedFileId)
    .map((file) => ({
      path: file.path,
      content: contentById[file.id] || "",
    }))
    .filter((file) => shouldIncludeRuntimeFile(file.path, file.content, isReferencedRuntimeFile(sourceCode, file.path)))

  const selectedTopFolder = selectedFilePath.split("/")[0]
  if (!selectedTopFolder || !selectedFilePath.includes("/")) {
    return baseFiles
  }

  const aliasFiles = baseFiles
    .filter((file) => file.path.startsWith(`${selectedTopFolder}/`))
    .map((file) => ({
      path: file.path.slice(selectedTopFolder.length + 1),
      content: file.content,
    }))
    .filter((file) => file.path.length > 0)

  const deduped = new Map<string, string>()
  for (const file of [...baseFiles, ...aliasFiles]) {
    if (!deduped.has(file.path)) {
      deduped.set(file.path, file.content)
    }
  }

  return Array.from(deduped.entries()).map(([path, content]) => ({ path, content }))
}

const buildAIWorkspaceSnapshot = (
  files: FileEntry[],
  contentById: Record<string, string>,
  maxChars = 16000
): string => {
  const sections: string[] = []
  let budget = maxChars

  for (const file of files) {
    if (budget <= 0) break
    const ext = extensionOf(file.path)
    if (!AI_SUPPORTED_EXTENSIONS.has(ext) || isBinaryPreviewFile(file.path)) {
      continue
    }

    const fileContent = contentById[file.id] || ""
    if (!fileContent.trim()) {
      continue
    }

    const sectionHeader = `\n\n// FILE: ${file.path}\n`
    const sectionBudget = Math.max(budget - sectionHeader.length, 0)
    const trimmedContent = fileContent.slice(0, sectionBudget)
    sections.push(`${sectionHeader}${trimmedContent}`)
    budget -= sectionHeader.length + trimmedContent.length
  }

  return sections.join("").trim()
}

const renderTree = (
  nodes: TreeNode[],
  selectedNodeId: string | null,
  expandedFolders: Set<string>,
  onToggleFolder: (id: string) => void,
  onSelectNode: (id: string) => void,
  depth = 0
): ReactElement[] => {
  return nodes.map((node) => {
    const isFolder = node.type === "folder"
    const isExpanded = isFolder && expandedFolders.has(node.id)
    const isSelected = selectedNodeId === node.id

    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => {
            if (isFolder) {
              onToggleFolder(node.id)
            }
            onSelectNode(node.id)
          }}
          className={cn(
            "flex h-7 w-full items-center gap-1.5 rounded px-1.5 text-left text-sm transition-colors",
            isSelected ? "bg-primary/15 text-primary" : "hover:bg-muted/60"
          )}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          {isFolder ? (
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded ? "rotate-90" : "")} />
          ) : (
            <span className="w-3.5" />
          )}
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500" />
            )
          ) : (
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </button>

        {isFolder && isExpanded && node.children && node.children.length > 0 ? (
          <div>{renderTree(node.children, selectedNodeId, expandedFolders, onToggleFolder, onSelectNode, depth + 1)}</div>
        ) : null}
      </div>
    )
  })
}

export default function IdePage() {
  const isMobile = useIsMobile()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const assignmentId = searchParams.get("assignmentId")
  const examId = searchParams.get("examId")
  const courseId = searchParams.get("courseId")
  const studentId = searchParams.get("studentId")
  const queryViewOnly = searchParams.get("viewOnly") === "true"
  const isExamTeacherReview = Boolean(examId && studentId)

  const [tree, setTree] = useState<TreeNode[]>(DEFAULT_TREE)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["folder-src"]))
  const [selectedNodeId, setSelectedNodeId] = useState<string>("file-main-py")
  const [fileContents, setFileContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENT)
  const [newNodeName, setNewNodeName] = useState("")
  const [newNodeType, setNewNodeType] = useState<NewNodeType | null>(null)
  const [selectedLanguageId, setSelectedLanguageId] = useState<ExecutionRequest["lang"]>("python3")
  const [stdin, setStdin] = useState("")
  const [stdinMode, setStdinMode] = useState<"manual" | "file">("manual")
  const [selectedStdinFileId, setSelectedStdinFileId] = useState<string | null>(null)
  const [terminalOutput, setTerminalOutput] = useState("Ready. Click Run to execute your code.\n")
  const [runStatus, setRunStatus] = useState("Idle")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false)
  const [assignmentViewOnly, setAssignmentViewOnly] = useState(false)
  const [assignmentTitle, setAssignmentTitle] = useState<string | null>(null)
  const [isTeacherReviewContext, setIsTeacherReviewContext] = useState(false)
  const [enableTeacherAI, setEnableTeacherAI] = useState(false)
  const [teacherAIReport, setTeacherAIReport] = useState<AIAnalysisReport | null>(null)
  const [teacherAIError, setTeacherAIError] = useState<string | null>(null)
  const [teacherAILoading, setTeacherAILoading] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [examSubmission, setExamSubmission] = useState<ExamSubmission | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showProctoringSetup, setShowProctoringSetup] = useState(false)
  const [proctoringReady, setProctoringReady] = useState(false)
  const [isFinishingExam, setIsFinishingExam] = useState(false)
  const terminalOutputRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const toastRef = useRef(toast)
  const loadedWorkspaceContextRef = useRef<string | null>(null)
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  const buildWorkspacePayload = useCallback((): AssignmentIdeWorkspace => {
    return {
      tree,
      fileContents,
      selectedNodeId,
      selectedLanguageId,
      stdin,
      stdinMode,
      selectedStdinFileId,
      expandedFolderIds: Array.from(expandedFolders),
    }
  }, [expandedFolders, fileContents, selectedLanguageId, selectedNodeId, selectedStdinFileId, stdin, stdinMode, tree])

  const handleFinishIdeExam = useCallback(async (autoSubmitted = false) => {
    if (!examId || isFinishingExam) {
      return
    }

    try {
      setIsFinishingExam(true)

      if (!autoSubmitted) {
        await assignmentService.updateExamSubmission(examId, {
          ideWorkspace: buildWorkspacePayload(),
        })
      }

      await assignmentService.finishExam(examId)

      toast({
        title: autoSubmitted ? "Time's Up" : "Exam Submitted",
        description: autoSubmitted
          ? "Your IDE exam was automatically submitted."
          : "Your IDE exam has been submitted successfully.",
      })

      if (courseId) {
        navigate(`/courses/${courseId}/exams/${examId}`)
      } else {
        navigate("/courses")
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error?.response?.data?.message || "Failed to submit IDE exam.",
        variant: "destructive",
      })
    } finally {
      setIsFinishingExam(false)
    }
  }, [buildWorkspacePayload, courseId, examId, isFinishingExam, navigate, toast])

  const {
    state: proctoringState,
    requestMediaAccess,
    enterFullscreen,
  } = useProctoring({
    examId: examId || "",
    enabled: Boolean(examId && !isExamTeacherReview),
    maxViolations: 3,
    onMaxViolationsReached: () => {
      void handleFinishIdeExam(true)
    },
  })

  const selectedNode = useMemo(() => findNodeById(tree, selectedNodeId), [tree, selectedNodeId])
  const selectedFileNode = selectedNode?.type === "file" ? selectedNode : null
  const selectedFileContent = selectedFileNode ? fileContents[selectedFileNode.id] || "" : ""
  const selectedFileExtension = selectedFileNode ? extensionOf(selectedFileNode.name) : ""
  const isBinaryPreviewSelected = selectedFileNode ? isBinaryPreviewFile(selectedFileNode.name) : false

  const selectedLanguage = useMemo(
    () => IDE_LANGUAGES.find((language) => language.id === selectedLanguageId) || IDE_LANGUAGES[0],
    [selectedLanguageId]
  )

  const editorLanguage = useMemo(() => {
    if (!selectedFileNode) {
      return selectedLanguage.monaco
    }

    return getEditorLanguage(selectedFileNode.name)
  }, [selectedFileNode, selectedLanguage.monaco])

  const allFiles = useMemo(() => collectFileEntries(tree), [tree])

  const selectedStdinFileContent = useMemo(() => {
    if (!selectedStdinFileId) {
      return ""
    }

    return fileContents[selectedStdinFileId] || ""
  }, [fileContents, selectedStdinFileId])

  const filePathById = useMemo(() => {
    return new Map(allFiles.map((file) => [file.id, file.path]))
  }, [allFiles])

  const selectedFolderId = useMemo(() => {
    if (!selectedNode) {
      return resolveDefaultFolderId(tree)
    }

    if (selectedNode.type === "folder") {
      return selectedNode.id
    }

    const parentFolderId = findParentFolderId(tree, selectedNode.id)
    if (parentFolderId !== undefined) {
      return parentFolderId
    }

    return resolveDefaultFolderId(tree)
  }, [selectedNode, tree])

  const appendTerminalLine = useCallback((line: string) => {
    setTerminalOutput((previous) => `${previous}${line}\n`)
  }, [])

  useEffect(() => {
    if (!terminalOutputRef.current) {
      return
    }

    terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
  }, [terminalOutput])

  const applyWorkspace = useCallback((workspace: AssignmentIdeWorkspace | null, fallbackToDefault = false) => {
    const resolvedTree = workspace?.tree && workspace.tree.length > 0 ? (workspace.tree as TreeNode[]) : DEFAULT_TREE
    const resolvedFileContents = workspace?.fileContents && Object.keys(workspace.fileContents).length > 0
      ? workspace.fileContents
      : DEFAULT_FILE_CONTENT

    const availableFiles = collectFileEntries(resolvedTree)
    const selectedNodeExists = workspace?.selectedNodeId ? findNodeById(resolvedTree, workspace.selectedNodeId) : null
    const fallbackSelectedNodeId = availableFiles[0]?.id || "file-main-py"

    setTree(resolvedTree)
    setFileContents(resolvedFileContents)
    setSelectedNodeId(selectedNodeExists ? workspace?.selectedNodeId || fallbackSelectedNodeId : fallbackSelectedNodeId)
    setStdin(workspace?.stdin || "")
    setStdinMode(workspace?.stdinMode === "file" ? "file" : "manual")
    setSelectedStdinFileId(workspace?.selectedStdinFileId || null)

    if (workspace?.selectedLanguageId && isExecutionLanguage(workspace.selectedLanguageId)) {
      setSelectedLanguageId(workspace.selectedLanguageId)
    }

    const expanded = workspace?.expandedFolderIds && workspace.expandedFolderIds.length > 0
      ? workspace.expandedFolderIds
      : [resolveDefaultFolderId(resolvedTree) || "folder-src"]
    setExpandedFolders(new Set(expanded))

    if (fallbackToDefault && availableFiles.length === 0) {
      setTree(DEFAULT_TREE)
      setFileContents(DEFAULT_FILE_CONTENT)
      setSelectedNodeId("file-main-py")
      setExpandedFolders(new Set(["folder-src"]))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const workspaceContextKey = [
      user?.id || "",
      assignmentId || "",
      examId || "",
      studentId || "",
      isExamTeacherReview ? "1" : "0",
      queryViewOnly ? "1" : "0",
    ].join("|")

    const loadWorkspace = async () => {
      if (authLoading) {
        return
      }

      if (loadedWorkspaceContextRef.current === workspaceContextKey) {
        return
      }

      if (!user?.id) {
        loadedWorkspaceContextRef.current = workspaceContextKey
        setIsWorkspaceReady(true)
        return
      }

      try {
        if (assignmentId) {
          const assignment = await assignmentService.getAssignmentById(assignmentId)
          if (cancelled) {
            return
          }

          setAssignmentTitle(assignment.title)
          const isTeacher = user.id === assignment.classroom?.teacher?.id
          setIsTeacherReviewContext(Boolean(isTeacher && studentId))

          if (isTeacher && studentId) {
            const studentSubmission = await assignmentService.getStudentSubmission(assignmentId, studentId)
            if (cancelled) {
              return
            }

            applyWorkspace((studentSubmission?.ideWorkspace as AssignmentIdeWorkspace | null) || null, true)
            setAssignmentSubmitted(!!studentSubmission)
            setAssignmentViewOnly(true)
            setIsWorkspaceReady(true)
            return
          }

          const mySubmission = await assignmentService.getMySubmission(assignmentId)
          if (cancelled) {
            return
          }

          if (mySubmission?.ideWorkspace) {
            applyWorkspace(mySubmission.ideWorkspace as AssignmentIdeWorkspace)
            setAssignmentSubmitted(true)
            setAssignmentViewOnly(true)
            setIsWorkspaceReady(true)
            return
          }

          const ideDraft = await assignmentService.getAssignmentIdeDraft(assignmentId)
          if (cancelled) {
            return
          }

          if (ideDraft?.workspace) {
            applyWorkspace(ideDraft.workspace as AssignmentIdeWorkspace)
          } else {
            applyWorkspace(createWorkspaceFromIdeFiles(assignment.ideFiles || []), true)
          }

          setAssignmentSubmitted(false)
          setAssignmentViewOnly(queryViewOnly || isTeacher)
          setIsWorkspaceReady(true)
          return
        }

        if (examId) {
          const [examData, submissionData] = await Promise.all([
            assignmentService.getExamById(examId),
            isExamTeacherReview
              ? assignmentService.getExamSubmissions(examId).then((items) => items.find((item) => item.studentId === studentId) || null)
              : assignmentService.getMyExamSubmission(examId),
          ])

          if (cancelled) {
            return
          }

          if (!submissionData) {
            toastRef.current({
              title: isExamTeacherReview ? "Submission Not Found" : "Exam Not Started",
              description: isExamTeacherReview
                ? "No submission was found for this student."
                : "Start the exam before opening the IDE.",
              variant: "destructive",
            })
            if (courseId) {
              navigate(isExamTeacherReview ? `/courses/${courseId}/exams/${examId}/submissions` : `/courses/${courseId}/exams/${examId}`)
            }
            return
          }

          if (submissionData.finishedAt && !isExamTeacherReview) {
            toastRef.current({
              title: "Exam Completed",
              description: "You have already finished this exam.",
            })
            if (courseId) {
              navigate(`/courses/${courseId}/exams/${examId}`)
            }
            return
          }

          setExam(examData)
          setExamSubmission(submissionData)
          setAssignmentTitle(examData.title)
          setIsTeacherReviewContext(false)
          setEnableTeacherAI(false)
          setTeacherAIReport(null)
          setTeacherAIError(null)
          setAssignmentSubmitted(false)
          setAssignmentViewOnly(isExamTeacherReview || queryViewOnly)

          const submissionWorkspace = submissionData.ideWorkspace as AssignmentIdeWorkspace | null
          const hasSubmissionWorkspaceTree =
            !!submissionWorkspace &&
            Array.isArray(submissionWorkspace.tree) &&
            submissionWorkspace.tree.length > 0
          const hasSubmissionWorkspaceContents =
            !!submissionWorkspace &&
            !!submissionWorkspace.fileContents &&
            Object.keys(submissionWorkspace.fileContents).length > 0

          // For IDE exams, prefer a populated submission workspace; otherwise
          // bootstrap from teacher-provided exam files instead of default template.
          if (hasSubmissionWorkspaceTree && hasSubmissionWorkspaceContents) {
            applyWorkspace(submissionWorkspace, false)
          } else {
            applyWorkspace(createWorkspaceFromIdeFiles(examData.ideFiles || []), false)
          }

          setIsWorkspaceReady(true)
          loadedWorkspaceContextRef.current = workspaceContextKey
          return
        }

        setIsTeacherReviewContext(false)
        setEnableTeacherAI(false)
        setTeacherAIReport(null)
        setTeacherAIError(null)
        setExam(null)
        setExamSubmission(null)
        setTimeRemaining(0)
        setShowProctoringSetup(false)
        setProctoringReady(false)

        const response = await getIdeWorkspace(user.id)
        if (cancelled || !response.workspace) {
          setIsWorkspaceReady(true)
          return
        }

        const workspace = response.workspace
        const resolvedTree = Array.isArray(workspace.tree) && workspace.tree.length > 0 ? workspace.tree : DEFAULT_TREE
        const resolvedFileContents =
          workspace.fileContents && Object.keys(workspace.fileContents).length > 0 ? workspace.fileContents : DEFAULT_FILE_CONTENT

        const availableFiles = collectFileEntries(resolvedTree)
        const selectedNodeExists = workspace.selectedNodeId ? findNodeById(resolvedTree, workspace.selectedNodeId) : null
        const fallbackSelectedNodeId = availableFiles[0]?.id || "file-main-py"

        setTree(resolvedTree)
        setFileContents(resolvedFileContents)
        setSelectedNodeId(selectedNodeExists ? workspace.selectedNodeId || fallbackSelectedNodeId : fallbackSelectedNodeId)
        setStdin(workspace.stdin || "")
        setStdinMode(workspace.stdinMode === "file" ? "file" : "manual")
        setSelectedStdinFileId(workspace.selectedStdinFileId || null)

        if (workspace.selectedLanguageId && isExecutionLanguage(workspace.selectedLanguageId)) {
          setSelectedLanguageId(workspace.selectedLanguageId)
        }

        setExpandedFolders(new Set(workspace.expandedFolderIds && workspace.expandedFolderIds.length > 0 ? workspace.expandedFolderIds : ["folder-src"]))
        loadedWorkspaceContextRef.current = workspaceContextKey
      } catch (error) {
        console.error("Failed to load IDE workspace", error)
      } finally {
        if (!cancelled) {
          setIsWorkspaceReady(true)
        }
      }
    }

    loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [applyWorkspace, authLoading, assignmentId, courseId, examId, isExamTeacherReview, navigate, studentId, user?.id, queryViewOnly])

  const generateTeacherIdeAIReport = useCallback(async () => {
    if (!isTeacherReviewContext) {
      return
    }

    const snapshot = buildAIWorkspaceSnapshot(allFiles, fileContents)
    if (!snapshot.trim()) {
      setTeacherAIError("No analyzable code files were found in this IDE workspace.")
      setTeacherAIReport(null)
      return
    }

    try {
      setTeacherAILoading(true)
      setTeacherAIError(null)

      const report = await generateCustomAIAnalysis({
        code: snapshot,
        language: LANGUAGE_TO_AI_LABEL[selectedLanguageId] || "plaintext",
        status: "SUBMITTED",
        executionTimeMs: 0,
        memoryKb: 0,
        problemTitle: assignmentTitle || "IDE Assignment",
        difficulty: "CLASSROOM",
      })

      setTeacherAIReport(report)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate AI report"
      setTeacherAIError(message)
      setTeacherAIReport(null)
    } finally {
      setTeacherAILoading(false)
    }
  }, [allFiles, assignmentTitle, fileContents, isTeacherReviewContext, selectedLanguageId])

  useEffect(() => {
    if (!enableTeacherAI) {
      setTeacherAIReport(null)
      setTeacherAIError(null)
      setTeacherAILoading(false)
      return
    }

    if (!isTeacherReviewContext || !isWorkspaceReady) {
      return
    }

    generateTeacherIdeAIReport()
  }, [enableTeacherAI, generateTeacherIdeAIReport, isTeacherReviewContext, isWorkspaceReady])

  useEffect(() => {
    if (!isWorkspaceReady || !user?.id || assignmentViewOnly) {
      return
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const workspaceToSave = {
          tree,
          fileContents,
          selectedNodeId,
          selectedLanguageId,
          stdin,
          stdinMode,
          selectedStdinFileId,
          expandedFolderIds: Array.from(expandedFolders),
        }

        if (examId) {
          await assignmentService.updateExamSubmission(examId, {
            ideWorkspace: workspaceToSave,
          })
        } else if (assignmentId) {
          await assignmentService.saveAssignmentIdeDraft(assignmentId, workspaceToSave)
        } else {
          await saveIdeWorkspace(user.id, workspaceToSave)
        }
      } catch (error) {
        console.error("Failed to save IDE workspace", error)
      }
    }, 800)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [
    expandedFolders,
    fileContents,
    isWorkspaceReady,
    selectedLanguageId,
    selectedNodeId,
    selectedStdinFileId,
    stdin,
    stdinMode,
    tree,
    user?.id,
    examId,
    assignmentId,
    assignmentViewOnly,
  ])

  useEffect(() => {
    if (!exam || !examSubmission || examSubmission.finishedAt || isExamTeacherReview) {
      return
    }

    const interval = window.setInterval(() => {
      const endTime = new Date(new Date(examSubmission.startedAt).getTime() + exam.duration * 60000)
      const remaining = Math.max(0, endTime.getTime() - Date.now())
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        void handleFinishIdeExam(true)
      }
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [exam, examSubmission, handleFinishIdeExam, isExamTeacherReview])

  useEffect(() => {
    if (!examId || !isWorkspaceReady || !examSubmission || examSubmission.finishedAt || proctoringReady || isExamTeacherReview) {
      return
    }

    setShowProctoringSetup(true)
  }, [examId, examSubmission, isExamTeacherReview, isWorkspaceReady, proctoringReady])

  useEffect(() => {
    if (videoRef.current && proctoringState.mediaStream) {
      videoRef.current.srcObject = proctoringState.mediaStream
    }
  }, [proctoringState.mediaStream])

  const handleProctoringSetup = useCallback(async () => {
    const mediaGranted = await requestMediaAccess()
    if (!mediaGranted) {
      return
    }

    const fullscreenGranted = await enterFullscreen()
    if (!fullscreenGranted) {
      return
    }

    setProctoringReady(true)
    setShowProctoringSetup(false)
  }, [enterFullscreen, requestMediaAccess])

  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const getTimeColor = useCallback((): string => {
    const minutesLeft = timeRemaining / 60000
    if (minutesLeft <= 5) return "text-red-600"
    if (minutesLeft <= 15) return "text-amber-600"
    return "text-green-600"
  }, [timeRemaining])

  useEffect(() => {
    if (stdinMode !== "file") {
      return
    }

    if (selectedStdinFileId && allFiles.some((file) => file.id === selectedStdinFileId)) {
      return
    }

    const fallbackFile = allFiles.find((file) => file.id !== selectedFileNode?.id) || allFiles[0]
    setSelectedStdinFileId(fallbackFile?.id || null)
  }, [allFiles, selectedFileNode?.id, selectedStdinFileId, stdinMode])

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((previous) => {
      const updated = new Set(previous)
      if (updated.has(folderId)) {
        updated.delete(folderId)
      } else {
        updated.add(folderId)
      }
      return updated
    })
  }, [])

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId)
      const node = findNodeById(tree, nodeId)
      if (node?.type === "file") {
        const resolvedLanguage = resolveLanguageByFileName(node.name)
        if (resolvedLanguage) {
          setSelectedLanguageId(resolvedLanguage.id)
        }
      }
    },
    [tree]
  )

  const handleCreateNode = useCallback(() => {
    if (!newNodeType) {
      return
    }

    const trimmedName = newNodeName.trim()
    if (!trimmedName) {
      return
    }

    const parentId = selectedFolderId
    const newId = generateNodeId(newNodeType)

    const newNode: TreeNode = {
      id: newId,
      name: trimmedName,
      type: newNodeType,
      children: newNodeType === "folder" ? [] : undefined,
    }

    if (parentId) {
      setTree((previous) => updateNodeChildren(previous, parentId, (children) => [...children, newNode]))
      setExpandedFolders((previous) => new Set(previous).add(parentId))
    } else {
      setTree((previous) => [...previous, newNode])
    }
    setSelectedNodeId(newId)
    setNewNodeName("")
    setNewNodeType(null)

    if (newNodeType === "file") {
      const detectedLanguage = resolveLanguageByFileName(trimmedName)
      if (detectedLanguage) {
        setSelectedLanguageId(detectedLanguage.id)
      }
      setFileContents((previous) => ({
        ...previous,
        [newId]: "",
      }))
    }
  }, [newNodeName, selectedFolderId, newNodeType])

  const handleStartCreate = useCallback((type: NewNodeType) => {
    setNewNodeType(type)
    setNewNodeName(type === "file" ? "new-file.py" : "new-folder")
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId || selectedNodeId === "folder-src") {
      return
    }

    const currentNode = findNodeById(tree, selectedNodeId)
    if (!currentNode) {
      return
    }

    setTree((previous) => removeNodeById(previous, selectedNodeId))
    setSelectedNodeId("file-main-py")

    if (currentNode.type === "file") {
      setFileContents((previous) => {
        const updated = { ...previous }
        delete updated[selectedNodeId]
        return updated
      })
    }
  }, [selectedNodeId, tree])

  const handleUploadFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) {
        return
      }

      const parentId = selectedFolderId
      const createdNodes: TreeNode[] = []
      const createdContents: Record<string, string> = {}

      for (const file of files) {
        const newId = `file-upload-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
        let content = ""

        try {
          content = await readBrowserFileAsText(file)
        } catch {
          content = ""
        }

        createdNodes.push({
          id: newId,
          name: file.name,
          type: "file",
        })
        createdContents[newId] = content
      }

      if (parentId) {
        setTree((previous) => updateNodeChildren(previous, parentId, (children) => [...children, ...createdNodes]))
        setExpandedFolders((previous) => new Set(previous).add(parentId))
      } else {
        setTree((previous) => [...previous, ...createdNodes])
      }
      setFileContents((previous) => ({
        ...previous,
        ...createdContents,
      }))

      const firstFile = createdNodes[0]
      if (firstFile) {
        setSelectedNodeId(firstFile.id)
        const resolvedLanguage = resolveLanguageByFileName(firstFile.name)
        if (resolvedLanguage) {
          setSelectedLanguageId(resolvedLanguage.id)
        }
      }

      if (stdinMode === "file" && !selectedStdinFileId && firstFile) {
        setSelectedStdinFileId(firstFile.id)
      }

      event.target.value = ""
    },
    [selectedFolderId, selectedStdinFileId, stdinMode]
  )

  const handleSubmitIdeAssignment = useCallback(async () => {
    if (!assignmentId || assignmentViewOnly || assignmentSubmitted) {
      return
    }

    try {
      setIsSubmittingAssignment(true)
      const workspacePayload: AssignmentIdeWorkspace = {
        tree,
        fileContents,
        selectedNodeId,
        selectedLanguageId,
        stdin,
        stdinMode,
        selectedStdinFileId,
        expandedFolderIds: Array.from(expandedFolders),
      }

      await assignmentService.submitIdeAssignment(assignmentId, workspacePayload)
      setAssignmentSubmitted(true)
      setAssignmentViewOnly(true)
      toast({
        title: "Assignment Submitted",
        description: "Your IDE workspace has been submitted successfully.",
      })
    } catch (error) {
      console.error("Failed to submit IDE assignment", error)
      toast({
        title: "Submission Failed",
        description: "Could not submit IDE assignment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingAssignment(false)
    }
  }, [
    assignmentId,
    assignmentSubmitted,
    assignmentViewOnly,
    expandedFolders,
    fileContents,
    selectedLanguageId,
    selectedNodeId,
    selectedStdinFileId,
    stdin,
    stdinMode,
    toast,
    tree,
  ])

  const handleBackFromAssignmentIde = useCallback(() => {
    if (!courseId || !assignmentId) {
      return
    }

    // Teacher review context should return to assignment details.
    if (studentId || queryViewOnly) {
      navigate(`/courses/${courseId}/assignments/${assignmentId}`)
      return
    }

    // Student IDE assignment context should return to the course page.
    navigate(`/courses/${courseId}`)
  }, [assignmentId, courseId, navigate, queryViewOnly, studentId])

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!selectedFileNode) {
        return
      }

      setFileContents((previous) => ({
        ...previous,
        [selectedFileNode.id]: value || "",
      }))
    },
    [selectedFileNode]
  )

  const handleRunCode = useCallback(async () => {
    if (!selectedFileNode) {
      appendTerminalLine("No file selected for execution.")
      return
    }

    const userSource = fileContents[selectedFileNode.id] || ""
    if (!userSource.trim()) {
      appendTerminalLine("Cannot run empty source code.")
      return
    }

    const executionStdin = stdinMode === "file" ? selectedStdinFileContent : stdin
    const selectedFilePath = filePathById.get(selectedFileNode.id) || selectedFileNode.name

    let sourceToExecute = userSource
    let pythonRuntimeFileCount = 0
    let runtimeFiles: ExecutionArtifact[] = []
    if (selectedLanguageId === "python3") {
      const preparedRuntimeFiles = preparePythonRuntimeFiles(allFiles, selectedFileNode.id, selectedFilePath, fileContents, userSource)
      pythonRuntimeFileCount = preparedRuntimeFiles.length
      runtimeFiles = preparedRuntimeFiles.map((file) => ({
        path: file.path,
        content: file.content,
        encoding: "utf8",
      }))
      sourceToExecute = buildPythonRuntimeSource(userSource)
    }

    try {
      setIsRunning(true)
      setRunStatus("Submitting")
      appendTerminalLine(`$ run ${selectedFileNode.name} [${selectedLanguage.label}]`)
      appendTerminalLine(`stdin source: ${stdinMode === "file" ? "file" : "manual"}`)
      if (selectedLanguageId === "python3") {
        appendTerminalLine(`runtime files mounted: ${pythonRuntimeFileCount}`)
      }

      const resultUrl = await submitExecution({
        src: sourceToExecute,
        stdin: executionStdin,
        lang: selectedLanguageId,
        timeout: 120,
        runtimeFiles,
      })

      setRunStatus("Running")

      const result = await waitForExecutionResult(resultUrl)
      setRunStatus(result.status || "Finished")

      if (result.artifacts && result.artifacts.length > 0) {
        const normalizedArtifacts = result.artifacts
          .map((artifact) => ({
            ...artifact,
            path: artifact.path.replace(/^\.\//, "").trim(),
          }))
          .filter((artifact) => artifact.path.length > 0)

        if (normalizedArtifacts.length > 0) {
          let nextTree = tree
          for (const artifact of normalizedArtifacts) {
            nextTree = upsertTreeFileByPath(nextTree, artifact.path)
          }

          const entries = collectFileEntries(nextTree)
          const pathToId = new Map(entries.map((entry) => [entry.path, entry.id]))

          setTree(nextTree)
          setFileContents((previous) => {
            const next = { ...previous }
            for (const artifact of normalizedArtifacts) {
              const fileId = pathToId.get(artifact.path)
              if (!fileId) continue
              next[fileId] = artifactToStoredContent(artifact)
            }
            return next
          })

          setExpandedFolders((previous) => {
            const next = new Set(previous)

            for (const artifact of normalizedArtifacts) {
              const segments = artifact.path.split("/").filter(Boolean)
              if (segments.length <= 1) continue

              let currentFolder = ""
              for (const segment of segments.slice(0, -1)) {
                currentFolder = currentFolder ? `${currentFolder}/${segment}` : segment
                const folderId = findFolderIdByPath(nextTree, currentFolder)
                if (folderId) {
                  next.add(folderId)
                }
              }
            }

            return next
          })

          appendTerminalLine(`generated files: ${normalizedArtifacts.length}`)
        }
      }

      if (result.output) {
        appendTerminalLine(result.output.trimEnd())
      }
      if (result.stderr) {
        appendTerminalLine(`stderr: ${result.stderr.trimEnd()}`)
      }
      appendTerminalLine("--------------------------------")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed"
      setRunStatus("Failed")
      appendTerminalLine(`Error: ${message}`)
    } finally {
      setIsRunning(false)
    }
  }, [
    allFiles,
    appendTerminalLine,
    fileContents,
    filePathById,
    selectedFileNode,
    selectedLanguage.label,
    selectedLanguageId,
    selectedStdinFileContent,
    stdin,
    stdinMode,
    tree,
  ])

  if (!isWorkspaceReady) {
    return (
      <BaseLayout>
        <div className="mx-4 flex h-[calc(100dvh-var(--header-height)-7rem)] items-center justify-center text-sm text-muted-foreground">
          Loading your IDE workspace...
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="mx-4 h-[calc(100dvh-var(--header-height)-7rem)] min-h-[650px] px-0">
        {examId && exam ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">IDE Exam</Badge>
                <Badge variant="secondary">{isExamTeacherReview ? "Teacher Review" : "Proctored"}</Badge>
                {proctoringState.violationCount > 0 ? (
                  <Badge variant="destructive">
                    {proctoringState.violationCount} Warning{proctoringState.violationCount !== 1 ? "s" : ""}
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">{exam.title}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isExamTeacherReview ? (
                <>
                  <Badge variant={proctoringState.cameraEnabled ? "default" : "destructive"} className="gap-1">
                    <Camera className="h-3 w-3" />
                    {proctoringState.cameraEnabled ? "Cam On" : "Cam Off"}
                  </Badge>
                  <Badge variant={proctoringState.microphoneEnabled ? "default" : "destructive"} className="gap-1">
                    <Mic className="h-3 w-3" />
                    {proctoringState.microphoneEnabled ? "Mic On" : "Mic Off"}
                  </Badge>
                  <Badge variant={proctoringState.isFullscreen ? "default" : "destructive"} className="gap-1">
                    <Maximize className="h-3 w-3" />
                    {proctoringState.isFullscreen ? "Fullscreen" : "Exit FS"}
                  </Badge>
                </>
              ) : null}

              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
                <Clock className={cn("h-4 w-4", getTimeColor())} />
                <span className={cn("text-sm font-mono font-semibold", getTimeColor())}>{formatTime(timeRemaining)}</span>
              </div>

              {courseId ? (
                <Button variant="outline" size="sm" onClick={() => navigate(isExamTeacherReview ? `/courses/${courseId}/exams/${examId}/submissions` : `/courses/${courseId}/exams/${examId}`)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : null}

              {!isExamTeacherReview ? (
                <Button size="sm" onClick={() => void handleFinishIdeExam(false)} disabled={isFinishingExam}>
                  {isFinishingExam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Finish Exam
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {assignmentId ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">IDE Assignment</Badge>
                {assignmentViewOnly ? <Badge variant="secondary">View Only</Badge> : <Badge variant="default">Editable</Badge>}
                {assignmentSubmitted ? <Badge variant="default">Submitted</Badge> : null}
              </div>
              {assignmentTitle ? <p className="truncate text-sm text-muted-foreground">{assignmentTitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {courseId ? (
                <Button variant="outline" size="sm" onClick={handleBackFromAssignmentIde}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : null}
              {!assignmentViewOnly && !assignmentSubmitted ? (
                <Button size="sm" onClick={handleSubmitIdeAssignment} disabled={isSubmittingAssignment}>
                  {isSubmittingAssignment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Assignment
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="h-full w-full overflow-auto rounded-none border-y bg-card/60 backdrop-blur-sm lg:rounded-xl lg:border">
          <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full min-h-0">
            <Panel defaultSize={22} minSize={15}>
              <div className="flex h-full min-h-0 flex-col border-r bg-muted/20">
                <div className="border-b p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Explorer</h3>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartCreate("file")}
                        disabled={assignmentViewOnly}
                      >
                        <FilePlus2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartCreate("folder")}
                        disabled={assignmentViewOnly}
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleDeleteSelected} disabled={assignmentViewOnly}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={assignmentViewOnly}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".txt,.csv,.json,.md,.py,.java,.c,.cpp,.js,.ts,.png,.jpg,.jpeg,.pdf"
                    onChange={handleUploadFiles}
                  />

                  {newNodeType ? (
                    <div className="flex items-center gap-1.5 rounded-md border bg-background p-1.5">
                      {newNodeType === "file" ? (
                        <FileCode2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Folder className="h-4 w-4 text-yellow-500" />
                      )}
                      <Input
                        value={newNodeName}
                        onChange={(event) => setNewNodeName(event.target.value)}
                        className="h-7 border-none px-1 text-sm shadow-none focus-visible:ring-0"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleCreateNode()
                          }
                          if (event.key === "Escape") {
                            setNewNodeType(null)
                            setNewNodeName("")
                          }
                        }}
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreateNode}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setNewNodeType(null)
                          setNewNodeName("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <ScrollArea className="h-full min-h-0">
                  <div className="p-2">
                    {renderTree(tree, selectedNodeId, expandedFolders, handleToggleFolder, handleSelectNode)}
                  </div>
                </ScrollArea>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-border/60 hover:bg-primary/60" />

            <Panel defaultSize={78} minSize={30}>
              <PanelGroup direction="vertical" className="h-full min-h-0">
                <Panel defaultSize={72} minSize={35}>
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {selectedFileNode ? selectedFileNode.name : "Select a file"}
                        </span>
                        {selectedFileNode ? <Badge variant="outline">editable</Badge> : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {isTeacherReviewContext ? (
                          <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                            <Switch
                              id="teacher-ide-ai-toggle"
                              checked={enableTeacherAI}
                              onCheckedChange={setEnableTeacherAI}
                            />
                            <Label htmlFor="teacher-ide-ai-toggle" className="text-xs text-muted-foreground">
                              AI Report
                            </Label>
                          </div>
                        ) : null}
                        <Select value={selectedLanguageId} onValueChange={(value) => setSelectedLanguageId(value as ExecutionRequest["lang"])}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent>
                            {IDE_LANGUAGES.map((language) => (
                              <SelectItem key={language.id} value={language.id}>
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={handleRunCode} disabled={isRunning || !selectedFileNode}>
                          {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                          Run
                        </Button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                      {selectedFileNode ? (
                        isBinaryPreviewSelected ? (
                          <div className="flex h-full items-center justify-center bg-black/70 p-3">
                            {selectedFileExtension === "pdf" ? (
                              <iframe title={selectedFileNode.name} src={selectedFileContent} className="h-full w-full rounded border bg-white" />
                            ) : (
                              <img src={selectedFileContent} alt={selectedFileNode.name} className="max-h-full max-w-full rounded border bg-white" />
                            )}
                          </div>
                        ) : (
                          <Editor
                            height="100%"
                            language={editorLanguage}
                            value={selectedFileContent}
                            onChange={handleCodeChange}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: !isMobile },
                              fontSize: 14,
                              automaticLayout: true,
                              lineNumbers: "on",
                              tabSize: 2,
                              wordWrap: "on",
                              readOnly: assignmentViewOnly,
                              scrollBeyondLastLine: false,
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              lineHeight: 1.5,
                            }}
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Select or create a file to start coding.
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 bg-border/60 hover:bg-primary/60" />

                <Panel defaultSize={28} minSize={20}>
                  <div className="flex h-full min-h-0 flex-col border-t bg-black text-green-400">
                    <div className="flex items-center justify-between border-b border-green-700/50 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 uppercase tracking-wide">
                        <TerminalSquare className="h-4 w-4" />
                        Terminal
                      </div>
                      <div className="text-[11px] text-green-300/90">{runStatus}</div>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-3 md:grid-cols-[1fr_280px]">
                      <div
                        ref={terminalOutputRef}
                        className="h-full min-h-[180px] overflow-y-auto rounded-md border border-green-800/70 bg-black p-3"
                      >
                        <pre className="whitespace-pre-wrap text-xs leading-5 text-green-300">{terminalOutput}</pre>
                      </div>

                      <div className="flex min-h-0 flex-col gap-2">
                        <label className="text-xs uppercase tracking-wide text-green-300">stdin</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={stdinMode} onValueChange={(value) => setStdinMode(value as "manual" | "file")}>
                            <SelectTrigger className="h-8 border-green-800/70 bg-black text-xs text-green-300">
                              <SelectValue placeholder="stdin source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual input</SelectItem>
                              <SelectItem value="file">Uploaded file</SelectItem>
                            </SelectContent>
                          </Select>

                          {stdinMode === "file" ? (
                            <Select value={selectedStdinFileId || ""} onValueChange={(value) => setSelectedStdinFileId(value)}>
                              <SelectTrigger className="h-8 border-green-800/70 bg-black text-xs text-green-300">
                                <SelectValue placeholder="Select stdin file" />
                              </SelectTrigger>
                              <SelectContent>
                                {allFiles.length > 0 ? (
                                  allFiles.map((file) => (
                                    <SelectItem key={file.id} value={file.id}>
                                      {file.path}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-files" disabled>
                                    No files uploaded
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : null}
                        </div>
                        <Textarea
                          value={stdinMode === "manual" ? stdin : selectedStdinFileContent}
                          onChange={stdinMode === "manual" ? (event) => setStdin(event.target.value) : undefined}
                          readOnly={stdinMode === "file"}
                          placeholder={stdinMode === "manual" ? "Type stdin values here..." : "Select an uploaded file to use as stdin"}
                          className="h-full min-h-[120px] resize-none border-green-800/70 bg-black text-xs leading-5 text-green-300 placeholder:text-green-700"
                        />

                        {isTeacherReviewContext && enableTeacherAI ? (
                          <div className="rounded-md border border-blue-600/40 bg-blue-950/20 p-3 text-blue-100">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-blue-300" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">AI IDE Report</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 border-blue-500/50 bg-transparent px-2 text-[11px] text-blue-100 hover:bg-blue-900/50"
                                onClick={generateTeacherIdeAIReport}
                                disabled={teacherAILoading}
                              >
                                <RefreshCw className={cn("mr-1.5 h-3 w-3", teacherAILoading && "animate-spin")} />
                                Refresh
                              </Button>
                            </div>

                            {teacherAILoading ? (
                              <p className="text-xs text-blue-200">Generating report from the submitted workspace...</p>
                            ) : null}

                            {teacherAIError ? (
                              <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-950/40 p-2 text-xs text-red-200">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{teacherAIError}</span>
                              </div>
                            ) : null}

                            {teacherAIReport ? (
                              <div className="max-h-56 space-y-2 overflow-y-auto pr-1 text-xs text-blue-100">
                                <p className="font-medium text-blue-50">{teacherAIReport.summary || "AI analysis generated."}</p>
                                <p><strong>Time:</strong> {teacherAIReport.timeComplexity}</p>
                                <p><strong>Space:</strong> {teacherAIReport.spaceComplexity}</p>

                                {teacherAIReport.possibleOptimizations?.length > 0 ? (
                                  <div>
                                    <p className="mb-1 font-semibold text-blue-200">Optimizations</p>
                                    <ul className="list-disc space-y-0.5 pl-4">
                                      {teacherAIReport.possibleOptimizations.slice(0, 4).map((item, index) => (
                                        <li key={`opt-${index}`}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}

                                {teacherAIReport.edgeCasesAndBugs?.length > 0 ? (
                                  <div>
                                    <p className="mb-1 font-semibold text-blue-200">Potential Issues</p>
                                    <ul className="list-disc space-y-0.5 pl-4">
                                      {teacherAIReport.edgeCasesAndBugs.slice(0, 4).map((item, index) => (
                                        <li key={`bug-${index}`}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          className="border-green-700 bg-black text-green-300 hover:bg-green-950"
                          onClick={() => setTerminalOutput("Ready. Click Run to execute your code.\n")}
                        >
                          Clear Terminal
                        </Button>
                      </div>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <AlertDialog open={showProctoringSetup} onOpenChange={setShowProctoringSetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proctoring Setup Required</AlertDialogTitle>
            <AlertDialogDescription>
              This exam requires proctoring. Enable camera, microphone, and fullscreen to continue.
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Camera Access</div>
                    <div className="text-xs text-muted-foreground">Required throughout the exam.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mic className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Microphone Access</div>
                    <div className="text-xs text-muted-foreground">Required throughout the exam.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Maximize className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Fullscreen Mode</div>
                    <div className="text-xs text-muted-foreground">Exiting fullscreen triggers a warning.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
                  <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-900 dark:text-yellow-100">Anti-Cheating Measures</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      Tab switch and fullscreen exits are tracked. At 3 warnings, the exam is auto-submitted.
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => courseId && examId ? navigate(`/courses/${courseId}/exams/${examId}`) : navigate('/courses')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleProctoringSetup()}>
              Enable Proctoring
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {proctoringState.mediaStream && !isExamTeacherReview ? (
        <div className="fixed bottom-4 right-4 z-50 overflow-hidden rounded-lg border-2 border-primary shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="h-32 w-40 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-center text-xs text-white">
            Camera Active
          </div>
        </div>
      ) : null}
    </BaseLayout>
  )
}