import { z } from "zod"

export const problemSchema = z.object({
  id: z.number(),
  title: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  category: z.string(),
  status: z.enum(["solved", "attempted", "unsolved"]),
  acceptance: z.string(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  companies: z.array(z.string()).optional(),
})

export type Problem = z.infer<typeof problemSchema>

export const problemFilterSchema = z.object({
  searchTerm: z.string(),
  selectedCategory: z.string(),
  selectedDifficulty: z.string(),
  selectedStatus: z.string(),
})

export type ProblemFilter = z.infer<typeof problemFilterSchema>

export const paginationSchema = z.object({
  currentPage: z.number().min(0),
  pageSize: z.number().min(1),
  totalPages: z.number().min(0),
  totalItems: z.number().min(0),
})

export type Pagination = z.infer<typeof paginationSchema>
