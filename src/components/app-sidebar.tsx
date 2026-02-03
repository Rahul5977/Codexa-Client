"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  AlertTriangle,
  Settings,
  HelpCircle,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Role-based dashboard config
  const dashboardRole = user?.role === "ADMIN" ? "admin" : "user"

  const data = {
    navGroups: [
      {
        label: "Dashboard",
        items: [
          {
            title: "Dashboard",
            url: `/${dashboardRole}/dashboard`,
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "Apps",
        items: [
          {
            title: "Mail",
            url: "/mail",
            icon: Mail,
          },
          {
            title: "Tasks",
            url: "/tasks",
            icon: CheckSquare,
          },
          {
            title: "Chat",
            url: "/chat",
            icon: MessageCircle,
          },
          {
            title: "Calendar",
            url: "/calendar",
            icon: Calendar,
          },
          {
            title: "Users",
            url: "/users",
            icon: Users,
          },
        ],
      },
      {
        label: "Pages",
        items: [
          {
            title: "Errors",
            url: "#",
            icon: AlertTriangle,
            items: [
              {
                title: "Unauthorized",
                url: "/errors/unauthorized",
              },
              {
                title: "Forbidden",
                url: "/errors/forbidden",
              },
              {
                title: "Not Found",
                url: "/errors/not-found",
              },
              {
                title: "Internal Server Error",
                url: "/errors/internal-server-error",
              },
              {
                title: "Under Maintenance",
                url: "/errors/under-maintenance",
              },
            ],
          },
          {
            title: "Settings",
            url: "#",
            icon: Settings,
            items: [
              {
                title: "Profile",
                url: "/settings/profile",
              },
              {
                title: "Appearance",
                url: "/settings/appearance",
              },
              {
                title: "Connections",
                url: "/settings/connections",
              },
            ],
          },
          {
            title: "FAQs",
            url: "/faqs",
            icon: HelpCircle,
          },
        ],
      },
    ],
  }

  const userData = user ? {
    name: user.name,
    email: user.email,
    image_url: user.image_url || "",
  } : {
    name: "Codexa",
    email: "contact@codexa.com",
    image_url: ""
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={`/${dashboardRole}/dashboard`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Codexa</span>
                  <span className="truncate text-xs">AI powered coding platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarNotification /> */}
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
