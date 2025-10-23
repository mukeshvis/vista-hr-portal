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
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

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
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check URL parameters
  const searchParams = useSearchParams()
  const viewPersonal = searchParams.get('view') === 'personal'

  // Don't render navigation until session is fully loaded
  if (!session || !session.user) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="flex-1"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Check if user is admin
  const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'

  // Determine which menu to show: if admin viewing personal, show employee menu
  const showEmployeeMenu = !isAdmin || viewPersonal

  // Get menu items based on actual view (employee menu if viewing personal)
  const menuItems = getMenuItems(!showEmployeeMenu)

  // Filter menu items based on user level
  const visibleMenuItems = menuItems.filter(item => {
    // Hide admin-only items from employees or when admin viewing personal
    if (item.adminOnly && showEmployeeMenu) {
      return false
    }
    // Hide employee-only items from admins (when not viewing personal)
    if ((item as any).employeeOnly && !showEmployeeMenu) {
      return false
    }
    return true
  })

  return (
    <header className="bg-background border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Title */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-lg md:text-xl font-bold text-black">
              VIS HR Portal
            </Link>
          </div>

          {/* Center: Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {visibleMenuItems.map((item) => {
              const href = viewPersonal && isAdmin ? `${item.href}?view=personal` : item.href
              return (
                <Link
                  key={item.href}
                  href={href}
                  className="flex items-center gap-2 text-sm text-black hover:text-gray-600 transition-colors"
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: User Profile & Hamburger */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Profile Dropdown - Hidden on small mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex items-center gap-2 px-2 md:px-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">
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

            {/* Sign Out Button - Hidden on mobile */}
            <div className="hidden md:block">
              <SignOutButton />
            </div>

            {/* Mobile Hamburger Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {visibleMenuItems.map((item) => {
              const href = viewPersonal && isAdmin ? `${item.href}?view=personal` : item.href
              return (
                <Link
                  key={item.href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3 text-base text-black hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  {item.label}
                </Link>
              )
            })}

            {/* Mobile User Info and Sign Out */}
            <div className="border-t border-gray-100 mt-4 pt-4 px-4 space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">
                    {session?.user?.name || session?.user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{session?.user?.email || ""}</p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}