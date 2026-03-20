import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from "react"
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
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import { submitExecution, waitForExecutionResult, type ExecutionArtifact, type ExecutionRequest } from "@/api/services/execution-engine"
import { getIdeWorkspace, saveIdeWorkspace } from "@/api/services/ide-workspace"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"

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

const buildPythonRuntimeSource = (
  sourceCode: string,
  selectedFilePath: string,
  runtimeFiles: Array<{ path: string; content: string }>
): string => {
  const filesJson = JSON.stringify(runtimeFiles)
  const selectedPathJson = JSON.stringify(selectedFilePath)

  return [
    "from pathlib import Path as _Path",
    `__codexa_files = ${filesJson}`,
    "for _f in __codexa_files:",
    "    _p = _Path(_f['path'])",
    "    _p.parent.mkdir(parents=True, exist_ok=True)",
    "    _p.write_text(_f['content'], encoding='utf-8')",
    `__codexa_main = _Path(${selectedPathJson})`,
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

const preparePythonRuntimeFiles = (
  files: FileEntry[],
  selectedFileId: string,
  selectedFilePath: string,
  contentById: Record<string, string>
): Array<{ path: string; content: string }> => {
  const baseFiles = files
    .filter((file) => file.id !== selectedFileId)
    .map((file) => ({
      path: file.path,
      content: contentById[file.id] || "",
    }))

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
  const terminalOutputRef = useRef<HTMLDivElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false)

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
      return null
    }

    if (selectedNode.type === "folder") {
      return selectedNode.id
    }

    return "folder-src"
  }, [selectedNode])

  const appendTerminalLine = useCallback((line: string) => {
    setTerminalOutput((previous) => `${previous}${line}\n`)
  }, [])

  useEffect(() => {
    if (!terminalOutputRef.current) {
      return
    }

    terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
  }, [terminalOutput])

  useEffect(() => {
    let cancelled = false

    const loadWorkspace = async () => {
      if (authLoading) {
        return
      }

      if (!user?.id) {
        setIsWorkspaceReady(true)
        return
      }

      try {
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
  }, [authLoading, user?.id])

  useEffect(() => {
    if (!isWorkspaceReady || !user?.id) {
      return
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveIdeWorkspace(user.id, {
          tree,
          fileContents,
          selectedNodeId,
          selectedLanguageId,
          stdin,
          stdinMode,
          selectedStdinFileId,
          expandedFolderIds: Array.from(expandedFolders),
        })
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
  ])

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

    const parentId = selectedFolderId || "folder-src"
    const newId = `${newNodeType}-${Date.now()}`

    const newNode: TreeNode = {
      id: newId,
      name: trimmedName,
      type: newNodeType,
      children: newNodeType === "folder" ? [] : undefined,
    }

    setTree((previous) => updateNodeChildren(previous, parentId, (children) => [...children, newNode]))
    setExpandedFolders((previous) => new Set(previous).add(parentId))
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

      const parentId = selectedFolderId || "folder-src"
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

      setTree((previous) => updateNodeChildren(previous, parentId, (children) => [...children, ...createdNodes]))
      setExpandedFolders((previous) => new Set(previous).add(parentId))
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
    if (selectedLanguageId === "python3") {
      const runtimeFiles = preparePythonRuntimeFiles(allFiles, selectedFileNode.id, selectedFilePath, fileContents)
      pythonRuntimeFileCount = runtimeFiles.length

      sourceToExecute = buildPythonRuntimeSource(userSource, selectedFilePath, runtimeFiles)
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
        timeout: 15,
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
                      >
                        <FilePlus2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartCreate("folder")}
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleDeleteSelected}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => uploadInputRef.current?.click()}
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
    </BaseLayout>
  )
}