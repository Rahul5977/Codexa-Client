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
import { ChevronDown, Eye, Flame, Search, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authService, type UsersListFilters, type UsersListItem } from "@/api/services/auth"
import { useToast } from "@/hooks/use-toast"

export function DataTable() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [users, setUsers] = useState<UsersListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

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

  const columns = useMemo<ColumnDef<UsersListItem>[]>(
    () => [
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
        ),
      },
    ],
    [navigate, togglingUserId],
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
