"use client"

import {
  LogOut,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

import { Logo } from "@/components/logo"
import { Button } from "./ui/button"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    image_url: string
  }
}) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/auth/sign-in")
  }

  return (
    <div>
      <Link to="/settings/profile" className="flex items-center gap-2">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
          {user.image_url ? <img src={user.image_url} alt={user.name} className="h-8 w-8 rounded-full" /> : <Logo size={28} />}
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{user.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {user.email}
          </span>
        </div>
      </Link>
      <Button onClick={handleLogout} variant={'destructive'} className="mt-2 w-full cursor-pointer">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
          < LogOut />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Logout</span>
        </div>
      </Button>
    </div>
  )
}
