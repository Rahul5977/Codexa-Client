"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Eye, Flame, Plus, Search, Star, Play, Trash2, History } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authService, type UsersListFilters, type UsersListItem } from "@/api/services/auth"
import { communityService, type CommunityMyRoom, type UserContestHistory } from "@/api/services/community"
import { getAllProblems, type Problem } from "@/api/services/problem"
import { useToast } from "@/hooks/use-toast"

export function DataTable() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [users, setUsers] = useState<UsersListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set())
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [setupRoomId, setSetupRoomId] = useState<string | null>(null)
  const [setupJoinLink, setSetupJoinLink] = useState<string>("")
  const [setupRoomName, setSetupRoomName] = useState<string>("")
  const [setupAllowLateJoin, setSetupAllowLateJoin] = useState(true)
  const [setupContestDuration, setSetupContestDuration] = useState<string>("none")
  const [setupRoomProblems, setSetupRoomProblems] = useState<Array<{ problemId: string; title: string; difficulty: string }>>([])
  const [allProblems, setAllProblems] = useState<Problem[]>([])
  const [selectedProblemId, setSelectedProblemId] = useState<string>("")
  const [setupLoading, setSetupLoading] = useState(false)
  const [savingSetupSettings, setSavingSetupSettings] = useState(false)
  const [addingProblem, setAddingProblem] = useState(false)
  const [removingProblemId, setRemovingProblemId] = useState<string | null>(null)
  const [activeContestRoomId, setActiveContestRoomId] = useState<string | null>(null)
  const [resumingContest, setResumingContest] = useState(false)

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyUserName, setHistoryUserName] = useState<string | null>(null)
  const [userContestHistory, setUserContestHistory] = useState<UserContestHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UsersListFilters["role"]>("all")
  const [friendFilter, setFriendFilter] = useState<UsersListFilters["friend"]>("all")
  const [streakFilter, setStreakFilter] = useState<string>("all")

  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const filters: UsersListFilters = {
        search: debouncedSearch,
        role: roleFilter,
        friend: friendFilter,
        minStreak: streakFilter === "all" ? undefined : Number(streakFilter),
      }
      const data = await authService.listUsers(filters)
      setUsers(data)
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch, roleFilter, friendFilter, streakFilter])

  const findRunningContestRoom = (rooms: CommunityMyRoom[]) => {
    const now = Date.now()
    return rooms.find((room) => {
      if (room.contest.status !== "ACTIVE") return false
      if (!room.contest.endedAt) return true
      return new Date(room.contest.endedAt).getTime() > now
    })
  }

  const fetchActiveContest = async () => {
    try {
      const rooms = await communityService.getMyRooms()
      const runningRoom = findRunningContestRoom(rooms)
      setActiveContestRoomId(runningRoom?.id || null)
    } catch {
      setActiveContestRoomId(null)
    }
  }

  useEffect(() => {
    fetchActiveContest()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchActiveContest()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const handleToggleFriend = async (event: React.MouseEvent, userId: string) => {
    event.stopPropagation()
    try {
      setTogglingUserId(userId)
      const result = await authService.toggleFriend(userId)
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isFriend: result.isFriend } : user,
        ),
      )
      if (!result.isFriend) {
        setSelectedFriendIds((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    } catch (error: any) {
      toast({
        title: "Friend action failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const toggleSelectedFriend = (userId: string, checked: boolean) => {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }

  const handleCreateCommunityRoom = async () => {
    if (selectedFriendIds.size === 0) {
      toast({
        title: "No friends selected",
        description: "Select at least one friend to create a community room",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingRoom(true)
      const room = await communityService.createRoom({
        invitedFriendIds: Array.from(selectedFriendIds),
      })

      setSetupRoomId(room.id)
      setSetupJoinLink(room.joinLink || "")
      setRoomDialogOpen(true)
      setSelectedFriendIds(new Set())

      setSetupLoading(true)
      const [roomData, problemsData] = await Promise.all([
        communityService.getRoomById(room.id),
        getAllProblems(),
      ])

      setSetupRoomName(roomData.name)
      setSetupAllowLateJoin(roomData.allowLateJoin)
      setSetupContestDuration(roomData.contest.durationMinutes ? String(roomData.contest.durationMinutes) : "none")
      setSetupRoomProblems(
        roomData.problems.map((problem) => ({
          problemId: problem.problemId,
          title: problem.title,
          difficulty: problem.difficulty,
        })),
      )
      setAllProblems(problemsData)

      toast({
        title: "Room created",
        description: "Configure room settings, add problems, and start the contest.",
      })
      await fetchActiveContest()
    } catch (error: any) {
      toast({
        title: "Failed to create room",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setSetupLoading(false)
      setCreatingRoom(false)
    }
  }

  const refreshSetupRoom = async () => {
    if (!setupRoomId) return

    const roomData = await communityService.getRoomById(setupRoomId)
    setSetupRoomName(roomData.name)
    setSetupAllowLateJoin(roomData.allowLateJoin)
    setSetupContestDuration(roomData.contest.durationMinutes ? String(roomData.contest.durationMinutes) : "none")
    setSetupRoomProblems(
      roomData.problems.map((problem) => ({
        problemId: problem.problemId,
        title: problem.title,
        difficulty: problem.difficulty,
      })),
    )
    setSetupJoinLink(roomData.joinLink || "")
  }

  const handleSaveSetupSettings = async () => {
    if (!setupRoomId) return

    try {
      setSavingSetupSettings(true)
      await communityService.updateRoomSettings(setupRoomId, {
        name: setupRoomName,
        allowLateJoin: setupAllowLateJoin,
        contestDurationMinutes: setupContestDuration === "none" ? null : Number(setupContestDuration),
      })
      await refreshSetupRoom()
      toast({ title: "Room settings updated" })
    } catch (error: any) {
      toast({
        title: "Failed to update settings",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setSavingSetupSettings(false)
    }
  }

  const handleAddProblem = async () => {
    if (!setupRoomId || !selectedProblemId) return

    try {
      setAddingProblem(true)
      await communityService.addProblems(setupRoomId, [selectedProblemId])
      setSelectedProblemId("")
      await refreshSetupRoom()
      toast({ title: "Problem added" })
    } catch (error: any) {
      toast({
        title: "Failed to add problem",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setAddingProblem(false)
    }
  }

  const handleCopyJoinLink = async () => {
    if (!setupJoinLink) return

    try {
      await navigator.clipboard.writeText(setupJoinLink)
      toast({ title: "Join link copied" })
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      })
    }
  }

  const handleRemoveProblem = async (problemId: string) => {
    if (!setupRoomId) return

    try {
      setRemovingProblemId(problemId)
      await communityService.removeProblems(setupRoomId, [problemId])
      await refreshSetupRoom()
      toast({ title: "Problem removed" })
    } catch (error: any) {
      toast({
        title: "Failed to remove problem",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setRemovingProblemId(null)
    }
  }

  const handleResumeContest = async () => {
    try {
      setResumingContest(true)
      const rooms = await communityService.getMyRooms()
      const activeRoom = findRunningContestRoom(rooms)

      if (!activeRoom) {
        setActiveContestRoomId(null)
        toast({
          title: "No active contest",
          description: "You are not in any active contest right now.",
          variant: "destructive",
        })
        return
      }

      setActiveContestRoomId(activeRoom.id)
      navigate(`/community/rooms/${activeRoom.id}`)
    } catch (error: any) {
      toast({
        title: "Failed to resume contest",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setResumingContest(false)
    }
  }

  const handleOpenHistory = async (userId: string, userName: string) => {
    try {
      setHistoryUserName(userName)
      setLoadingHistory(true)
      const history = await communityService.getUserContestHistory(userId)
      setUserContestHistory(history)
      setHistoryDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Failed to load contest history",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const selectedRoomProblemIds = useMemo(
    () => new Set(setupRoomProblems.map((problem) => problem.problemId)),
    [setupRoomProblems],
  )

  const columns = useMemo<ColumnDef<UsersListItem>[]>(
    () => [
      {
        id: "invite",
        header: "Invite",
        cell: ({ row }) => {
          const user = row.original
          if (user.isSelf || !user.isFriend) {
            return <span className="text-xs text-muted-foreground">-</span>
          }

          return (
            <Checkbox
              checked={selectedFriendIds.has(user.id)}
              onCheckedChange={(checked) => toggleSelectedFriend(user.id, checked === true)}
              onClick={(event) => event.stopPropagation()}
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image_url} />
                <AvatarFallback className="text-xs font-medium">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-sm text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
          )
        },
      },
      {
        id: "difficulty",
        header: "Solved (E/M/H)",
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-1 text-xs">
              <Badge className="text-green-600 bg-green-100 dark:bg-green-900/30">{user.easySolved}</Badge>
              <Badge className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30">{user.mediumSolved}</Badge>
              <Badge className="text-red-600 bg-red-100 dark:bg-red-900/30">{user.hardSolved}</Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "totalSolved",
        header: "Total",
        cell: ({ row }) => <span className="font-semibold">{row.original.totalSolved}</span>,
      },
      {
        accessorKey: "streakCurrent",
        header: "Streak",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            {row.original.streakCurrent}
          </span>
        ),
      },
      {
        id: "friend",
        header: "Friend",
        cell: ({ row }) => {
          const user = row.original
          if (user.isSelf) return <span className="text-xs text-muted-foreground">You</span>
          return (
            <Button
              size="icon"
              variant={user.isFriend ? "default" : "outline"}
              className="h-8 w-8"
              disabled={togglingUserId === user.id}
              onClick={(event) => handleToggleFriend(event, user.id)}
            >
              <Star className={`h-4 w-4 ${user.isFriend ? "fill-current" : ""}`} />
            </Button>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation()
                handleOpenHistory(row.original.id, row.original.name)
              }}
              title="Contest History"
            >
              <History className="size-4" />
              <span className="sr-only">Contest history</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/users/${row.original.id}`)
              }}
            >
              <Eye className="size-4" />
              <span className="sr-only">View profile</span>
            </Button>
          </div>
        ),
      },
    ],
    [navigate, selectedFriendIds, togglingUserId, handleOpenHistory],
  )

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  })

  return (
    <div className="w-full space-y-4">
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Community Room Setup</DialogTitle>
            <DialogDescription>
              Configure settings, share invite link, and manage problems.
            </DialogDescription>
          </DialogHeader>

          {setupLoading ? (
            <p className="text-sm text-muted-foreground">Loading room setup...</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Join Link</Label>
                <div className="flex gap-2">
                  <Input value={setupJoinLink} readOnly />
                  <Button type="button" variant="outline" onClick={handleCopyJoinLink} disabled={!setupJoinLink}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Room Settings</p>
                <div className="space-y-2">
                  <Label htmlFor="setupRoomName">Room Name</Label>
                  <Input
                    id="setupRoomName"
                    value={setupRoomName}
                    onChange={(event) => setSetupRoomName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contest Duration</Label>
                  <Select value={setupContestDuration} onValueChange={setSetupContestDuration}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (manual end)</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Allow Late Join</p>
                    <p className="text-xs text-muted-foreground">Disable to lock new users out after sharing invite.</p>
                  </div>
                  <Switch checked={setupAllowLateJoin} onCheckedChange={setSetupAllowLateJoin} />
                </div>

                <Button type="button" onClick={handleSaveSetupSettings} disabled={savingSetupSettings}>
                  Save Settings
                </Button>
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Problem Selection</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={selectedProblemId} onValueChange={setSelectedProblemId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a problem" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProblems
                        .filter((problem) => !selectedRoomProblemIds.has(problem.id))
                        .map((problem) => (
                          <SelectItem key={problem.id} value={problem.id}>
                            {problem.title} ({problem.difficulty})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddProblem} disabled={!selectedProblemId || addingProblem}>
                    Add Problem
                  </Button>
                </div>

                <div className="space-y-2">
                  {setupRoomProblems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No problems selected yet.</p>
                  ) : (
                    setupRoomProblems.map((problem) => (
                      <div key={problem.problemId} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span className="truncate">{problem.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{problem.difficulty}</Badge>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleRemoveProblem(problem.problemId)}
                            disabled={removingProblemId === problem.problemId}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove problem</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setupRoomId && navigate(`/community/rooms/${setupRoomId}`)}
              disabled={!setupRoomId}
            >
              View Lobby
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contest History - {historyUserName}</DialogTitle>
            <DialogDescription>
              Completed contests and analysis
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading contest history...</p>
          ) : userContestHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed contests yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userContestHistory.map((contest) => (
                <div
                  key={contest.id}
                  className="flex items-center justify-between rounded-md border border-primary/20 bg-card/50 p-3 hover:bg-card/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contest.name}</p>
                    {contest.contest.endedAt && (
                      <p className="text-xs text-muted-foreground">
                        Ended {new Date(contest.contest.endedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setHistoryDialogOpen(false)
                      navigate(`/community/rooms/${contest.id}`)
                    }}
                  >
                    View Analysis
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {activeContestRoomId && (
          <Button
            onClick={handleResumeContest}
            disabled={resumingContest}
            variant="outline"
            className="sm:w-auto"
          >
            <Play className="mr-2 size-4" />
            Resume Contest
          </Button>
        )}
        <Button
          onClick={handleCreateCommunityRoom}
          disabled={creatingRoom || selectedFriendIds.size === 0}
          className="sm:w-auto"
        >
          <Plus className="mr-2 size-4" />
          Create Room ({selectedFriendIds.size})
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4 sm:gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Role</Label>
          <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value as any)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="TEACHER">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Friendship</Label>
          <Select value={friendFilter || "all"} onValueChange={(value) => setFriendFilter(value as any)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select Friendship" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Friends</SelectItem>
              <SelectItem value="false">Not Friends</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Min Streak</Label>
          <Select value={streakFilter} onValueChange={setStreakFilter}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select Streak" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
              <SelectItem value="30">30+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Column Visibility</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                Columns <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-default"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block" />
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 hidden sm:flex">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
