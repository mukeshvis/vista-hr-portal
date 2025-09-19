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
} from "lucide-react"
import Link from "next/link"

interface TopNavigationProps {
  session: any
}

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Payroll", href: "/payroll", icon: CreditCard },
  { label: "Leaves", href: "/leaves", icon: Calendar },
  { label: "Reports", href: "/reports", icon: FileText },
]

export function TopNavigation({ session }: TopNavigationProps) {
  return (
    <header className="bg-background border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Title */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-black">
              Vista HR Portal
            </Link>
          </div>

          {/* Center: Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-600 transition-colors"
              >
                <item.icon className="h-4 w-4" />
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
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
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