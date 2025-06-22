"use client"

import * as React from "react"
import {
  IconScale,
  IconUser,
  IconDatabase,
  IconFileWord,
  IconUsersGroup,
  IconHelp,
  IconChartBar,
  IconReport,
  IconSearch,
  IconSettings,
  IconHome2,
  IconNumber123,
  IconChecklist,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import { useSession } from "next-auth/react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconHome2,
    },
    {
      title: "Marks",
      url: "/dashboard/marks",
      icon: IconNumber123,
    },
    {
      title: "Jury",
      url: "/dashboard/jury",
      icon: IconScale,
    },
    {
      title: "Teams",
      url: "/dashboard/teams",
      icon: IconUsersGroup,
    },
    {
      title: "Participants",
      url: "/dashboard/participants",
      icon: IconUser,
    },
    {
      title: "Sessions",
      url: "/dashboard/session",
      icon: IconChecklist,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconChartBar className="!size-8" />
                <span className="font-semibold text-3xl">EvalEase</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-5">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
            name: session?.user.name || "Admin User",
            email: session?.user.email || "m@example.com",
            avatar: "/avatars/shadcn.jpg"}} />
      </SidebarFooter>
    </Sidebar>
  )
}
