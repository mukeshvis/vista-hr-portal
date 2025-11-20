"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopNavigation } from "@/components/top-navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  UserCheck,
  UserX,
  CalendarDays,
  Banknote,
  ArrowLeft
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Interfaces for Add Employee functionality
interface NewEmployee {
  empId: string
  name: string
  email: string
  phone: string
  designation: string
  grade: string
  workingHoursPolicy: string
  reportingManager: string
  leavePolicy: string
  department: string
  joiningDate: string
  salary: number | string
  status: string
  gender: string
  address: string
  permanentAddress: string
  maritalStatus: string
  nationality: string
  cnic: string
  cnicExpiryDate: string
  probationExpireDate: string
  dateOfLeaving: string
  bankAccount: string
  accountTitle: string
  fatherName: string
  dateOfBirth: string
  dayOff: string
  professionalEmail: string
  branch: string
  username: string
}

interface DesignationOption {
  value: string
  label: string
}

interface EmployeeOption {
  value: string
  label: string
}

// Constants for Add Employee form
const gradeOptions = [
  '32', '33', '4', '44', '77', 'abc intern', 'CL-1', 'CLE-I', 'CLE-II', 'CLE-III', 'CLE-IV',
  'ENG 1', 'ENG 2', 'ENG 3', 'ENG II', 'ENG III', 'ENG-11', 'ENG-111', 'ENG-I', 'ENG-II',
  'ENG-III', 'ENG-IV', 'ENG-V', 'Eng-v', 'EX III', 'EX IV', 'EX-1', 'EX-I', 'EX-II', 'EX-III',
  'EX-IV', 'EX-V', 'EXG II', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'Grade Scale', 'Non',
  'President & CEO'
]

const workingHoursPolicyOptions = [
  { value: '1', label: 'Operations Division (G2 to G4)' },
  { value: '2', label: 'Operations Division (G2 to G4) --2' },
  { value: '3', label: 'Rating Division (G3 to G5)' },
  { value: '4', label: 'All Division (G6)' },
  { value: '5', label: 'All Division (G7)' }
]

const departmentOptions = [
  'Rating Division',
  'Operation Division',
  'Finance & Accounts',
  'Compliance',
  'Management Information System / Information Technology',
  'General Department',
  'VITAL',
  'Pak Ujala',
  'News VIS'
]

const leavePolicyOptions = [
  'Annual & Emergency',
  'Annual, Emergency and sick customized 14.5 days',
  'Annual, Emergency and sick 15 days',
  'Annual, emergency and sick half yearly',
  'July-2022 to June-2023',
  'July-2023 to June-2024',
  'July-2024 to June-2025',
  'July-2025 to June-2026'
]

// Counter Animation Hook
function useCountUp(end: number, duration: number = 1000, shouldStart: boolean = true) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!shouldStart || hasAnimated) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(easeOutQuart * end)

      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(end)
        setHasAnimated(true)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration, shouldStart, hasAnimated])

  return count
}

// Skeleton Loader for Stats Card
function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 pt-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" /> {/* Title */}
            <Skeleton className="h-9 w-20" /> {/* Value */}
            <Skeleton className="h-3 w-32" /> {/* Subtitle */}
            <Skeleton className="h-3 w-28" /> {/* Description */}
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" /> {/* Icon */}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton Loader for Secondary Metric Card
function SecondaryMetricSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" /> {/* Icon */}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" /> {/* Label */}
          <Skeleton className="h-5 w-12" /> {/* Value */}
        </div>
      </div>
    </Card>
  )
}

// Skeleton Loader for Quick Actions / Today's Overview / Pending Items
function SectionCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" /> {/* Icon */}
          <Skeleton className="h-5 w-32" /> {/* Title */}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" /> {/* Content 1 */}
        <Skeleton className="h-20 w-full rounded-lg" /> {/* Content 2 */}
        <Skeleton className="h-20 w-full rounded-lg" /> {/* Content 3 */}
      </CardContent>
    </Card>
  )
}

// Skeleton Loader for Recent Activities
function RecentActivitiesSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" /> {/* Icon */}
          <Skeleton className="h-6 w-40" /> {/* Title */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 pb-3">
            <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" /> {/* Activity text */}
              <Skeleton className="h-3 w-1/4" /> {/* Timestamp */}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Enhanced Stats Card Component with Colorful Icons
function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  description,
  urgent = false,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100"
}: {
  title: string
  value: string | number
  icon: any
  trend?: string
  trendUp?: boolean
  description?: string
  urgent?: boolean
  iconColor?: string
  iconBgColor?: string
}) {
  return (
    <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm">
      <CardContent className="p-8 pt-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-slate-600">{title}</p>
              {urgent && <Badge variant="destructive" className="text-xs animate-pulse">Urgent</Badge>}
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`h-3 w-3 ${trendUp ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {trend}
                </span>
              </div>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Component with Colorful Icons
function QuickActions({ onAddEmployee }: { onAddEmployee: () => void }) {
  const actions = [
    {
      label: "Add Employee",
      icon: Users,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      hoverBg: "hover:bg-emerald-100"
    },
    {
      label: "Mark Attendance",
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100"
    },
    {
      label: "Process Payroll",
      icon: DollarSign,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      hoverBg: "hover:bg-amber-100"
    },
    {
      label: "Approve Leaves",
      icon: Calendar,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      hoverBg: "hover:bg-rose-100"
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-center gap-3 ${action.bgColor} ${action.hoverBg} border border-slate-200 hover:border-slate-300 hover:scale-105 transition-all duration-200`}
              onClick={action.label === "Add Employee" ? onAddEmployee : undefined}
            >
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Today's Overview Component with Enhanced Icons
function TodaysOverview({ dashboardData }: { dashboardData: any }) {
  const totalEmployees = dashboardData.totalEmployees || 1 // Avoid division by zero

  const data = [
    {
      label: "On Time",
      value: dashboardData.presentToday,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
      percentage: `${((dashboardData.presentToday / totalEmployees) * 100).toFixed(1)}%`
    },
    {
      label: "Late Arrivals",
      value: dashboardData.lateToday,
      icon: AlertCircle,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-100",
      percentage: `${((dashboardData.lateToday / totalEmployees) * 100).toFixed(1)}%`
    },
    {
      label: "Absent",
      value: dashboardData.absent,
      icon: XCircle,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-100",
      percentage: `${((dashboardData.absent / totalEmployees) * 100).toFixed(1)}%`
    },
    {
      label: "On Leave",
      value: dashboardData.onLeave,
      icon: CalendarDays,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      percentage: `${((dashboardData.onLeave / totalEmployees) * 100).toFixed(1)}%`
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          Today&apos;s Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <p className="text-xs text-slate-500">{item.percentage}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Activities Component with Real-Time Data
function RecentActivities() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    setLoading(true)
    try {
      console.log('🔄 Fetching recent activities from API...')
      const response = await fetch('/api/dashboard/recent-activities')
      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Activities received:', data.length, 'items')
        console.log('📊 Activities data:', data)
        setActivities(data)
      } else {
        const error = await response.json()
        console.error('❌ API Error:', error)
      }
    } catch (error) {
      console.error('❌ Error fetching recent activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'Users': Users,
      'Calendar': Calendar,
      'Clock': Clock,
      'DollarSign': DollarSign,
      'CheckCircle': CheckCircle,
      'AlertCircle': AlertCircle
    }
    return iconMap[iconName] || AlertCircle
  }

  const getStatusStyles = (type: string) => {
    switch (type) {
      case 'success': return {
        bgColor: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        dotColor: 'bg-emerald-500'
      }
      case 'pending': return {
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
        dotColor: 'bg-amber-500'
      }
      case 'info': return {
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        dotColor: 'bg-blue-500'
      }
      default: return {
        bgColor: 'bg-slate-100',
        iconColor: 'text-slate-600',
        dotColor: 'bg-slate-500'
      }
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activities found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Activity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  const styles = getStatusStyles(activity.type)
                  const IconComponent = getIconComponent(activity.icon)
                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 ${styles.bgColor} rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`h-4 w-4 ${styles.iconColor}`} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-700">{activity.action}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">{activity.user}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-500">{activity.time}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${styles.bgColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${styles.dotColor}`}></div>
                          <span className={`text-xs font-medium ${styles.iconColor}`}>
                            {activity.type === 'success' ? 'Completed' : activity.type === 'pending' ? 'Pending' : 'Info'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Pending Items Component with Enhanced Icons
function PendingItems() {
  const pendingItems = [
    {
      type: "Leave Requests",
      count: 12,
      priority: "high",
      icon: Calendar,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-100"
    },
    {
      type: "Document Reviews",
      count: 8,
      priority: "medium",
      icon: AlertCircle,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      type: "Performance Reviews",
      count: 15,
      priority: "medium",
      icon: UserCheck,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      type: "Policy Approvals",
      count: 3,
      priority: "low",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ]

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return { variant: 'destructive' as const, className: 'animate-pulse' }
      case 'medium': return { variant: 'secondary' as const, className: '' }
      case 'low': return { variant: 'outline' as const, className: '' }
      default: return { variant: 'outline' as const, className: '' }
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          Pending Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingItems.map((item, index) => {
            const priorityStyles = getPriorityStyles(item.priority)
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{item.type}</span>
                    <Badge variant={priorityStyles.variant} className={`text-xs ml-2 ${priorityStyles.className}`}>
                      {item.priority}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.count}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Force dynamic rendering to prevent prerender errors with useSearchParams
export const dynamic = 'force-dynamic'

function DashboardPageContent() {
  // Session data
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()

  console.log('📊 [DASHBOARD] Component rendering. Status:', status, '| Session:', session ? {
    user: session.user?.username,
    user_level: session.user?.user_level,
    hasSession: true
  } : 'NO SESSION')

  // Add effect to track when session becomes available
  useEffect(() => {
    if (session) {
      console.log('✅ [DASHBOARD] Session loaded!', {
        user: session.user?.username,
        status: status
      })
    }
  }, [session, status])

  // Check if user wants personal view
  const viewPersonal = searchParams.get('view') === 'personal'

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    attendancePercentage: '0.0%',
    departments: 0,
    departmentsList: [],
    absent: 0,
    lateToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
    payrollAmount: 0
  })

  // Loading state for skeleton loaders
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Add Employee modal state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    empId: '',
    name: '',
    email: '',
    phone: '',
    designation: '',
    grade: '',
    workingHoursPolicy: '',
    reportingManager: '',
    leavePolicy: '',
    department: '',
    joiningDate: '',
    salary: '',
    status: 'Active',
    gender: 'Male',
    address: '',
    permanentAddress: '',
    maritalStatus: 'Single',
    nationality: '',
    cnic: '',
    cnicExpiryDate: '',
    probationExpireDate: '',
    dateOfLeaving: '',
    bankAccount: '',
    accountTitle: '',
    fatherName: '',
    dateOfBirth: '',
    dayOff: '',
    professionalEmail: '',
    branch: '',
    username: ''
  })

  // Employee Dashboard state (for user_level = 0)
  const [employeeData, setEmployeeData] = useState({
    leaveBalance: 0,
    totalAllocatedLeaves: 0,
    todayStatus: 'Absent',
    workingDays: 0,
    onTime: 0,
    lateArrivals: 0,
    attendanceDays: 0,
    absentDays: 0
  })
  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(true)
  const [employeeEmploymentStatus, setEmployeeEmploymentStatus] = useState<string>('')
  const [showBirthdayCard, setShowBirthdayCard] = useState(false)
  const [birthdayEmployees, setBirthdayEmployees] = useState<Array<{emp_id: string, name: string}>>([])
  const [isMyBirthday, setIsMyBirthday] = useState(false)

  // Fetch employee dashboard data
  const fetchEmployeeData = async () => {
    if (!session?.user?.emp_id) {
      console.log('⚠️ No emp_id found, setting loading to false')
      setIsLoadingEmployeeData(false)
      return
    }

    console.log('📊 Fetching employee dashboard data for:', session.user.emp_id)
    setIsLoadingEmployeeData(true)
    try {
      const empId = session.user.emp_id
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const currentDate = new Date().toISOString().split('T')[0]

      console.log('📅 Date range:', { currentYear, currentMonth })

      // Fetch employee employment status
      const employeeStatusRes = await fetch(`/api/employees/${empId}`)
      if (employeeStatusRes.ok) {
        const employeeInfo = await employeeStatusRes.json()
        setEmployeeEmploymentStatus(employeeInfo.employmentStatus || '')
        console.log('👤 Employee Employment Status:', employeeInfo.employmentStatus)
      }

      // Fetch leave balance
      const leaveBalanceRes = await fetch(`/api/leaves/balance?empId=${empId}&year=${currentYear}`)
      if (leaveBalanceRes.ok) {
        const leaveData = await leaveBalanceRes.json()
        const totalRemaining = leaveData.balance?.reduce((sum: number, item: any) => sum + item.remaining, 0) || 0
        const totalAllocated = leaveData.balance?.reduce((sum: number, item: any) => sum + item.allocated, 0) || 0
        console.log('📊 Leave Balance - Remaining:', totalRemaining, 'Allocated:', totalAllocated)
        setEmployeeData(prev => ({ ...prev, leaveBalance: totalRemaining, totalAllocatedLeaves: totalAllocated }))
      }

      // Fetch recent leave applications (last 5)
      const recentLeavesRes = await fetch(`/api/leaves/applications?empId=${empId}&year=${currentYear}`)
      if (recentLeavesRes.ok) {
        const allLeaves = await recentLeavesRes.json()
        setRecentLeaves(allLeaves.slice(0, 5))
      }

      // First, fetch external_employees to find user's pin_auto (multi-strategy matching)
      const employeesRes = await fetch('/api/attendance/employees')
      let userPinAuto = empId // Default to emp_id

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        const allEmployees = employeesData.data || []

        console.log('👥 Fetched employees:', allEmployees.length)

        // Try 4 matching strategies (same as attendance page)
        let userEmployee = allEmployees.find((emp: any) => emp.pin_auto === empId) // Strategy 1
        if (!userEmployee) {
          userEmployee = allEmployees.find((emp: any) => emp.pin_manual === empId) // Strategy 2
        }
        if (!userEmployee && session.user.username) {
          userEmployee = allEmployees.find((emp: any) =>
            emp.user_name?.toLowerCase() === session.user.username.toLowerCase()
          ) // Strategy 3
        }
        if (!userEmployee && session.user.name) {
          userEmployee = allEmployees.find((emp: any) =>
            emp.user_name?.toLowerCase() === session.user.name?.toLowerCase()
          ) // Strategy 4
        }

        if (userEmployee) {
          userPinAuto = userEmployee.pin_auto
          console.log('✅ Found user pin_auto:', userPinAuto, 'for emp_id:', empId)
        } else {
          console.warn('⚠️ Could not find matching employee in external_employees table')
        }
      }

      // Fetch attendance data for current month
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      // Get last day of current month (month + 1, day 0 = last day of current month)
      const lastDay = new Date(currentYear, currentMonth, 0).getDate()
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      console.log('📅 Fetching attendance from:', startDate, 'to:', endDate)
      console.log('📅 API format - start:', startDate.split('-').reverse().join('/'), 'end:', endDate.split('-').reverse().join('/'))

      const attendanceRes = await fetch('/api/attendance/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate.split('-').reverse().join('/'),
          end_date: endDate.split('-').reverse().join('/')
        })
      })

      console.log('📊 Attendance API response status:', attendanceRes.status)

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json()
        const logs = attendanceData.data || []

        console.log('📊 Total attendance logs:', logs.length)
        console.log('📊 First log sample:', logs[0])

        // Filter logs for current employee using user_id (not pin_auto!)
        const userLogs = logs.filter((log: any) => {
          return log.user_id === userPinAuto || log.pin_auto === userPinAuto
        })

        console.log('👤 Filtering with pin_auto:', userPinAuto)
        console.log('👤 User attendance logs:', userLogs.length)
        console.log('👤 Sample user log:', userLogs[0])

        // Extract unique dates from punch_time (format: '2025-10-01 07:10:00 AM')
        const uniqueDates = new Set(
          userLogs.map((log: any) => {
            if (log.punch_time) {
              return log.punch_time.split(' ')[0] // Extract date part
            }
            return null
          }).filter(Boolean)
        )

        console.log('📅 Total unique dates:', uniqueDates.size)
        console.log('📅 Unique dates:', Array.from(uniqueDates))

        // Calculate on-time and late arrivals (Monday-Friday only, 9AM-5:30PM working hours)
        let onTime = 0
        let lateArrivals = 0
        let attendanceDays = 0

        uniqueDates.forEach((dateStr: any) => {
          // Parse date (format: '2025-10-01')
          const dateParts = String(dateStr).split('-')
          const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
          const dayOfWeek = dateObj.getDay() // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

          // Skip weekends (only Monday-Friday count)
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log(`⏭️ Skipping weekend: ${dateStr} (${dayOfWeek === 0 ? 'Sunday' : 'Saturday'})`)
            return
          }

          // Get all logs for this date
          const dayLogs = userLogs.filter((log: any) => {
            const logDate = log.punch_time ? log.punch_time.split(' ')[0] : null
            return logDate === dateStr
          })

          // Check if user was present (has check-in record)
          const checkInLogs = dayLogs.filter((log: any) => log.state === 'Check In')
          const checkOutLogs = dayLogs.filter((log: any) => log.state === 'Check Out')

          if (checkInLogs.length > 0) {
            // User was present - count as attendance day
            attendanceDays++

            // Parse check-in time
            const firstCheckIn = checkInLogs[0]
            const checkInParts = firstCheckIn.punch_time.split(' ')
            const checkInTime = checkInParts[1] // '07:10:00'
            const checkInPeriod = checkInParts[2] // 'AM' or 'PM'

            let checkInHour = parseInt(checkInTime.split(':')[0])
            let checkInMinute = parseInt(checkInTime.split(':')[1])

            // Convert to 24-hour format
            if (checkInPeriod === 'PM' && checkInHour !== 12) {
              checkInHour += 12
            } else if (checkInPeriod === 'AM' && checkInHour === 12) {
              checkInHour = 0
            }

            const checkInMinutes = checkInHour * 60 + checkInMinute

            // Parse check-out time (if exists)
            let workingHours = 0
            let checkOutMinutes = 0

            if (checkOutLogs.length > 0) {
              const lastCheckOut = checkOutLogs[checkOutLogs.length - 1]
              const checkOutParts = lastCheckOut.punch_time.split(' ')
              const checkOutTime = checkOutParts[1]
              const checkOutPeriod = checkOutParts[2]

              let checkOutHour = parseInt(checkOutTime.split(':')[0])
              let checkOutMinute = parseInt(checkOutTime.split(':')[1])

              // Convert to 24-hour format
              if (checkOutPeriod === 'PM' && checkOutHour !== 12) {
                checkOutHour += 12
              } else if (checkOutPeriod === 'AM' && checkOutHour === 12) {
                checkOutHour = 0
              }

              checkOutMinutes = checkOutHour * 60 + checkOutMinute

              // Office hours: 9:00 AM to 5:30 PM
              const officeStartMinutes = 9 * 60 // 9:00 AM = 540 minutes
              const officeEndMinutes = 17 * 60 + 30 // 5:30 PM = 1050 minutes

              // Calculate effective check-in within office hours
              const effectiveCheckIn = Math.max(checkInMinutes, officeStartMinutes)

              // Calculate effective check-out within office hours
              const effectiveCheckOut = Math.min(checkOutMinutes, officeEndMinutes)

              // Calculate hours worked WITHIN office hours (9AM-5:30PM)
              const workingMinutesInOfficeHours = Math.max(0, effectiveCheckOut - effectiveCheckIn)
              const workingHoursInOfficeWindow = workingMinutesInOfficeHours / 60

              // Total working hours (for logging)
              const totalMinutes = checkOutMinutes - checkInMinutes
              const totalWorkingHours = totalMinutes / 60

              console.log(`📊 ${dateStr}: Check-in: ${checkInHour}:${String(checkInMinute).padStart(2, '0')}, Check-out: ${checkOutHour}:${String(checkOutMinute).padStart(2, '0')}`)
              console.log(`   Total Hours: ${totalWorkingHours.toFixed(2)}, Hours in Office Window (9AM-5:30PM): ${workingHoursInOfficeWindow.toFixed(2)}`)

              // Check if completed 8 hours WITHIN office hours (9AM-5:30PM)
              if (workingHoursInOfficeWindow >= 8) {
                onTime++
                console.log(`✅ On Time: ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}) - ${workingHoursInOfficeWindow.toFixed(2)} hours in office window`)
              } else {
                lateArrivals++
                console.log(`⏰ Late/Short: ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}) - Only ${workingHoursInOfficeWindow.toFixed(2)} hours in office window (need 8)`)
              }
            } else {
              // No check-out record - count as late (incomplete day)
              lateArrivals++
              console.log(`⚠️ No Check-out: ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}) - Only check-in at ${checkInHour}:${String(checkInMinute).padStart(2, '0')}`)
            }
          } else {
            // No check-in record = absent (don't count in late)
            console.log(`❌ Absent: ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]})`)
          }
        })

        console.log('📊 Final Stats - Attendance Days:', attendanceDays, 'On Time:', onTime, 'Late:', lateArrivals)

        // Calculate total working days from start of month till TODAY (Monday-Friday only)
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        const currentDay = new Date().getDate() // Today's date
        let totalWorkingDays = 0

        // Count working days from 1st till today only
        for (let day = 1; day <= currentDay; day++) {
          const date = new Date(currentYear, currentMonth, day)
          const dayOfWeek = date.getDay()
          // Count Monday-Friday only (1-5)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            totalWorkingDays++
          }
        }

        // Calculate absent days (working days till today - attendance days)
        const absentDays = Math.max(0, totalWorkingDays - attendanceDays)
        console.log('📊 Working Days Calculation (Till Today) - Total:', totalWorkingDays, 'Present:', attendanceDays, 'Absent:', absentDays)

        // Check today's status
        const today = new Date().toISOString().split('T')[0]
        const todayLogs = userLogs.filter((log: any) => {
          const logDate = log.punch_time ? log.punch_time.split(' ')[0] : null
          return logDate === today
        })
        const todayStatus = todayLogs.length > 0 ? 'Present' : 'Absent'

        const updatedData = {
          todayStatus,
          attendanceDays,
          onTime,
          lateArrivals,
          workingDays: totalWorkingDays,
          absentDays
        }

        console.log('✅ Setting employee attendance data:', updatedData)

        setEmployeeData(prev => ({
          ...prev,
          ...updatedData
        }))
      } else {
        console.error('❌ Attendance API failed with status:', attendanceRes.status)
        const errorText = await attendanceRes.text()
        console.error('❌ Error response:', errorText)

        // Set default values when API fails
        console.log('⚠️ Using default attendance values due to API failure')
        setEmployeeData(prev => ({
          ...prev,
          attendance: '0',
          attendancePercentage: 0,
          late: 0,
          leaves: '0',
          present: 0,
          absent: 0,
          halfDay: 0,
          workFromHome: 0,
          attendanceDates: []
        }))
      }

    } catch (error) {
      console.error('❌ Error fetching employee data:', error)

      // Set default values when API fails
      console.log('⚠️ Using default attendance values due to error')
      setEmployeeData(prev => ({
        ...prev,
        attendance: '0',
        attendancePercentage: 0,
        late: 0,
        leaves: '0',
        present: 0,
        absent: 0,
        halfDay: 0,
        workFromHome: 0,
        attendanceDates: []
      }))
    } finally {
      setIsLoadingEmployeeData(false)
    }
  }

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch('/api/dashboard/stats', {
        cache: 'no-store'
      })

      if (response.ok) {
        const stats = await response.json()
        setDashboardData(stats)
      } else {
        console.error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch designations for dropdown
  const fetchDesignations = async () => {
    try {
      const response = await fetch('/api/designations')
      if (response.ok) {
        const data = await response.json()
        setDesignations(data)
      }
    } catch (error) {
      console.error('Error fetching designations:', error)
    }
  }

  // Fetch employees for reporting manager dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/reporting-managers')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  // Force session update on mount if needed (should rarely be needed with server-side session)
  useEffect(() => {
    if (session && !session?.user?.username) {
      console.log('⚠️ Session exists but missing username, updating...')
      update()
    }
  }, [session, session?.user?.username, update])

  // Load data on component mount
  useEffect(() => {
    fetchDashboardStats()
    fetchDesignations()
    fetchEmployees()
  }, [])

  // Check birthdays for ALL employees (global birthday check)
  useEffect(() => {
    const checkBirthdaysToday = async () => {
      if (session) {
        console.log('🎂 Checking for birthdays today (global)...')
        try {
          const response = await fetch('/api/employees/birthdays-today')
          if (response.ok) {
            const data = await response.json()
            console.log('🎂 Birthday API response:', data)

            if (data.success && data.count > 0) {
              const employees = data.employees.map((emp: any) => ({
                emp_id: emp.emp_id,
                name: emp.name
              }))
              console.log('🎉 BIRTHDAYS TODAY:', employees)

              // Check if logged-in user's birthday
              const myBirthday = employees.some((emp: any) => emp.emp_id === session?.user?.emp_id)
              console.log('🎂 Is it my birthday?', myBirthday)

              setBirthdayEmployees(employees)
              setIsMyBirthday(myBirthday)
              setShowBirthdayCard(true)

              // Auto-close after 8 seconds (longer to read the message)
              setTimeout(() => {
                setShowBirthdayCard(false)
              }, 8000)
            } else {
              console.log('📅 No birthdays today')
            }
          }
        } catch (error) {
          console.error('❌ Error checking birthdays:', error)
        }
      }
    }

    checkBirthdaysToday()
  }, [session])

  // Fetch employee dashboard data for non-admin users OR admin viewing personal
  useEffect(() => {
    const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'
    const shouldShowEmployeeView = !isAdmin || viewPersonal
    console.log('🔄 useEffect triggered - IsAdmin:', isAdmin, 'ViewPersonal:', viewPersonal, 'EmpId:', session?.user?.emp_id, 'HasSession:', !!session)

    // Fetch data if session exists AND we should show employee view
    if (session?.user?.emp_id && shouldShowEmployeeView) {
      console.log('✅ Calling fetchEmployeeData...')
      fetchEmployeeData()
    } else if (!shouldShowEmployeeView) {
      // If admin viewing admin dashboard, set loading to false immediately
      console.log('👨‍💼 Admin view - skipping employee data fetch')
      setIsLoadingEmployeeData(false)
    }
  }, [session?.user?.user_level, session?.user?.emp_id, viewPersonal])

  // Handle input changes for new employee form
  const handleInputChange = (field: keyof NewEmployee, value: string | number) => {
    setNewEmployee(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle Add Employee modal open
  const handleAddEmployee = () => {
    setIsAddDialogOpen(true)
  }

  // Check if user is admin
  const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'

  // Show employee dashboard if: user is employee OR admin viewing personal dashboard
  const showEmployeeDashboard = !isAdmin || viewPersonal

  // Counter animations for circular charts (hooks must be called unconditionally!)
  const animatedAttendanceDays = useCountUp(employeeData.attendanceDays, 1500, !isLoadingEmployeeData && showEmployeeDashboard)
  const animatedOnTime = useCountUp(employeeData.onTime, 1500, !isLoadingEmployeeData && showEmployeeDashboard)
  const animatedLateArrivals = useCountUp(employeeData.lateArrivals, 1500, !isLoadingEmployeeData && showEmployeeDashboard)
  const animatedAbsentDays = useCountUp(employeeData.absentDays, 1500, !isLoadingEmployeeData && showEmployeeDashboard)
  const animatedLeaveBalance = useCountUp(employeeData.leaveBalance, 1500, !isLoadingEmployeeData && showEmployeeDashboard)

  // Debug leave balance percentage
  const leavePercentage = employeeData.totalAllocatedLeaves > 0
    ? (employeeData.leaveBalance / employeeData.totalAllocatedLeaves * 100).toFixed(1)
    : 0

  console.log('📊 Dashboard - User Level:', session?.user?.user_level, '| Is Admin:', isAdmin, '| View Personal:', viewPersonal, '| Show Employee Dashboard:', showEmployeeDashboard)

  // Show loading state ONLY if no session (server-side session should always be available)
  if (!session) {
    console.log('⏳ [DASHBOARD] Loading state - No session available')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
            {/* Inner pulsing dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-3">
              <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard</p>
          <p className="text-sm text-gray-500">Authenticating your session...</p>
        </div>
      </div>
    )
  }

  if (showEmployeeDashboard) {
    console.log('📊 Leave Circle - Balance:', employeeData.leaveBalance, 'Total:', employeeData.totalAllocatedLeaves, 'Percentage:', leavePercentage + '%')

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Top Navigation */}
        <Suspense fallback={<div className="h-16 bg-background border-b" />}>
          <TopNavigation session={session} />
        </Suspense>

        {/* Employee Dashboard Content */}
        <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Back to Admin Dashboard button (only for admins viewing personal) */}
          {isAdmin && viewPersonal && (
            <div className="flex justify-start">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Button>
            </div>
          )}

          {/* Welcome Header */}
          <div className="rounded-lg p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Hello {session?.user?.name || 'Employee'}!</h1>
            <p className="text-sm md:text-base text-gray-600">Welcome back! Here's your overview for today.</p>
          </div>

          {/* Personal Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg p-4 transition-all border-0 shadow-sm bg-gradient-to-br from-emerald-100 to-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">Today's Status</p>
                    <p className="text-2xl font-bold text-slate-800">{employeeData.todayStatus}</p>
                    <p className="text-xs text-slate-500 mt-1">Attendance</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg p-4 transition-all border-0 shadow-sm bg-gradient-to-br from-purple-100 to-purple-200">
              <CardContent className="p-6">
                {employeeEmploymentStatus && employeeEmploymentStatus.toLowerCase() !== 'permanent' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600 mb-1">Leave Balance</p>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        Not yet permanent. Contact HR for leave information.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600 mb-2">Leave Balance</p>
                      <p className="text-2xl font-bold text-slate-800">{employeeData.leaveBalance}</p>
                      <p className="text-xs text-slate-500 mt-1">Days Available</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg p-4 transition-all border-0 shadow-sm bg-gradient-to-br from-green-100 to-green-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">Total Leaves</p>
                    <p className="text-2xl font-bold text-slate-800">{employeeData.totalAllocatedLeaves}</p>
                    <p className="text-xs text-slate-500 mt-1">Allocated This Year</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg p-4 transition-all border-0 shadow-sm bg-gradient-to-br from-rose-100 to-rose-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">Used Leaves</p>
                    <p className="text-2xl font-bold text-slate-800">{employeeData.totalAllocatedLeaves - employeeData.leaveBalance}</p>
                    <p className="text-xs text-slate-500 mt-1">Days Taken</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-rose-600" />

                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Chart */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Clock className="h-5 w-5 text-blue-600" />
                This Month's Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEmployeeData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading attendance data...</p>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Circular Progress - Present Days */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (employeeData.attendanceDays / 22))}`}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">{animatedAttendanceDays}</span>
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-gray-700">Present</p>
                    <p className="text-xs text-gray-500">Total working days</p>
                  </div>
                </div>

                {/* Circular Progress - On Time */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (employeeData.onTime / (employeeData.attendanceDays || 1)))}`}
                        className="transition-all duration-1000 ease-out delay-150"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">{animatedOnTime}</span>
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-gray-700">On Time</p>
                    <p className="text-xs text-gray-500">Punctual arrivals</p>
                  </div>
                </div>

                {/* Circular Progress - Late Arrivals */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (employeeData.lateArrivals / (employeeData.attendanceDays || 1)))}`}
                        className="transition-all duration-1000 ease-out delay-300"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">{animatedLateArrivals}</span>
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-gray-700">Late</p>
                    <p className="text-xs text-gray-500">After 9:00 AM</p>
                  </div>
                </div>

                {/* Circular Progress - Absent Days */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#ef4444"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${employeeData.workingDays > 0 ? 2 * Math.PI * 56 * (1 - (employeeData.absentDays / employeeData.workingDays)) : 2 * Math.PI * 56}`}
                        className="transition-all duration-1000 ease-out delay-450"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">{animatedAbsentDays}</span>
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-gray-700">Absent</p>
                    <p className="text-xs text-gray-500">Days missed</p>
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  My Recent Leave Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeeEmploymentStatus && employeeEmploymentStatus.toLowerCase() !== 'permanent' ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-sm text-amber-700 mb-2 font-medium">Not Yet Permanent</p>
                    <p className="text-xs text-slate-600">
                      Please contact HR for leave applications.
                    </p>
                  </div>
                ) : recentLeaves.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No recent leave applications</p>
                    <Button
                      onClick={() => window.location.href = '/leaves'}
                      variant="ghost"
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      View All Applications →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLeaves.map((leave: any) => {
                      const getStatusColor = (approved: number) => {
                        switch(approved) {
                          case 1: return 'bg-green-100 text-green-700'
                          case 2: return 'bg-red-100 text-red-700'
                          default: return 'bg-amber-100 text-amber-700'
                        }
                      }
                      const getStatusText = (approved: number) => {
                        switch(approved) {
                          case 1: return 'Approved'
                          case 2: return 'Rejected'
                          default: return 'Pending'
                        }
                      }
                      return (
                        <div key={leave.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{leave.leave_type_name || 'Leave'}</p>
                              <p className="text-xs text-slate-500">
                                {leave.from_date ? new Date(leave.from_date).toLocaleDateString('en-GB') : 'N/A'} - {leave.to_date ? new Date(leave.to_date).toLocaleDateString('en-GB') : 'N/A'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(leave.approved)}`}>
                              {getStatusText(leave.approved)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{leave.no_of_days || 0} {leave.no_of_days === 1 ? 'day' : 'days'}</p>
                        </div>
                      )
                    })}
                    <Button
                      onClick={() => window.location.href = '/leaves'}
                      variant="ghost"
                      className="w-full mt-2 text-blue-600 hover:text-blue-700"
                    >
                      View All Applications →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">This Month</span>
                    <span className="text-lg font-bold text-slate-800">{employeeData.attendanceDays} {employeeData.attendanceDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">On Time</span>
                    <span className="text-lg font-bold text-green-600">{employeeData.onTime} {employeeData.onTime === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Late Arrivals</span>
                    <span className="text-lg font-bold text-amber-600">{employeeData.lateArrivals} {employeeData.lateArrivals === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/attendance'}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    View Detailed Attendance →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-6 md:mt-8">
            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 shadow-lg">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col items-center text-center pt-2 md:pt-3">
                  <div className="space-y-2 w-full">
                    <h3 className="text-base md:text-xl font-bold text-red-900 flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                      Important Security Notice
                    </h3>
                    <div className="space-y-1 md:space-y-1.5 text-xs md:text-base text-gray-800">
                      <p className="flex items-start gap-1.5 md:gap-2">
                        <span className="text-red-600 font-bold flex-shrink-0 text-sm md:text-base">•</span>
                        <span className="text-left"><strong>Never share your password</strong> or login credentials with anyone.</span>
                      </p>
                      <p className="flex items-start gap-1.5 md:gap-2">
                        <span className="text-red-600 font-bold flex-shrink-0 text-sm md:text-base">•</span>
                        <span className="text-left"><strong>Keep your information confidential.</strong> Do not share employee ID or salary details.</span>
                      </p>
                      <p className="flex items-start gap-1.5 md:gap-2">
                        <span className="text-red-600 font-bold flex-shrink-0 text-sm md:text-base">•</span>
                        <span className="text-left"><strong>Report suspicious activity immediately</strong> to your manager or HR.</span>
                      </p>
                      <p className="flex items-start gap-1.5 md:gap-2">
                        <span className="text-red-600 font-bold flex-shrink-0 text-sm md:text-base">•</span>
                        <span className="text-left">Sharing confidential information is <strong>against company policy</strong> and may result in disciplinary action.</span>
                      </p>
                    </div>
                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-red-200">
                      <p className="text-[10px] md:text-sm text-gray-700 font-medium">
                        🔒 Your account security is your responsibility. Always logout after use and change your password regularly.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Footer - Employee Dashboard */}
          <div className="mt-8 md:mt-12 mb-6 md:mb-8">
            <Card className="border-0 shadow-lg bg-gray-900 text-white overflow-hidden relative">
              {/* Decorative background elements */}
              {/* <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-blue-200/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-purple-200/30 rounded-full blur-3xl"></div> */}

              <CardContent className="py-6 px-4 md:py-10 md:px-8 relative z-10 mt-4 md:mt-8">
                {/* Main Content - Centered */}
                <div className="max-w-5xl mx-auto">
                  {/* Company Logo & Title - Compact */}
                  <div className="text-center mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold text-slate-200 mb-1 md:mb-2">VIS HR Portal</h3>
                    <p className="text-[10px] md:text-xs text-slate-400 max-w-xl mx-auto px-2">
                      Employee Management System - Streamlining workforce operations
                    </p>
                  </div>

                  <Separator className="my-3 md:my-5 bg-slate-700" />

<<<<<<< HEAD
                  {/* Quick Links - Centered */}
                  <div className="mb-3 md:mb-5 max-w-3xl mx-auto">
=======
                  {/* Two Columns - Compact & Responsive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-3 md:mb-5 max-w-3xl mx-auto">
                    {/* HR Department */}
                   

                    {/* Quick Links */}
>>>>>>> origin/main
                    <div className="text-center space-y-2 md:space-y-3">
                      <h4 className="text-xs md:text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center justify-center gap-1.5 md:gap-2">
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                        Quick Links
                      </h4>
                      <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
                        <a href="/employees" className="text-[10px] md:text-xs text-slate-400 hover:text-slate-200 transition-colors hover:underline">
                          Employees
                        </a>
                        <span className="text-slate-600">•</span>
                        <a href="/attendance" className="text-[10px] md:text-xs text-slate-400 hover:text-slate-200 transition-colors hover:underline">
                          Attendance
                        </a>
                        <span className="text-slate-600">•</span>
                        <a href="/leaves" className="text-[10px] md:text-xs text-slate-400 hover:text-slate-200 transition-colors hover:underline">
                          Leaves
                        </a>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3 md:my-5 bg-slate-700" />

                  {/* Footer Bottom - Compact & Responsive */}
                  <div className="text-center space-y-1.5 md:space-y-2">
<<<<<<< HEAD
=======
                    {/* Developer Credit */}
                   

>>>>>>> origin/main
                    {/* Copyright & Status */}
                    <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 text-[10px] md:text-xs text-slate-500">
                      <p>© {new Date().getFullYear()} HR Portal. All rights reserved.</p>
                      <span className="hidden md:inline text-slate-600">•</span>
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span>System Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Birthday Card - Employee Dashboard */}
        {showBirthdayCard && birthdayEmployees.length > 0 && (
          <div className="fixed bottom-4 right-4 left-4 md:left-auto z-[9999] animate-in slide-in-from-bottom-5 duration-700">
            <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl shadow-xl p-4 w-full md:w-72 border-2 border-white">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-1">🎂</div>

                {isMyBirthday ? (
                  <>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      IT'S YOUR SPECIAL DAY!
                    </h2>
                    <p className="text-sm font-semibold text-gray-800">
                      Happy Birthday, {birthdayEmployees.find(emp => emp.emp_id === session?.user?.emp_id)?.name}!
                    </p>
                    <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2 mt-2">
                      <p className="text-xs text-gray-700">
                        May your day be filled with joy and wonderful moments!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      TIME TO CELEBRATE!
                    </h2>
                    <div className="space-y-1">
                      {birthdayEmployees.map((emp, index) => (
                        <p key={index} className="text-sm font-semibold text-purple-700">
                          {emp.name}
                        </p>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-2 mt-2">
                      <p className="text-xs text-gray-800 font-medium">
                        Don't forget to wish them a wonderful birthday!
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowBirthdayCard(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold bg-white/80 hover:bg-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-all"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Admin Dashboard (user_level 1)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <TopNavigation session={session} />
      </Suspense>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Dashboard Heading */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">HR Portal Dashboard</h1>
            <p className="text-sm text-slate-600 mt-2">Welcome back! Here's an overview of your HR Portal</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingStats ? (
              // Skeleton Loaders
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              // Real Data
              <>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-blue-200 to-blue-300">
                  <CardContent className="p-8 pt-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-slate-700">Total Employees</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{dashboardData.totalEmployees.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            {dashboardData.totalEmployees > 0 ? `${dashboardData.activeEmployees} active` : "No data"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Total workforce</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-emerald-200 to-emerald-300">
                  <CardContent className="p-8 pt-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-slate-700">Present Today</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{dashboardData.presentToday.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            {dashboardData.attendancePercentage} attendance
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Out of {dashboardData.totalEmployees} employees</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <UserCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-rose-200 to-rose-300">
                  <CardContent className="p-8 pt-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-slate-700">Pending Leaves</p>
                          {dashboardData.pendingLeaves > 5 && <Badge variant="destructive" className="text-xs animate-pulse">Urgent</Badge>}
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{dashboardData.pendingLeaves}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            {dashboardData.pendingLeaves > 5 ? `${dashboardData.pendingLeaves - 5} urgent approvals` : "Normal workload"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Requires attention</p>
                      </div>
                      <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <Calendar className="h-6 w-6 text-rose-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {isLoadingStats ? (
              // Skeleton Loaders
              <>
                <SecondaryMetricSkeleton />
                <SecondaryMetricSkeleton />
                <SecondaryMetricSkeleton />
                <SecondaryMetricSkeleton />
                <SecondaryMetricSkeleton />
              </>
            ) : (
              // Real Data
              <>
                <Card className="p-4 border-1 border-purple-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-100 to-purple-200 ">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Departments</p>
                      <p className="text-lg font-bold text-slate-800">{dashboardData.departments}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-1 border-red-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-100 to-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Absent</p>
                      <p className="text-lg font-bold text-slate-800">{dashboardData.absent}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-1 border-amber-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-100 to-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Late Today</p>
                      <p className="text-lg font-bold text-slate-800">{dashboardData.lateToday}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-1 border-blue-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-100 to-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">On Leave</p>
                      <p className="text-lg font-bold text-slate-800">{dashboardData.onLeave}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-1 border-emerald-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-100 to-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">On Time</p>
                      <p className="text-lg font-bold text-slate-800">{dashboardData.presentToday}</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Animated Black Shining Divider Line - Only show when data is loaded */}
          {!isLoadingStats && (
            <>
              <div className="relative my-8 h-[2px] rounded-full overflow-hidden bg-gradient-to-r from-transparent via-slate-800 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600 to-transparent animate-pulse"></div>
                <div
                  className="absolute inset-0 h-full w-1/4 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-80"
                  style={{
                    animation: 'shimmer 2.5s infinite ease-in-out',
                  }}
                ></div>
              </div>
              <style jsx>{`
                @keyframes shimmer {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(400%);
                  }
                }
              `}</style>
            </>
          )}

          {/* Quick Info Row - Horizontal Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isLoadingStats ? (
              // Skeleton Loaders
              <>
                <SectionCardSkeleton />
                <SectionCardSkeleton />
                <SectionCardSkeleton />
              </>
            ) : (
              // Real Data
              <>
                <QuickActions onAddEmployee={handleAddEmployee} />
                <TodaysOverview dashboardData={dashboardData} />
                <PendingItems />
              </>
            )}
          </div>

          {/* Recent Activities - Full Width */}
          <div className="w-full">
            {isLoadingStats ? (
              <RecentActivitiesSkeleton />
            ) : (
              <RecentActivities />
            )}
          </div>

          {/* Company Footer - Only show when data is loaded */}
          {!isLoadingStats && (
            <div className="mt-12 mb-8">
              <Card className="border-0 shadow-lg bg-gray-900 text-white  overflow-hidden relative ">
              {/* Decorative background elements */}
              {/* <div className="absolute top-0 right-0 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/30 rounded-full blur-3xl"></div> */}

              <CardContent className="py-10 px-8 relative z-10 mt-8">
                {/* Main Content - Centered */}
                <div className="max-w-5xl mx-auto">
                  {/* Company Logo & Title - Compact */}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">VIS HR Portal</h3>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto">
                      Employee Management System - Streamlining workforce operations
                    </p>
                  </div>

                  <Separator className="my-5 bg-slate-300" />

<<<<<<< HEAD
                  {/* Quick Links - Centered */}
                  <div className="mb-5 max-w-3xl mx-auto">
=======
                  {/* Two Columns - Compact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-5 max-w-3xl mx-auto">
                    {/* HR Department */}
                  
                    {/* Quick Links */}
>>>>>>> origin/main
                    <div className="text-center space-y-3">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Quick Links
                      </h4>
                      <div className="flex justify-center gap-4">
                        <a href="/employees" className="text-xs text-slate-400 hover:text-slate-300 transition-colors hover:underline">
                          Employees
                        </a>
                        <span className="text-slate-400">•</span>
                        <a href="/attendance" className="text-xs text-slate-400 hover:text-slate-300 transition-colors hover:underline">
                          Attendance
                        </a>
                        <span className="text-slate-400">•</span>
                        <a href="/leaves" className="text-xs text-slate-400 hover:text-slate-300 transition-colors hover:underline">
                          Leaves
                        </a>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-5 bg-slate-300" />

                  {/* Footer Bottom - Compact */}
                  <div className="text-center space-y-2">
<<<<<<< HEAD
=======
                    {/* Developer Credit */}
                    

>>>>>>> origin/main
                    {/* Copyright & Status */}
                    <div className="flex flex-col md:flex-row justify-center items-center gap-3 text-xs text-slate-400">
                      <p>© {new Date().getFullYear()} VIS HR Portal. All rights reserved.</p>
                      <span className="hidden md:inline text-slate-400">•</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span>System Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
      </main>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="empId">Employee ID *</Label>
                    <Input
                      id="empId"
                      value={newEmployee.empId}
                      onChange={(e) => handleInputChange('empId', e.target.value)}
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newEmployee.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={newEmployee.department}
                      onValueChange={(value) => handleInputChange('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept} value={dept} className="bg-white hover:bg-gray-100">
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <SearchableSelect
                      value={newEmployee.designation}
                      onValueChange={(value) => handleInputChange('designation', value)}
                      options={designations}
                      placeholder="Select designation..."
                      searchPlaceholder="Search designations..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary *</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={newEmployee.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder="Enter salary amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={newEmployee.joiningDate}
                      onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Adding...' : 'Add Employee'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        message={successMessage}
      />

      {/* Error Popup */}
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        message={errorMessage}
      />

      {/* Birthday Card - Admin Dashboard */}
      {showBirthdayCard && birthdayEmployees.length > 0 && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto z-[9999] animate-in slide-in-from-bottom-5 duration-700">
          <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl shadow-xl p-4 w-full md:w-72 border-2 border-white">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-1">🎂</div>

              {isMyBirthday ? (
                <>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    IT'S YOUR SPECIAL DAY!
                  </h2>
                  <p className="text-sm font-semibold text-gray-800">
                    Happy Birthday, {birthdayEmployees.find(emp => emp.emp_id === session?.user?.emp_id)?.name}!
                  </p>
                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2 mt-2">
                    <p className="text-xs text-gray-700">
                      May your day be filled with joy and wonderful moments!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    TIME TO CELEBRATE!
                  </h2>
                  <div className="space-y-1">
                    {birthdayEmployees.map((emp, index) => (
                      <p key={index} className="text-sm font-semibold text-purple-700">
                        {emp.name}
                      </p>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-2 mt-2">
                    <p className="text-xs text-gray-800 font-medium">
                      Don't forget to wish them a wonderful birthday!
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowBirthdayCard(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold bg-white/80 hover:bg-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-all"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
}
