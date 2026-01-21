"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, AlertCircle, Search, Code2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Import API hooks and types
import { useProblems } from "@/hooks/api/use-dashboard"
import { type Problem } from "@/api/types/dashboard"

// Filter options
const categories = ["All", "Array", "String", "Linked List", "Math", "Dynamic Programming", "Tree", "Graph", "Hash Table"]
const difficulties = ["All", "Easy", "Medium", "Hard"]
const statuses = ["All", "Solved", "Attempted", "Unsolved"]

export function ProblemSet() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Navigation handler for problem selection
  const handleProblemClick = (problemId: number) => {
    navigate(`/code?id=${problemId}`)
  }

  // API call with parameters
  const { 
    data: problems, 
    loading, 
    error,
    totalCount,
    totalPages,
    refetch 
  } = useProblems({
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
    status: selectedStatus !== "All" ? selectedStatus.toLowerCase() : undefined
  })

  // Reset to first page when filters change
  const resetToFirstPage = () => setCurrentPage(1)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedDifficulty, selectedStatus])

  const getDifficultyBadge = (difficulty: Problem['difficulty']) => {
    const variants = {
      "Easy": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "Medium": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      "Hard": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    }
    return variants[difficulty]
  }

  const getStatusIcon = (status: Problem['status']) => {
    switch (status) {
      case 'solved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'attempted':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'unsolved':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Loading Problems...
          </CardTitle>
          <CardDescription>
            Fetching coding problems from the server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Error Loading Problems
          </CardTitle>
          <CardDescription>
            There was an error fetching the problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Problem Set ({totalCount} problems)
        </CardTitle>
        <CardDescription>
          Practice coding problems and improve your algorithmic skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              className="pl-8 w-full md:w-80"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                resetToFirstPage()
              }}
            />
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value)
              resetToFirstPage()
            }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={(value) => {
              setSelectedDifficulty(value)
              resetToFirstPage()
            }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value)
              resetToFirstPage()
            }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Problems Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Status</TableHead>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-24">Difficulty</TableHead>
                <TableHead className="w-24">Acceptance</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems?.map((problem: Problem) => (
                <TableRow key={problem.id} className="hover:bg-muted/30">
                  <TableCell>
                    {getStatusIcon(problem.status)}
                  </TableCell>
                  <TableCell className="font-medium">{problem.id}</TableCell>
                  <TableCell>
                    <button 
                      className="text-left hover:text-primary transition-colors font-medium"
                      onClick={() => handleProblemClick(problem.id)}
                    >
                      {problem.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getDifficultyBadge(problem.difficulty))}>
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{problem.acceptance}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleProblemClick(problem.id)}
                    >
                      {problem.status === 'solved' ? 'View' : 'Solve'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 mt-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Showing {((currentPage - 1) * pageSize) + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of{" "}
            {totalCount} problem(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-20 cursor-pointer" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex cursor-pointer"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 cursor-pointer"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 cursor-pointer"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex cursor-pointer"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {!problems || problems.length === 0 && totalCount === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No problems found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
        
        {problems && problems.length === 0 && totalCount > 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <h3 className="text-lg font-medium">No problems on this page</h3>
              <p className="text-sm">Try going to a different page or adjusting page size</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
