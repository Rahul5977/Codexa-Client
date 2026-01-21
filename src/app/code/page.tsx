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
import { Code2, TestTube, Play, Square, Zap, Plus } from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"

export default function CodePage() {
  const [searchParams] = useSearchParams()
  const problemId = searchParams.get('id')
  const { data: problems, loading: problemsLoading, error: problemsError } = useProblems()
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("code")
  const [isRunning, setIsRunning] = useState(false)

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
      <div className="h-full flex flex-col lg:flex-row gap-3 md:gap-0 overflow-hidden bg-background">
        {/* Left Panel - Problem Statement */}
        <div className="w-full lg:w-[45%] mx-3 border rounded-lg border-border/50 flex flex-col bg-linear-to-b from-background to-muted/10">
          <ProblemStatement
            problem={selectedProblem}
            loading={loading}
            error={problemsError}
          />
        </div>

        {/* Right Panel - Tabs with Code Editor and Test Cases */}
        <div className="w-full lg:w-[55%] flex flex-col border rounded-lg border-border/50 bg-linear-to-b from-background to-muted/10 mx-3">
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

            <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
              <CodeEditor
                problem={selectedProblem}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="testcases" className="flex-1 m-0 overflow-hidden">
              <TestCases
                problem={selectedProblem}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </BaseLayout>
  )
}
