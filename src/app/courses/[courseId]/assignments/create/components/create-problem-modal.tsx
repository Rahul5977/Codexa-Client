"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import { createProblem, type Problem, type CreateProblemInput, type Difficulty } from "@/api/services/problem"

interface CreateProblemModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProblemCreated: (problem: Problem) => void
}

interface Example {
    input: string
    output: string
    explanation: string
}

interface TestCase {
    input: string
    output: string
}

export default function CreateProblemModal({
    open,
    onOpenChange,
    onProblemCreated,
}: CreateProblemModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState<CreateProblemInput>({
        title: "",
        difficulty: "MEDIUM" as Difficulty,
        statement: "",
        examples: [],
        constraints: [],
        tags: [],
        hints: [],
        companies: [],
        testcases: [],
    })

    const [newExample, setNewExample] = useState<Example>({
        input: "",
        output: "",
        explanation: "",
    })

    const [newTestCase, setNewTestCase] = useState<TestCase>({
        input: "",
        output: "",
    })

    const [newTag, setNewTag] = useState("")
    const [newConstraint, setNewConstraint] = useState("")
    const [newHint, setNewHint] = useState("")
    const [newCompany, setNewCompany] = useState("")

    const handleReset = () => {
        setFormData({
            title: "",
            difficulty: "MEDIUM" as Difficulty,
            statement: "",
            examples: [],
            constraints: [],
            tags: [],
            hints: [],
            companies: [],
            testcases: [],
        })
        setNewExample({ input: "", output: "", explanation: "" })
        setNewTestCase({ input: "", output: "" })
        setNewTag("")
        setNewConstraint("")
        setNewHint("")
        setNewCompany("")
    }

    const handleAddExample = () => {
        if (!newExample.input || !newExample.output) {
            toast({
                title: "Error",
                description: "Please fill in input and output for the example",
                variant: "destructive",
            })
            return
        }
        setFormData({
            ...formData,
            examples: [...formData.examples, { ...newExample }],
        })
        setNewExample({ input: "", output: "", explanation: "" })
    }

    const handleRemoveExample = (index: number) => {
        setFormData({
            ...formData,
            examples: formData.examples.filter((_, i) => i !== index),
        })
    }

    const handleAddTestCase = () => {
        if (!newTestCase.input || !newTestCase.output) {
            toast({
                title: "Error",
                description: "Please fill in input and output for the test case",
                variant: "destructive",
            })
            return
        }
        setFormData({
            ...formData,
            testcases: [...formData.testcases, { ...newTestCase }],
        })
        setNewTestCase({ input: "", output: "" })
    }

    const handleRemoveTestCase = (index: number) => {
        setFormData({
            ...formData,
            testcases: formData.testcases.filter((_, i) => i !== index),
        })
    }

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            })
            setNewTag("")
        }
    }

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t) => t !== tag),
        })
    }

    const handleAddConstraint = () => {
        if (newConstraint.trim()) {
            setFormData({
                ...formData,
                constraints: [...formData.constraints, newConstraint.trim()],
            })
            setNewConstraint("")
        }
    }

    const handleRemoveConstraint = (index: number) => {
        setFormData({
            ...formData,
            constraints: formData.constraints.filter((_, i) => i !== index),
        })
    }

    const handleAddHint = () => {
        if (newHint.trim()) {
            setFormData({
                ...formData,
                hints: [...formData.hints, newHint.trim()],
            })
            setNewHint("")
        }
    }

    const handleRemoveHint = (index: number) => {
        setFormData({
            ...formData,
            hints: formData.hints.filter((_, i) => i !== index),
        })
    }

    const handleAddCompany = () => {
        if (newCompany.trim() && !formData.companies.includes(newCompany.trim())) {
            setFormData({
                ...formData,
                companies: [...formData.companies, newCompany.trim()],
            })
            setNewCompany("")
        }
    }

    const handleRemoveCompany = (company: string) => {
        setFormData({
            ...formData,
            companies: formData.companies.filter((c) => c !== company),
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast({
                title: "Error",
                description: "Please enter a problem title",
                variant: "destructive",
            })
            return
        }

        if (!formData.statement.trim()) {
            toast({
                title: "Error",
                description: "Please enter a problem statement",
                variant: "destructive",
            })
            return
        }

        if (formData.examples.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one example",
                variant: "destructive",
            })
            return
        }

        if (formData.testcases.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one test case",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)
            const newProblem = await createProblem(formData)
            toast({
                title: "Success",
                description: "Problem created successfully",
            })
            onProblemCreated(newProblem)
            handleReset()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error creating problem:", error)
            toast({
                title: "Error",
                description: error?.message || "Failed to create problem",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create New Problem</DialogTitle>
                    <DialogDescription>
                        Create a new coding problem to add to your assignment
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Two Sum"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty *</Label>
                                <Select
                                    value={formData.difficulty}
                                    onValueChange={(value: Difficulty) =>
                                        setFormData({ ...formData, difficulty: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EASY">Easy</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HARD">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="statement">Problem Statement *</Label>
                                <Textarea
                                    id="statement"
                                    placeholder="Describe the problem..."
                                    value={formData.statement}
                                    onChange={(e) =>
                                        setFormData({ ...formData, statement: e.target.value })
                                    }
                                    rows={6}
                                    required
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a tag (e.g., Array, Sorting)"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddTag()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddTag} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Examples */}
                        <div className="space-y-2">
                            <Label>Examples * (At least 1 required)</Label>
                            <div className="space-y-2 p-3 border rounded-lg">
                                <Input
                                    placeholder="Input"
                                    value={newExample.input}
                                    onChange={(e) =>
                                        setNewExample({ ...newExample, input: e.target.value })
                                    }
                                />
                                <Input
                                    placeholder="Output"
                                    value={newExample.output}
                                    onChange={(e) =>
                                        setNewExample({ ...newExample, output: e.target.value })
                                    }
                                />
                                <Input
                                    placeholder="Explanation (optional)"
                                    value={newExample.explanation}
                                    onChange={(e) =>
                                        setNewExample({ ...newExample, explanation: e.target.value })
                                    }
                                />
                                <Button type="button" onClick={handleAddExample} size="sm" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" /> Add Example
                                </Button>
                            </div>
                            {formData.examples.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {formData.examples.map((example, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-sm">Example {index + 1}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveExample(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm"><strong>Input:</strong> {example.input}</p>
                                            <p className="text-sm"><strong>Output:</strong> {example.output}</p>
                                            {example.explanation && (
                                                <p className="text-sm"><strong>Explanation:</strong> {example.explanation}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Test Cases */}
                        <div className="space-y-2">
                            <Label>Test Cases * (At least 1 required)</Label>
                            <div className="space-y-2 p-3 border rounded-lg">
                                <Input
                                    placeholder="Input"
                                    value={newTestCase.input}
                                    onChange={(e) =>
                                        setNewTestCase({ ...newTestCase, input: e.target.value })
                                    }
                                />
                                <Input
                                    placeholder="Output"
                                    value={newTestCase.output}
                                    onChange={(e) =>
                                        setNewTestCase({ ...newTestCase, output: e.target.value })
                                    }
                                />
                                <Button type="button" onClick={handleAddTestCase} size="sm" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" /> Add Test Case
                                </Button>
                            </div>
                            {formData.testcases.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {formData.testcases.length} test case(s) added
                                </div>
                            )}
                        </div>

                        {/* Constraints */}
                        <div className="space-y-2">
                            <Label>Constraints</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a constraint (e.g., 1 <= n <= 10^4)"
                                    value={newConstraint}
                                    onChange={(e) => setNewConstraint(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddConstraint()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddConstraint} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.constraints.length > 0 && (
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    {formData.constraints.map((constraint, index) => (
                                        <li key={index} className="text-sm flex justify-between items-center">
                                            <span>{constraint}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveConstraint(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Hints */}
                        <div className="space-y-2">
                            <Label>Hints</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a hint"
                                    value={newHint}
                                    onChange={(e) => setNewHint(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddHint()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddHint} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.hints.length > 0 && (
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    {formData.hints.map((hint, index) => (
                                        <li key={index} className="text-sm flex justify-between items-center">
                                            <span>{hint}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveHint(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Companies */}
                        <div className="space-y-2">
                            <Label>Companies</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a company (e.g., Google, Amazon)"
                                    value={newCompany}
                                    onChange={(e) => setNewCompany(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddCompany()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddCompany} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.companies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.companies.map((company) => (
                                        <Badge key={company} variant="outline">
                                            {company}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCompany(company)}
                                                className="ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            handleReset()
                            onOpenChange(false)
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Problem
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}