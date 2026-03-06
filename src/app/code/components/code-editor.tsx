"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Editor from "@monaco-editor/react"
import { useTheme } from "@/hooks/use-theme"
import {
  RotateCcw,
  Copy,
  Check,
} from "lucide-react"
import { type Problem } from "@/api/services/problem"

interface CodeEditorProps {
  problem: Problem | null
  loading?: boolean
  onCodeChange?: (code: string, languageId: number) => void
  initialCode?: string
  initialLanguage?: string
  readOnly?: boolean
}

// Language ID mapping for Judge0
const LANGUAGES = [
  { value: "javascript", label: "JavaScript", extension: "js", monaco: "javascript", judge0Id: 63 },
  { value: "typescript", label: "TypeScript", extension: "ts", monaco: "typescript", judge0Id: 74 },
  { value: "python", label: "Python", extension: "py", monaco: "python", judge0Id: 71 },
  { value: "java", label: "Java", extension: "java", monaco: "java", judge0Id: 62 },
  { value: "cpp", label: "C++", extension: "cpp", monaco: "cpp", judge0Id: 54 },
  { value: "c", label: "C", extension: "c", monaco: "c", judge0Id: 50 },
  { value: "go", label: "Go", extension: "go", monaco: "go", judge0Id: 60 },
  { value: "rust", label: "Rust", extension: "rs", monaco: "rust", judge0Id: 73 }
]

const DEFAULT_CODE_TEMPLATES = {
  javascript: "",
  python: "",
  java: "",
  cpp: "",
  typescript: "",
  c: "",
  go: "",
  rust: ""
}

export function CodeEditor({ problem, loading, onCodeChange, initialCode, initialLanguage, readOnly = false }: CodeEditorProps) {
  const { theme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || "python")
  const [code, setCode] = useState(initialCode || "")
  const [copied, setCopied] = useState(false)
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark")

  // Helper to get template code - always return empty string for clean slate
  const getTemplateCode = useCallback((language: string): string => {
    return DEFAULT_CODE_TEMPLATES[language as keyof typeof DEFAULT_CODE_TEMPLATES] || ""
  }, [])

  // Initialize code when component mounts or problem changes
  useEffect(() => {
    // If initialCode is provided (from assignment context), use it
    if (initialCode) {
      setCode(initialCode)
    }
    // Otherwise, start with empty code (no templates)
    else {
      setCode(DEFAULT_CODE_TEMPLATES[selectedLanguage as keyof typeof DEFAULT_CODE_TEMPLATES] || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id])

  // Sync selected language with parent (only on mount or when initialLanguage prop changes)
  useEffect(() => {
    if (initialLanguage && initialLanguage !== selectedLanguage) {
      setSelectedLanguage(initialLanguage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage])

  // Notify parent of code/language changes
  useEffect(() => {
    const language = LANGUAGES.find(lang => lang.value === selectedLanguage)
    if (onCodeChange && language) {
      onCodeChange(code, language.judge0Id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, selectedLanguage])

  // Update Monaco theme based on system theme
  useEffect(() => {
    const updateEditorTheme = () => {
      const root = window.document.documentElement

      // Check if theme is system, then check actual system preference
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setEditorTheme(systemPrefersDark ? 'vs-dark' : 'vs')
      } else {
        // For explicit light/dark theme
        const isDark = theme === 'dark' || root.classList.contains('dark')
        setEditorTheme(isDark ? 'vs-dark' : 'vs')
      }
    }

    updateEditorTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => updateEditorTheme()

    mediaQuery.addEventListener('change', handleChange)

    // Also observe DOM changes for theme class updates
    const observer = new MutationObserver(updateEditorTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      observer.disconnect()
    }
  }, [theme])

  const handleLanguageChange = useCallback((language: string) => {
    setSelectedLanguage(language)
    // Only reset code if it's still the default template
    const currentTemplate = getTemplateCode(selectedLanguage)
    if (code === currentTemplate || code.trim() === '') {
      const template = getTemplateCode(language)
      setCode(template)
    }
  }, [selectedLanguage, code, getTemplateCode])

  const handleReset = useCallback(() => {
    const template = getTemplateCode(selectedLanguage)
    setCode(template)
  }, [selectedLanguage, getTemplateCode])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }, [code])

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-linear-to-br from-background via-background to-muted/20">
      {/* Code Editor Area */}
      <div className="flex-1 px-3 py-1 pb-2 overflow-hidden">
        <Card className="h-full flex flex-col border border-border/60 bg-linear-to-br from-card/95 via-card to-muted/30 overflow-hidden p-0 gap-0">
          {/* Enhanced Toolbar */}
          <div className="flex items-center justify-between p-2 border-b border-border/60 bg-linear-to-r from-muted/40 via-muted/20 to-transparent">
            <div className="flex items-center gap-3">

              {/* Language Selector */}
              <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={readOnly}>
                <SelectTrigger className="text-sm font-medium border-border/60 bg-background/80 hover:bg-background hover:border-primary/40 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value} className="font-medium">
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium border-border/50">
                {code.split('\n').length} lines
              </Badge>
            </div>

            {/* Editor Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="px-3 border-border/60 hover:bg-green-500/10 hover:border-green-500/40 hover:text-green-600 dark:hover:text-green-400 transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-9 px-3 border-border/60 hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <Editor
                height="100%"
                language={LANGUAGES.find(lang => lang.value === selectedLanguage)?.monaco || "javascript"}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme={editorTheme}
                options={{
                  minimap: { enabled: true, scale: 1 },
                  fontSize: 15,
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "off",
                  padding: { top: 20, bottom: 20 },
                  suggestOnTriggerCharacters: true,
                  readOnly: readOnly,
                  quickSuggestions: readOnly ? false : {
                    other: true,
                    comments: true,
                    strings: true
                  },
                  bracketPairColorization: {
                    enabled: true
                  },
                  guides: {
                    bracketPairs: true,
                    indentation: true
                  },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
                  fontLigatures: true,
                  lineHeight: 1.6,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    useShadows: true,
                    verticalScrollbarSize: 12,
                    horizontalScrollbarSize: 12,
                    scrollByPage: false
                  },
                  overviewRulerBorder: false,
                  renderLineHighlight: "all",
                  renderWhitespace: "selection",
                  formatOnPaste: true,
                  formatOnType: true
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-muted/20">
                    <div className="text-center space-y-3">
                      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                      <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}