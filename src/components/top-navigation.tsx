"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton } from "@/components/sign-out-button"
import {
  User,
  ChevronDown,
  LayoutDashboard,
  Users,
  Clock,
  CreditCard,
  Calendar,
  FileText,
  Settings,
} from "lucide-react"
import Link from "next/link"

interface TopNavigationProps {
  session: {
    user?: {
      name?: string | null
      username?: string | null
      email?: string | null
      user_level?: number | string
    }
  } | null
}

const getMenuItems = (isAdmin: boolean) => [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500", adminOnly: false },
  { label: "Employees", href: "/employees", icon: Users, color: "text-green-500", adminOnly: true },
  { label: isAdmin ? "Attendance" : "My Attendance", href: "/attendance", icon: Clock, color: "text-orange-500", adminOnly: false },
  { label: "Payroll", href: "/payroll", icon: CreditCard, color: "text-emerald-500", adminOnly: true },
  { label: isAdmin ? "Leaves" : "My Leaves", href: "/leaves", icon: Calendar, color: "text-purple-500", adminOnly: false },
  { label: "My Information", href: "/my-information", icon: User, color: "text-blue-600", adminOnly: false, employeeOnly: true },
  { label: "Reports", href: "/reports", icon: FileText, color: "text-red-500", adminOnly: true },
  { label: "Portal System", href: "/portal-system", icon: Settings, color: "text-indigo-500", adminOnly: true },
]

export function TopNavigation({ session }: TopNavigationProps) {
  // Check if user is admin
  const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'

  // Get menu items based on user level
  const menuItems = getMenuItems(isAdmin)

  // Filter menu items based on user level
  const visibleMenuItems = menuItems.filter(item => {
    // Hide admin-only items from employees
    if (item.adminOnly && !isAdmin) {
      return false
    }
    // Hide employee-only items from admins
    if ((item as any).employeeOnly && isAdmin) {
      return false
    }
    return true
  })

  return (
    <header className="bg-background border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Title */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-black">
              VIS HR Portal
            </Link>
          </div>

          {/* Center: Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {visibleMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-600 transition-colors"
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {session?.user?.name || session?.user?.username || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard?view=personal" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Button */}
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}