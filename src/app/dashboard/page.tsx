"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  Banknote
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

export default function DashboardPage() {
  // Session data
  const { data: session } = useSession()

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

  // Load data on component mount
  useEffect(() => {
    fetchDashboardStats()
    fetchDesignations()
    fetchEmployees()
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <TopNavigation session={session} />

      {/* Dashboard Content */}
      <main className="container mx-auto px-6 py-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-8 pt-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-600">Payroll Status</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">₹{(dashboardData.payrollAmount / 100000).toFixed(1)}L</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        Ready for processing
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Monthly payroll</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <Banknote className="h-6 w-6 text-amber-600" />
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