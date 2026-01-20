import type { 
  DashboardStats, 
  Problem, 
  PerformanceData, 
  StreakData, 
  RecentSubmission 
} from '../types/dashboard'

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  totalProblems: 2847,
  solvedProblems: 145,
  attemptedProblems: 23,
  currentStreak: 12,
  longestStreak: 28,
  acceptanceRate: 73.2,
  contestRating: 1842,
  aiAnalysisScore: 87,
  rankPosition: 15432
}

// Mock problems data
export const mockProblems: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    status: "solved",
    acceptance: "49.2%",
    tags: ["Array", "Hash Table"],
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companies: ["Google", "Amazon", "Microsoft"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:22:00Z"
  },
  {
    id: 2,
    title: "Add Two Numbers",
    difficulty: "Medium",
    category: "Linked List",
    status: "attempted",
    acceptance: "38.1%",
    tags: ["Linked List", "Math", "Recursion"],
    description: "You are given two non-empty linked lists representing two non-negative integers.",
    timeComplexity: "O(max(m,n))",
    spaceComplexity: "O(max(m,n))",
    companies: ["Microsoft", "Amazon", "Apple"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-19T09:15:00Z"
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "String",
    status: "unsolved",
    acceptance: "33.8%",
    tags: ["Hash Table", "String", "Sliding Window"],
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m,n))",
    companies: ["Amazon", "Google", "Facebook"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: "Array",
    status: "unsolved",
    acceptance: "35.2%",
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    timeComplexity: "O(log(min(m,n)))",
    spaceComplexity: "O(1)",
    companies: ["Google", "Adobe", "Apple"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 5,
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    category: "String",
    status: "solved",
    acceptance: "32.1%",
    tags: ["String", "Dynamic Programming"],
    description: "Given a string s, return the longest palindromic substring in s.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    companies: ["Microsoft", "Amazon", "Google"],
    createdAt: "2024-01-14T16:20:00Z",
    updatedAt: "2024-01-18T11:45:00Z"
  }
]

// Generate more mock problems programmatically
const additionalProblems: Problem[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 6,
  title: `Problem ${index + 6}`,
  difficulty: ["Easy", "Medium", "Hard"][index % 3] as "Easy" | "Medium" | "Hard",
  category: ["Array", "String", "Linked List", "Tree", "Graph", "Dynamic Programming"][index % 6],
  status: ["solved", "attempted", "unsolved"][index % 3] as "solved" | "attempted" | "unsolved",
  acceptance: `${Math.floor(Math.random() * 50) + 20}.${Math.floor(Math.random() * 10)}%`,
  tags: ["Algorithm", "Data Structure", "Math"],
  description: `This is a sample problem description for problem ${index + 6}.`,
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  companies: ["Google", "Amazon", "Microsoft"].slice(0, Math.floor(Math.random() * 3) + 1),
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
}))

export const allMockProblems = [...mockProblems, ...additionalProblems]

// Mock performance data
export const mockPerformanceData: PerformanceData = {
  weeklyStats: [
    { week: "Week 1", problemsSolved: 12, easyCount: 8, mediumCount: 3, hardCount: 1 },
    { week: "Week 2", problemsSolved: 15, easyCount: 6, mediumCount: 7, hardCount: 2 },
    { week: "Week 3", problemsSolved: 18, easyCount: 5, mediumCount: 9, hardCount: 4 },
    { week: "Week 4", problemsSolved: 10, easyCount: 4, mediumCount: 4, hardCount: 2 }
  ],
  monthlyStats: [
    { month: "Jan", problemsSolved: 45, easyCount: 20, mediumCount: 18, hardCount: 7 },
    { month: "Dec", problemsSolved: 52, easyCount: 18, mediumCount: 24, hardCount: 10 },
    { month: "Nov", problemsSolved: 38, easyCount: 15, mediumCount: 15, hardCount: 8 },
    { month: "Oct", problemsSolved: 41, easyCount: 12, mediumCount: 20, hardCount: 9 }
  ],
  topicProgress: [
    { topic: "Arrays", solved: 25, total: 45, percentage: 56 },
    { topic: "Strings", solved: 18, total: 32, percentage: 56 },
    { topic: "Linked Lists", solved: 12, total: 18, percentage: 67 },
    { topic: "Trees", solved: 8, total: 22, percentage: 36 },
    { topic: "Dynamic Programming", solved: 5, total: 28, percentage: 18 },
    { topic: "Graphs", solved: 3, total: 15, percentage: 20 }
  ]
}

// Mock streak data
export const mockStreakData: StreakData = {
  currentStreak: 12,
  longestStreak: 28,
  streakHistory: Array.from({ length: 365 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - index)
    const problemsSolved = Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : 0
    return {
      date: date.toISOString().split('T')[0],
      problemsSolved,
      difficulty: {
        Easy: Math.floor(problemsSolved * 0.5),
        Medium: Math.floor(problemsSolved * 0.3),
        Hard: Math.floor(problemsSolved * 0.2)
      }
    }
  }).reverse()
}

// Mock recent submissions
export const mockRecentSubmissions: RecentSubmission[] = [
  {
    id: 1,
    problemId: 1,
    problemTitle: "Two Sum",
    status: "Accepted",
    language: "JavaScript",
    runtime: "68ms",
    memory: "44.8MB",
    submittedAt: "2024-01-20T10:30:00Z"
  },
  {
    id: 2,
    problemId: 5,
    problemTitle: "Longest Palindromic Substring",
    status: "Accepted",
    language: "Python",
    runtime: "156ms",
    memory: "15.2MB",
    submittedAt: "2024-01-20T08:15:00Z"
  },
  {
    id: 3,
    problemId: 2,
    problemTitle: "Add Two Numbers",
    status: "Wrong Answer",
    language: "Java",
    runtime: "N/A",
    memory: "N/A",
    submittedAt: "2024-01-19T16:45:00Z"
  },
  {
    id: 4,
    problemId: 3,
    problemTitle: "Longest Substring Without Repeating Characters",
    status: "Time Limit Exceeded",
    language: "C++",
    runtime: "N/A",
    memory: "N/A",
    submittedAt: "2024-01-19T14:22:00Z"
  }
]
