"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useProblems } from "@/hooks/api/use-dashboard"
import { type Problem } from "@/api/types/dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ProblemStatement } from "./components/problem-statement"
import { CodeEditor } from "./components/code-editor"
import { TestCases } from "./components/test-cases"
import { Code2, TestTube, Play, Square, Zap, Plus, FileText, History } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { PanelResizeHandle, PanelGroup, Panel } from "react-resizable-panels"
import { cn } from "@/lib/utils"

export default function CodePage() {
  const [searchParams] = useSearchParams()
  const problemId = searchParams.get('id')
  const { data: problems, loading: problemsLoading, error: problemsError } = useProblems()
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("code")
  const [isRunning, setIsRunning] = useState(false)
  const [leftPanelSize, setLeftPanelSize] = useState(45)
  const [rightPanelSize, setRightPanelSize] = useState(55)
  const [problemTab, setProblemTab] = useState<"description" | "submissions">("description")

  useEffect(() => {
    if (!problemsLoading && problems && problemId) {
      const problem = problems.find((p: Problem) => p.id === parseInt(problemId))
      setSelectedProblem(problem || null)
    }
    setLoading(problemsLoading)
  }, [problems, problemsLoading, problemId])

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setActiveTab("testcases") // Switch to test cases tab
    // Simulate code execution
    setTimeout(() => {
      setIsRunning(false)
    }, 2000)
  }, [])

  const handleSubmit = useCallback(() => {
    console.log('Submitting code...')
    // Add your submit logic here
  }, [])

  const handleAddTest = useCallback(() => {
    setActiveTab("testcases") // Switch to test cases tab
    // Trigger add test in TestCases component
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ' to run code
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault()
        if (!isRunning) {
          handleRun()
        }
      }
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, handleRun, handleSubmit])

  if (!problemId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Problem Selected</h2>
          <p className="text-muted-foreground">Please select a problem from the dashboard to start coding.</p>
        </div>
      </div>
    )
  }

  return (
    <BaseLayout>
      <div className="h-[90vh] flex flex-col overflow-y-auto bg-background m-0">
        <PanelGroup 
          direction="horizontal" 
          className="h-full gap-3 p-3"
          onLayout={(sizes) => {
            if (sizes[0] !== undefined) setLeftPanelSize(sizes[0])
            if (sizes[1] !== undefined) setRightPanelSize(sizes[1])
          }}
        >
          {/* Left Panel - Problem Statement */}
          <Panel defaultSize={45} minSize={5} maxSize={95} onResize={(size) => setLeftPanelSize(size)}>
            <div className="h-full border rounded-lg border-border/50 flex flex-col bg-linear-to-b from-background to-muted/10 overflow-hidden">
              {leftPanelSize <= 5 ? (
                <div className="h-full flex flex-col items-center justify-start gap-4 py-3">
                  <button
                    onClick={() => setProblemTab("submissions")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      problemTab === "submissions" 
                        ? "bg-muted p-2 border shadow-lg" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <History className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Submissions</span>
                  </button>
                  <button
                    onClick={() => setProblemTab("description")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      problemTab === "description"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Description</span>
                  </button>
                </div>
              ) : (
                // Normal view with content
                <div className={cn("h-full", leftPanelSize < 30 && "overflow-y-auto")}>
                  <ProblemStatement
                    problem={selectedProblem}
                    loading={loading}
                    error={problemsError}
                    activeTab={problemTab}
                    onTabChange={setProblemTab}
                  />
                </div>
              )}
            </div>
          </Panel>

          {/* Resizable Handle */}
          <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/50 active:bg-primary transition-colors rounded-full relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-linear-to-b from-transparent via-primary/30 to-transparent transition-all" />
          </PanelResizeHandle>

          {/* Right Panel - Tabs with Code Editor and Test Cases */}
          <Panel defaultSize={55} minSize={5} maxSize={95} onResize={(size) => setRightPanelSize(size)}>
            <div className="h-full flex flex-col border rounded-lg border-border/50 bg-linear-to-b from-background to-muted/10 overflow-hidden">
              {rightPanelSize <= 5 ? (
                <div className="h-full rotate-180 flex flex-col items-center justify-end gap-4 py-3">
                  <button
                    onClick={() => setActiveTab("testcases")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      activeTab === "testcases" 
                        ? "bg-muted p-2 border shadow-lg" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <TestTube className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Test Cases</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "[writing-mode:vertical-rl] flex gap-2 items-center justify-center rotate-180 rounded-lg transition-all text-sm font-medium",
                      activeTab === "code"
                        ? "bg-muted p-2 border shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code2 className="h-4 w-4 rotate-90" />
                    <span className="font-medium">Code Editor</span>
                  </button>
                </div>
              ) : (
                // Normal view with content
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="border-b border-border/50 bg-linear-to-r from-muted/30 to-muted/10 p-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <TabsList className="h-11 bg-transparent border-b-2 border-transparent">
                        <TabsTrigger
                          value="code"
                        >
                          <Code2 className="h-4 w-4" />
                          <span className="font-medium">Code Editor</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="testcases"
                        >
                          <TestTube className="h-4 w-4" />
                          <span className="font-medium">Test Cases</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddTest}
                          className="h-8 px-3 text-xs border-border/50 hover:bg-primary/10 hover:border-primary/30"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleRun}
                          disabled={isRunning}
                          className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 font-semibold"
                        >
                          {isRunning ? (
                            <>
                              <Square className="h-3.5 w-3.5 mr-1.5" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              Run
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          className="h-8 px-4 text-xs bg-primary text-white shadow-lg shadow-violet-600/20 font-semibold"
                        >
                          <Zap className="h-3.5 w-3.5 mr-1.5" />
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="code" className={cn("flex-1 m-0", rightPanelSize < 30 ? "overflow-auto" : "overflow-hidden")}>
                    <CodeEditor
                      problem={selectedProblem}
                      loading={loading}
                    />
                  </TabsContent>

                  <TabsContent value="testcases" className={cn("flex-1 m-0", rightPanelSize < 30 ? "overflow-auto" : "overflow-hidden")}>
                    <TestCases
                      problem={selectedProblem}
                      loading={loading}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </BaseLayout>
  )
}
