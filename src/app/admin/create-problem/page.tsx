"use client"

import { useMemo, useState } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { createProblem, type CreateProblemInput, type Difficulty } from "@/api/services/problem"
import { Eye, Loader2, Plus, Trash2 } from "lucide-react"

type ExampleItem = {
  input: string
  output: string
  explanation?: string
}

type TestcaseItem = {
  input: string
  output: string
}

const difficultyOptions: Difficulty[] = ["EASY", "MEDIUM", "HARD"]

const difficultyBadgeClass: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HARD: "bg-red-100 text-red-700 border-red-200",
}

const parseListField = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeMultiline = (value: string) => value.replace(/\\n/g, "\n")

export default function AdminCreateProblemPage() {
  const { toast } = useToast()

  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY")
  const [statement, setStatement] = useState("")
  const [constraintsText, setConstraintsText] = useState("")
  const [tagsText, setTagsText] = useState("")
  const [hintsText, setHintsText] = useState("")
  const [companiesText, setCompaniesText] = useState("")

  const [examples, setExamples] = useState<ExampleItem[]>([
    { input: "", output: "", explanation: "" },
  ])
  const [testcases, setTestcases] = useState<TestcaseItem[]>([{ input: "", output: "" }])
  const [hiddenTestcases, setHiddenTestcases] = useState<TestcaseItem[]>([{ input: "", output: "" }])

  const summaryData = useMemo(() => {
    return {
      constraints: parseListField(constraintsText),
      tags: parseListField(tagsText),
      hints: parseListField(hintsText),
      companies: parseListField(companiesText),
    }
  }, [constraintsText, tagsText, hintsText, companiesText])

  const updateArrayItem = <T,>(
    list: T[],
    setList: (items: T[]) => void,
    index: number,
    key: keyof T,
    value: string
  ) => {
    const next = [...list]
    next[index] = { ...next[index], [key]: value }
    setList(next)
  }

  const removeArrayItem = <T,>(list: T[], setList: (items: T[]) => void, index: number) => {
    if (list.length === 1) return
    setList(list.filter((_, i) => i !== index))
  }

  const addExample = () => setExamples((prev) => [...prev, { input: "", output: "", explanation: "" }])
  const addTestcase = () => setTestcases((prev) => [...prev, { input: "", output: "" }])
  const addHiddenTestcase = () => setHiddenTestcases((prev) => [...prev, { input: "", output: "" }])

  const validateForm = () => {
    if (!title.trim()) return "Title is required"
    if (!statement.trim()) return "Statement is required"

    const cleanExamples = examples.filter((e) => e.input.trim() && e.output.trim())
    if (cleanExamples.length === 0) return "At least one valid example is required"

    const cleanTestcases = testcases.filter((t) => t.input.trim() && t.output.trim())
    if (cleanTestcases.length === 0) return "At least one visible testcase is required"

    return null
  }

  const resetForm = () => {
    setTitle("")
    setDifficulty("EASY")
    setStatement("")
    setConstraintsText("")
    setTagsText("")
    setHintsText("")
    setCompaniesText("")
    setExamples([{ input: "", output: "", explanation: "" }])
    setTestcases([{ input: "", output: "" }])
    setHiddenTestcases([{ input: "", output: "" }])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Validation error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    const payload: CreateProblemInput = {
      title: title.trim(),
      difficulty,
      statement: normalizeMultiline(statement.trim()),
      examples: examples
        .filter((e) => e.input.trim() && e.output.trim())
        .map((e) => ({
          input: normalizeMultiline(e.input.trim()),
          output: normalizeMultiline(e.output.trim()),
          explanation: normalizeMultiline(e.explanation?.trim() || "") || undefined,
        })),
      constraints: parseListField(constraintsText),
      tags: parseListField(tagsText),
      hints: parseListField(hintsText),
      companies: parseListField(companiesText),
      testcases: testcases
        .filter((t) => t.input.trim() && t.output.trim())
        .map((t) => ({
          input: normalizeMultiline(t.input.trim()),
          output: normalizeMultiline(t.output.trim()),
        })),
      hiddenTestcases: hiddenTestcases
        .filter((t) => t.input.trim() && t.output.trim())
        .map((t) => ({
          input: normalizeMultiline(t.input.trim()),
          output: normalizeMultiline(t.output.trim()),
        })),
    }

    try {
      setSubmitting(true)
      await createProblem(payload)
      toast({
        title: "Problem created",
        description: "The problem has been added successfully.",
      })
      resetForm()
    } catch (error: any) {
      toast({
        title: "Failed to create problem",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BaseLayout title="Create Problem" description="Admin-only problem creation workspace">
      <div className="px-4 py-6 lg:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Problem Form</CardTitle>
              <CardDescription>Fill all required fields and submit.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Two Sum"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Difficulty</Label>
                    <RadioGroup
                      value={difficulty}
                      onValueChange={(value) => setDifficulty(value as Difficulty)}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                    >
                      {difficultyOptions.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                        >
                          <RadioGroupItem value={option} id={`difficulty-${option}`} />
                          <span>{option}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statement">Statement</Label>
                  <Textarea
                    id="statement"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    rows={8}
                    placeholder="Write the full problem statement with input/output format."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints">Constraints (comma/newline separated)</Label>
                  <Textarea
                    id="constraints"
                    value={constraintsText}
                    onChange={(e) => setConstraintsText(e.target.value)}
                    rows={3}
                    placeholder="e.g. 1 <= n <= 10^5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma/newline separated)</Label>
                    <Textarea
                      id="tags"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      rows={3}
                      placeholder="Array, Hash Table"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companies">Companies (comma/newline separated)</Label>
                    <Textarea
                      id="companies"
                      value={companiesText}
                      onChange={(e) => setCompaniesText(e.target.value)}
                      rows={3}
                      placeholder="Google, Amazon"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hints">Hints (comma/newline separated)</Label>
                  <Textarea
                    id="hints"
                    value={hintsText}
                    onChange={(e) => setHintsText(e.target.value)}
                    rows={3}
                    placeholder="Think about using a hash map"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Examples</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={addExample}>
                      <Plus className="mr-1 h-4 w-4" /> Add Example
                    </Button>
                  </div>

                  {examples.map((example, index) => (
                    <Card key={`example-${index}`} className="border-dashed">
                      <CardContent className="space-y-2 p-4">
                        <Textarea
                          placeholder="Input"
                          rows={3}
                          value={example.input}
                          onChange={(e) => updateArrayItem(examples, setExamples, index, "input", e.target.value)}
                        />
                        <Textarea
                          placeholder="Output"
                          rows={3}
                          value={example.output}
                          onChange={(e) => updateArrayItem(examples, setExamples, index, "output", e.target.value)}
                        />
                        <Input
                          placeholder="Explanation (optional)"
                          value={example.explanation || ""}
                          onChange={(e) => updateArrayItem(examples, setExamples, index, "explanation", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem(examples, setExamples, index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Visible Testcases</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={addTestcase}>
                      <Plus className="mr-1 h-4 w-4" /> Add Testcase
                    </Button>
                  </div>

                  {testcases.map((testcase, index) => (
                    <div key={`test-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Textarea
                        placeholder="Input"
                        rows={3}
                        value={testcase.input}
                        onChange={(e) => updateArrayItem(testcases, setTestcases, index, "input", e.target.value)}
                      />
                      <Textarea
                        placeholder="Output"
                        rows={3}
                        value={testcase.output}
                        onChange={(e) => updateArrayItem(testcases, setTestcases, index, "output", e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(testcases, setTestcases, index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Hidden Testcases</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={addHiddenTestcase}>
                      <Plus className="mr-1 h-4 w-4" /> Add Hidden
                    </Button>
                  </div>

                  {hiddenTestcases.map((testcase, index) => (
                    <div key={`hidden-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Textarea
                        placeholder="Input"
                        rows={3}
                        value={testcase.input}
                        onChange={(e) => updateArrayItem(hiddenTestcases, setHiddenTestcases, index, "input", e.target.value)}
                      />
                      <Textarea
                        placeholder="Output"
                        rows={3}
                        value={testcase.output}
                        onChange={(e) => updateArrayItem(hiddenTestcases, setHiddenTestcases, index, "output", e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(hiddenTestcases, setHiddenTestcases, index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Problem"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Problem Preview
              </CardTitle>
              <CardDescription>Live preview of how students will see this problem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">{title.trim() || "Untitled Problem"}</h2>
                <Badge className={`${difficultyBadgeClass[difficulty] || ""} border`}>{difficulty}</Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Problem Statement</h3>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {normalizeMultiline(statement.trim()) || "Problem statement preview will appear here..."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Examples</h3>
                {examples.filter((e) => e.input.trim() && e.output.trim()).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No valid examples yet.</p>
                ) : (
                  <div className="space-y-3">
                    {examples
                      .filter((e) => e.input.trim() && e.output.trim())
                      .map((example, index) => (
                        <Card key={`preview-ex-${index}`}>
                          <CardContent className="space-y-2 p-4 text-sm">
                            <div>
                              <p className="font-medium">Input</p>
                              <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2">{normalizeMultiline(example.input)}</pre>
                            </div>
                            <div>
                              <p className="font-medium">Output</p>
                              <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2">{normalizeMultiline(example.output)}</pre>
                            </div>
                            {example.explanation?.trim() && (
                              <div>
                                <p className="font-medium">Explanation</p>
                                <p className="mt-1 whitespace-pre-wrap">{normalizeMultiline(example.explanation)}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Constraints</h3>
                {summaryData.constraints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No constraints added.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {summaryData.constraints.map((constraint, index) => (
                      <li key={`constraint-${index}`}>{constraint}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Input / Output Format</h3>
                {testcases.filter((t) => t.input.trim() && t.output.trim()).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add visible testcases to preview I/O format.</p>
                ) : (
                  <Card>
                    <CardContent className="space-y-2 p-4 text-sm">
                      <p>
                        <span className="font-medium">Sample Input:</span>
                      </p>
                      <pre className="whitespace-pre-wrap rounded bg-muted/40 p-2">
                        {normalizeMultiline(testcases.filter((t) => t.input.trim() && t.output.trim())[0]?.input || "")}
                      </pre>
                      <p>
                        <span className="font-medium">Sample Output:</span>
                      </p>
                      <pre className="whitespace-pre-wrap rounded bg-muted/40 p-2">
                        {normalizeMultiline(testcases.filter((t) => t.input.trim() && t.output.trim())[0]?.output || "")}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>

              {(summaryData.tags.length > 0 || summaryData.companies.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {summaryData.tags.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {summaryData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {summaryData.companies.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Companies</h3>
                        <div className="flex flex-wrap gap-2">
                          {summaryData.companies.map((company) => (
                            <Badge key={company} variant="outline">
                              {company}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseLayout>
  )
}
