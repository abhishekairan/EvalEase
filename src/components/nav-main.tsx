"use client"

import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col ">
        <SidebarMenu className="gap-5">
          {items.map((item) => (
            <a href={item.url}>
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                <span className="h-4">{item.icon && <item.icon />}</span>
                <span className="text-lg">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            </a>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
