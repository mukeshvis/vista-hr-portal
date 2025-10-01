"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Menu,
  X
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
  { name: "Employees", href: "/employees", icon: Users, color: "text-green-500" },
  { name: "Attendance", href: "/attendance", icon: Clock, color: "text-orange-500" },
  { name: "Working Hours", href: "/working-hours", icon: Clock, color: "text-orange-600" },
  { name: "Payroll", href: "/payroll", icon: DollarSign, color: "text-emerald-500" },
  { name: "Leaves", href: "/leaves", icon: Calendar, color: "text-purple-500" },
  { name: "Reports", href: "/reports", icon: FileText, color: "text-red-500" },
  { name: "Settings", href: "/settings", icon: Settings, color: "text-gray-500" },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0",
          className
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={cn("flex items-center space-x-2", isCollapsed && "lg:justify-center")}>
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">VIS</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-gray-900">VIS HR Portal</span>
            )}
          </div>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsCollapsed(true)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile menu button */}
      {isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-40 lg:hidden"
          onClick={() => setIsCollapsed(false)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}

export function MobileSidebarTrigger() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={() => {
        // This will be handled by the Sidebar component
      }}
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}