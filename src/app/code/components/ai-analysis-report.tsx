"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  Timer,
  HardDrive,
  Lightbulb,
  Bug,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAIAnalysis, invalidateAIAnalysis, type AIAnalysisReport } from "@/api/services/ai-analytics"
import { toast } from "sonner"

// Convert **bold** markdown to <strong> elements
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

interface AIAnalysisReportProps {
  submissionId: string
  submissionStatus: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function ComplexityBadge({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  // Extract just the big-O notation for the badge colour
  const isLinear = /O\(n\)/i.test(value) && !/O\(n\^2\)/i.test(value)
  const isQuadratic = /O\(n[\^2²]?\s*(?:\*|×)?\s*(?:n|2)\)/i.test(value) || /O\(n2\)/i.test(value)
  const isLogLinear = /O\(n\s*log/i.test(value)
  const isConstant = /O\(1\)/i.test(value)

  const badgeClass = isConstant
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : isLinear || isLogLinear
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : isQuadratic
        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className={cn("text-sm font-mono font-semibold rounded-md px-3 py-1.5 break-words whitespace-normal leading-relaxed", badgeClass)}>
        {value}
      </p>
    </Card>
  )
}

function CollapsibleSection({
  title,
  icon,
  items,
  defaultOpen = true,
  iconColor,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  defaultOpen?: boolean
  iconColor?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!items || items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left"
      >
        <div className={cn("flex items-center gap-2 text-sm font-semibold", iconColor)}>
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
            {items.length}
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <ul className="mt-1 space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm leading-relaxed"
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60 mt-1.5" />
              <span><RichText text={item} /></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export function AIAnalysisReport({ submissionId, submissionStatus }: AIAnalysisReportProps) {
  const [report, setReport] = useState<AIAnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const isTerminal =
    submissionStatus !== "PENDING" && submissionStatus !== "PROCESSING"

  const fetchAnalysis = useCallback(async (signal?: AbortSignal) => {
    if (!submissionId || !isTerminal) return

    setLoading(true)
    setError(null)
    try {
      const data = await getAIAnalysis(submissionId, signal)
      setReport(data)
    } catch (err: any) {
      if (err.name === 'AbortError' && signal?.aborted) return  // Component unmounted — ignore silently
      setError(err.message || "Failed to load AI analysis")
    } finally {
      setLoading(false)
    }
  }, [submissionId, isTerminal])

  useEffect(() => {
    const controller = new AbortController()
    fetchAnalysis(controller.signal)
    return () => controller.abort()
  }, [fetchAnalysis])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await invalidateAIAnalysis(submissionId)
      const data = await getAIAnalysis(submissionId)
      setReport(data)
      toast.success("Analysis regenerated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate analysis")
    } finally {
      setRegenerating(false)
    }
  }

  // ── Pending ────────────────────────────────────────────────────────────────
  if (!isTerminal) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <Brain className="mx-auto mb-2 h-8 w-8 opacity-30" />
        <p>AI Analysis will be available once the submission finishes.</p>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4 animate-pulse text-primary" />
          <span>Generating AI analysis…</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">Analysis unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground break-words">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => fetchAnalysis()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!report) return null

  // ── Report ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">AI Code Analysis</h3>
          {report.cached && (
            <Badge variant="secondary" className="text-xs">Cached</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="h-8 text-xs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", regenerating && "animate-spin")} />
          {regenerating ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>

      {/* Summary */}
      {report.summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed"><RichText text={report.summary} /></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complexity Row */}
      <div className="grid grid-cols-2 gap-3">
        <ComplexityBadge
          label="Time Complexity"
          value={report.timeComplexity}
          icon={<Timer className="h-3.5 w-3.5" />}
        />
        <ComplexityBadge
          label="Space Complexity"
          value={report.spaceComplexity}
          icon={<HardDrive className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Algorithm Explanation */}
      {report.algorithmExplanation && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground/80">
            <Code2 className="h-4 w-4 text-blue-500" />
            Algorithm Explanation
          </div>
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed"><RichText text={report.algorithmExplanation} /></p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Collapsible sections */}
      <CollapsibleSection
        title="Possible Optimizations"
        icon={<Sparkles className="h-4 w-4" />}
        items={report.possibleOptimizations}
        iconColor="text-yellow-500 dark:text-yellow-400"
        defaultOpen
      />

      <CollapsibleSection
        title="Code Quality Feedback"
        icon={<Lightbulb className="h-4 w-4" />}
        items={report.codeQualityFeedback}
        iconColor="text-blue-500 dark:text-blue-400"
        defaultOpen
      />

      <CollapsibleSection
        title="Edge Cases & Potential Bugs"
        icon={<Bug className="h-4 w-4" />}
        items={report.edgeCasesAndBugs}
        iconColor="text-red-500 dark:text-red-400"
        defaultOpen={false}
      />

      {/* Footer */}
      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
        Generated {new Date(report.generatedAt).toLocaleString()} · Powered by Google Gemini
      </p>
    </div>
  )
}
