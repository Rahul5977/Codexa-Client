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
  const [results, setResults] = useState<RunCodeResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (data: RunCodeInput) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runCode(data)
      console.log('Code execution result:', res)
      setResult(res)
      return res
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to run code'
      console.error('Code execution error:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const executeMultiple = useCallback(async (testCases: Array<{ input: string, expectedOutput: string }>, code: string, languageId: number, problemId: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    
    try {
      const allResults: RunCodeResult[] = []
      
      for (const testCase of testCases) {
        try {
          const res = await runCode({
            code,
            languageId,
            problemId,
            stdin: testCase.input
          })
          console.log('Individual test case result:', res)
          allResults.push(res)
        } catch (err: any) {
          console.error('Error running test case:', err)
          // Push an error result instead of failing completely
          allResults.push({
            status: 'Error',
            stdout: undefined,
            stderr: err?.response?.data?.message || err.message || 'Execution failed',
            compile_output: undefined,
            time: '0',
            memory: 0
          })
        }
      }
      
      console.log('All test case results:', allResults)
      setResults(allResults)
      return allResults
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to run code'
      console.error('Code execution error:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    execute,
    executeMultiple,
    result,
    results,
    loading,
    error,
    clearResult: () => { setResult(null); setResults([]) }
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
      console.log('Code submission result:', res)
      setSubmissionId(res.submissionId)
      toast.success('Code submitted successfully! Evaluating...')
      return res
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to submit code'
      console.error('Code submission error:', err)
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
      try {
        attempts++
        const result = await fetch()
        console.log('Polling attempt', attempts, '- Submission status:', result?.status)
        
        if (result && result.status !== 'PENDING' && result.status !== 'PROCESSING') {
          clearInterval(pollInterval)
          
          // Show appropriate toast based on status
          if (result.status === 'ACCEPTED') {
            toast.success('✅ All test cases passed!')
          } else if (result.status === 'WRONG_ANSWER') {
            toast.error('❌ Wrong answer')
          } else if (result.status === 'COMPILATION_ERROR') {
            toast.error('⚠️ Compilation error')
          } else if (result.status === 'TIME_LIMIT_EXCEEDED') {
            toast.error('⏱️ Time limit exceeded')
          } else if (result.status === 'ERROR') {
            toast.error('⚠️ Runtime error')
          } else {
            toast.error(`Submission failed: ${result.status}`)
          }
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          toast.error('Submission evaluation timed out')
        }
      } catch (err) {
        clearInterval(pollInterval)
        console.error('Polling error:', err)
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
