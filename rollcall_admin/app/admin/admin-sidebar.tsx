"use client"

import { LayoutDashboard, Users, DoorOpen, BookOpen, Radio } from "lucide-react"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { signOutAction } from "@/app/admin/actions"

const nav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { title: "Beacons", href: "/admin/beacons", icon: Radio },
]

export function AdminSidebar({ email }: { email?: string | null }) {
  return <AppSidebar nav={nav} email={email} onSignOut={signOutAction} />
}
