import { useState, useCallback } from 'react'
import {
  runCode,
  submitCode,
  getSubmissionById,
  getSubmissions,
  type RunCodeInput,
  type RunCodeResult,
  type CreateSubmissionInput,
  type SubmissionResult
} from '@/api/services/submission'
import { toast } from 'sonner'

export function useCodeExecution() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunCodeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (data: RunCodeInput) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runCode(data)
      setResult(res)
      return res
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to run code'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    execute,
    result,
    loading,
    error,
    clearResult: () => setResult(null)
  }
}

export function useCodeSubmission() {
  const [loading, setLoading] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (data: CreateSubmissionInput) => {
    setLoading(true)
    setError(null)
    setSubmissionId(null)
    try {
      const res = await submitCode(data)
      setSubmissionId(res.submissionId)
      toast.success('Code submitted successfully')
      return res
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to submit code'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    submit,
    submissionId,
    loading,
    error,
    clearSubmission: () => setSubmissionId(null)
  }
}

export function useSubmission(id: string | null) {
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const res = await getSubmissionById(id)
      setSubmission(res.submission)
      return res.submission
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch submission'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [id])

  // Poll for submission status
  const poll = useCallback(async (intervalMs: number = 2000, maxAttempts: number = 30) => {
    if (!id) return

    let attempts = 0
    const pollInterval = setInterval(async () => {
      attempts++
      try {
        const result = await fetch()
        if (result && result.status !== 'PENDING' && result.status !== 'PROCESSING') {
          clearInterval(pollInterval)
          toast.success('Submission evaluated')
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          toast.error('Submission evaluation timed out')
        }
      } catch (err) {
        clearInterval(pollInterval)
      }
    }, intervalMs)

    return () => clearInterval(pollInterval)
  }, [id, fetch])

  return {
    submission,
    loading,
    error,
    fetch,
    poll
  }
}

export function useSubmissionHistory(userId?: string, problemId?: string) {
  const [submissions, setSubmissions] = useState<SubmissionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSubmissions(userId, problemId)
      setSubmissions(data)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch submissions'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId, problemId])

  return {
    submissions,
    loading,
    error,
    fetch,
    refetch: fetch
  }
}
