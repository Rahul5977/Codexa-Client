// Export all API hooks
export {
	useDashboardStats,
	usePerformanceData,
	useStreakData,
	useRecentSubmissions,
	useProblems as useDashboardProblems,
	useProblem as useDashboardProblem,
} from './use-dashboard'
export {
	useProblems as useProblemCatalog,
	useProblem as useProblemDetail,
	useProblemMutations,
} from './use-problems'
export * from './use-submissions'
