import { useState, useEffect, useCallback } from 'react'
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  type Problem,
  type CreateProblemInput,
  type UpdateProblemInput
} from '@/api/services/problem'
import { toast } from 'sonner'

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProblems()
      setProblems(data)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch problems'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  return {
    problems,
    loading,
    error,
    refetch: fetchProblems
  }
}

export function useProblem(id: string | null) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProblem = useCallback(async () => {
    if (!id) {
      setProblem(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getProblemById(id)
      setProblem(data)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch problem'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProblem()
  }, [fetchProblem])

  return {
    problem,
    loading,
    error,
    refetch: fetchProblem
  }
}

export function useProblemMutations() {
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (data: CreateProblemInput) => {
    setLoading(true)
    try {
      const result = await createProblem(data)
      toast.success('Problem created successfully')
      return result
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to create problem'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, data: UpdateProblemInput) => {
    setLoading(true)
    try {
      const result = await updateProblem(id, data)
      toast.success('Problem updated successfully')
      return result
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to update problem'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    try {
      await deleteProblem(id)
      toast.success('Problem deleted successfully')
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to delete problem'
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    create,
    update,
    remove,
    loading
  }
}
