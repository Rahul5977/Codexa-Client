"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RotateCcw,
  Copy,
  Check
} from "lucide-react"
import { type Problem } from "@/api/types/dashboard"

interface CodeEditorProps {
  problem: Problem | null
  loading?: boolean
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", extension: "js" },
  { value: "typescript", label: "TypeScript", extension: "ts" },
  { value: "python", label: "Python", extension: "py" },
  { value: "java", label: "Java", extension: "java" },
  { value: "cpp", label: "C++", extension: "cpp" },
  { value: "c", label: "C", extension: "c" },
  { value: "go", label: "Go", extension: "go" },
  { value: "rust", label: "Rust", extension: "rs" }
]

const DEFAULT_CODE_TEMPLATES = {
  javascript: `function twoSum(nums, target) {
    // Your code here
    
}`,
  python: `def two_sum(nums, target):
    # Your code here
    pass`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        
    }
}`,
  cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        
    }
};`
}

export function CodeEditor({ loading }: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.javascript)
  const [copied, setCopied] = useState(false)

  const handleLanguageChange = useCallback((language: string) => {
    setSelectedLanguage(language)
    const template = DEFAULT_CODE_TEMPLATES[language as keyof typeof DEFAULT_CODE_TEMPLATES] || "// Your code here"
    setCode(template)
  }, [])

  const handleReset = useCallback(() => {
    const template = DEFAULT_CODE_TEMPLATES[selectedLanguage as keyof typeof DEFAULT_CODE_TEMPLATES] || "// Your code here"
    setCode(template)
  }, [selectedLanguage])

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
    <div className="h-full flex flex-col bg-background">
      {/* Code Editor Area */}
      <div className="flex-1 p-3 overflow-hidden bg-linear-to-b from-transparent to-muted/5">
        <Card className="h-full flex flex-col shadow-sm border-border/50 bg-linear-to-br from-muted/10 to-background py-3">
          <div className="flex items-center justify-between px-3 pb-3 border-b border-border/50">
            {/* Language Selector - Left Side */}
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32 h-8 text-xs border-border/50 bg-background/50">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Editor Actions - Right Side */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-2 border-border/50 hover:bg-primary/10 hover:border-primary/30">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handleReset} className="h-8 px-2 border-border/50 hover:bg-primary/10 hover:border-primary/30">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-2">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your solution here...\n// Happy coding!"
              className="h-full resize-none font-mono text-sm leading-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto bg-transparent placeholder:text-muted-foreground/50 p-2"
              style={{
                fontFamily: '"Fira Code", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
