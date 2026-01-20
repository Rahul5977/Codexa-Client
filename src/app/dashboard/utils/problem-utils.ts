import { type Problem } from "../schemas/problem-schema"

export function filterProblems(
  problems: Problem[],
  searchTerm: string,
  selectedCategory: string,
  selectedDifficulty: string,
  selectedStatus: string
): Problem[] {
  return problems.filter((problem) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || problem.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "All" || problem.difficulty === selectedDifficulty
    const matchesStatus = selectedStatus === "All" || problem.status === selectedStatus.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })
}

export function paginateProblems(problems: Problem[], currentPage: number, pageSize: number) {
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  return {
    paginatedProblems: problems.slice(startIndex, endIndex),
    totalPages: Math.ceil(problems.length / pageSize),
    startIndex,
    endIndex
  }
}

export function getDifficultyBadgeClass(difficulty: Problem['difficulty']): string {
  const variants = {
    "Easy": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Medium": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Hard": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  }
  return variants[difficulty]
}

export function getStatusColor(status: Problem['status']): string {
  switch (status) {
    case 'solved':
      return 'text-green-500'
    case 'attempted':
      return 'text-yellow-500'
    case 'unsolved':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
}
