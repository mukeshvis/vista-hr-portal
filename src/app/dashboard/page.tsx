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

// Recent Activities Component with Enhanced Design
function RecentActivities() {
  const activities = [
    {
      action: "New employee onboarded",
      user: "Sarah Johnson",
      time: "2 hours ago",
      type: "success",
      icon: Users
    },
    {
      action: "Leave request submitted",
      user: "Mike Chen",
      time: "4 hours ago",
      type: "pending",
      icon: Calendar
    },
    {
      action: "Payroll processed",
      user: "System",
      time: "6 hours ago",
      type: "success",
      icon: DollarSign
    },
    {
      action: "Training session completed",
      user: "Alex Kumar",
      time: "1 day ago",
      type: "info",
      icon: CheckCircle
    },
    {
      action: "Policy updated",
      user: "HR Team",
      time: "2 days ago",
      type: "info",
      icon: AlertCircle
    }
  ]

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
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const styles = getStatusStyles(activity.type)
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-8 h-8 ${styles.bgColor} rounded-lg flex items-center justify-center`}>
                  <activity.icon className={`h-4 w-4 ${styles.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{activity.user}</span>
                    <div className={`w-1 h-1 rounded-full ${styles.dotColor}`}></div>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
    pendingLeaves: 0,
    workingDays: 0,
    onTime: 0,
    lateArrivals: 0,
    attendanceDays: 0,
    absentDays: 0
  })
  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(true)

  // Fetch employee dashboard data
  const fetchEmployeeData = async () => {
    if (!session?.user?.emp_id) return

    console.log('📊 Fetching employee dashboard data for:', session.user.emp_id)
    setIsLoadingEmployeeData(true)
    try {
      const empId = session.user.emp_id
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const currentDate = new Date().toISOString().split('T')[0]

      console.log('📅 Date range:', { currentYear, currentMonth })

      // Fetch leave balance
      const leaveBalanceRes = await fetch(`/api/leaves/balance?empId=${empId}&year=${currentYear}`)
      if (leaveBalanceRes.ok) {
        const leaveData = await leaveBalanceRes.json()
        const totalRemaining = leaveData.balance?.reduce((sum: number, item: any) => sum + item.remaining, 0) || 0
        const totalAllocated = leaveData.balance?.reduce((sum: number, item: any) => sum + item.allocated, 0) || 0
        console.log('📊 Leave Balance - Remaining:', totalRemaining, 'Allocated:', totalAllocated)
        setEmployeeData(prev => ({ ...prev, leaveBalance: totalRemaining, totalAllocatedLeaves: totalAllocated }))
      }

      // Fetch pending leave applications
      const pendingLeavesRes = await fetch(`/api/leaves/applications?empId=${empId}&status=0&year=${currentYear}`)
      if (pendingLeavesRes.ok) {
        const pendingData = await pendingLeavesRes.json()
        setEmployeeData(prev => ({ ...prev, pendingLeaves: pendingData.length }))
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
      }

    } catch (error) {
      console.error('❌ Error fetching employee data:', error)
    } finally {
      setIsLoadingEmployeeData(false)
    }
  }

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
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

  // Force session update on mount if needed
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.username) {
      update()
    }
  }, [status, session?.user?.username, update])

  // Load data on component mount
  useEffect(() => {
    fetchDashboardStats()
    fetchDesignations()
    fetchEmployees()
  }, [])

  // Fetch employee dashboard data for non-admin users OR admin viewing personal
  useEffect(() => {
    const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'
    const shouldShowEmployeeView = !isAdmin || viewPersonal
    console.log('🔄 useEffect triggered - Status:', status, 'IsAdmin:', isAdmin, 'ViewPersonal:', viewPersonal, 'EmpId:', session?.user?.emp_id)
    if (status === 'authenticated' && shouldShowEmployeeView && session?.user?.emp_id) {
      console.log('✅ Calling fetchEmployeeData...')
      fetchEmployeeData()
    }
  }, [status, session?.user?.user_level, session?.user?.emp_id, viewPersonal])

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

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Dashboard...</p>
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
        <main className="container mx-auto px-6 py-6 space-y-6">
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
          <div className="rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hello {session?.user?.name || 'Employee'}!</h1>
            <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
          </div>

          {/* Personal Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-all border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
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

            <Card className="hover:shadow-lg transition-all border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">Pending Leaves</p>
                    <p className="text-2xl font-bold text-slate-800">{employeeData.pendingLeaves}</p>
                    <p className="text-xs text-slate-500 mt-1">Applications</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-2">This Month</p>
                    <p className="text-2xl font-bold text-slate-800">{employeeData.workingDays}</p>
                    <p className="text-xs text-slate-500 mt-1">Working Days</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-amber-600" />
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
                {recentLeaves.length === 0 ? (
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
        </main>
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
      <main className="container mx-auto px-6 py-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-8 pt-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-600">Total Employees</p>
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
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-8 pt-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-600">Present Today</p>
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
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100">
              <CardContent className="p-8 pt-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-600">Pending Leaves</p>
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
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Departments</p>
                  <p className="text-lg font-bold text-slate-800">{dashboardData.departments}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Absent</p>
                  <p className="text-lg font-bold text-slate-800">{dashboardData.absent}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Late Today</p>
                  <p className="text-lg font-bold text-slate-800">{dashboardData.lateToday}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">On Leave</p>
                  <p className="text-lg font-bold text-slate-800">{dashboardData.onLeave}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">On Time</p>
                  <p className="text-lg font-bold text-slate-800">{dashboardData.presentToday}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activities */}
            <div className="lg:col-span-2 space-y-6">
              <RecentActivities />
            </div>

            {/* Right Column - Quick Info */}
            <div className="space-y-6">
              <QuickActions onAddEmployee={handleAddEmployee} />
              <TodaysOverview dashboardData={dashboardData} />
              <PendingItems />
            </div>
          </div>
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
