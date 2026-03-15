// Export all API services
export * from './auth'
export * from './assignment'
export * from './classroom'
export * from './dashboard'
export * from './submission'
export * from './analytics'
export {
	getAllProblems,
	getProblemById as getProblemByIdFromProblemService,
	createProblem,
	updateProblem,
	deleteProblem,
} from './problem'