"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavigation } from "@/components/top-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle, Search, RefreshCw, User, Users, ClipboardList, FileText, Tag, CalendarDays, Hash, Timer, MessageSquare, CalendarClock, Activity, Eye, UserCheck, Pencil, Trash2 } from "lucide-react"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface LeaveType {
  id: number
  leave_type_name: string
  status: number
}

interface LeaveApplication {
  id: number
  emp_id: string
  employee_name: string
  leave_type_name: string
  leave_type_id: number
  leave_day_type: number
  reason: string
  from_date: string
  to_date: string
  no_of_days: number
  approval_status: number
  approval_status_lm: number
  approved: number
  application_date: string
  designation_name: string
  department_name: string
  first_second_half: string
  reporting_manager: number
  reporting_manager_name: string
}

interface EmployeeLeaveBalance {
  emp_id: string
  employee_name: string
  department_name: string
  designation_name: string
  manager_name: string
  total_allocated: number
  total_used: number
  total_remaining: number
  total_applications: number
  annual_used: number
  sick_used: number
  emergency_used: number
}

export default function LeavesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [allApplications, setAllApplications] = useState<LeaveApplication[]>([])
  const [pendingApplications, setPendingApplications] = useState<LeaveApplication[]>([])
  const [managerApplications, setManagerApplications] = useState<LeaveApplication[]>([])
  const [employeeBalances, setEmployeeBalances] = useState<EmployeeLeaveBalance[]>([])
  const [remoteApplications, setRemoteApplications] = useState<any[]>([])
  const [myRemoteApplications, setMyRemoteApplications] = useState<any[]>([])
  const [pendingRemoteApplications, setPendingRemoteApplications] = useState<any[]>([])
  const [employeeRemoteBalances, setEmployeeRemoteBalances] = useState<any[]>([])
  const [loadingRemoteBalances, setLoadingRemoteBalances] = useState(false)
  const [searchRemoteBalance, setSearchRemoteBalance] = useState('')
  const [searchMyRemote, setSearchMyRemote] = useState('')
  const [searchAllRemote, setSearchAllRemote] = useState('')
  const [searchPendingRemote, setSearchPendingRemote] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [isEmployeeDetailsDialogOpen, setIsEmployeeDetailsDialogOpen] = useState(false)
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any>(null)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMy, setLoadingMy] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingPending, setLoadingPending] = useState(false)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [activeTab, setActiveTab] = useState('employees-leave-balance')
  const [isApplyRemoteDialogOpen, setIsApplyRemoteDialogOpen] = useState(false)
  const [isRemoteUsageDialogOpen, setIsRemoteUsageDialogOpen] = useState(false)
  const [isAddRemoteDialogOpen, setIsAddRemoteDialogOpen] = useState(false)
  const [isEditRemoteDialogOpen, setIsEditRemoteDialogOpen] = useState(false)
  const [isDeleteRemoteDialogOpen, setIsDeleteRemoteDialogOpen] = useState(false)
  const [editingRemoteApplication, setEditingRemoteApplication] = useState<any>(null)
  const [deletingRemoteId, setDeletingRemoteId] = useState<number | null>(null)
  const [remoteWorkData, setRemoteWorkData] = useState({
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    reason: ''
  })
  const [addRemoteData, setAddRemoteData] = useState({
    empId: '',
    empName: '',
    managerName: '',
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    reason: ''
  })
  const [editRemoteData, setEditRemoteData] = useState({
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    reason: ''
  })
  const [selectedEmployeeForRemote, setSelectedEmployeeForRemote] = useState<string | null>(null)
  const [remoteValidation, setRemoteValidation] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showRemoteLimitReachedDialog, setShowRemoteLimitReachedDialog] = useState(false)
  const [currentEmpId, setCurrentEmpId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allSearchTerm, setAllSearchTerm] = useState('')
  const [pendingSearchTerm, setPendingSearchTerm] = useState('')
  const [managerSearchTerm, setManagerSearchTerm] = useState('')
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
  const [loadingManager, setLoadingManager] = useState(false)
  // Filter states for year (default: 2025, starting from July)
  const [myAppFilterYear, setMyAppFilterYear] = useState<number>(2025)
  const [allAppFilterYear, setAllAppFilterYear] = useState<number>(2025)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('')
  const [selectedEmployeePolicy, setSelectedEmployeePolicy] = useState<string>('N/A')
  const [employeeLeaveDetails, setEmployeeLeaveDetails] = useState<any[]>([])
  const [employeeLeaveBalance, setEmployeeLeaveBalance] = useState<any[]>([])
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [currentEmployeeManager, setCurrentEmployeeManager] = useState<string>('N/A')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<LeaveApplication | null>(null)
  const [editLeave, setEditLeave] = useState({
    leaveType: '',
    leaveDayType: '1',
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    halfDayType: '',
    reason: ''
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingApplicationId, setDeletingApplicationId] = useState<number | null>(null)
  const [deletingApplicationName, setDeletingApplicationName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddLeaveDialogOpen, setIsAddLeaveDialogOpen] = useState(false)
  const [employeeList, setEmployeeList] = useState<any[]>([])
  const [selectedEmployeeForAdd, setSelectedEmployeeForAdd] = useState<any>(null)
  const [addLeaveData, setAddLeaveData] = useState({
    empId: '',
    empName: '',
    managerName: '',
    leaveType: '',
    leaveDayType: '1',
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    halfDayType: '',
    reason: ''
  })

  const [newLeave, setNewLeave] = useState({
    leaveType: '',
    leaveDayType: '1', // 1=Full Day, 2=Half Day
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    halfDayType: '', // First/Second
    reason: ''
  })

  // Helper function to calculate working days excluding weekends (Saturday & Sunday)
  const calculateWorkingDays = (fromDate: Date, toDate: Date): number => {
    let count = 0
    const currentDate = new Date(fromDate)

    // Loop through each day from fromDate to toDate (inclusive)
    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay()
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return count
  }

  useEffect(() => {
    if (session?.user?.emp_id) {
      fetchInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.emp_id])

  // Handle email approval notifications
  useEffect(() => {
    const notification = searchParams.get('notification')
    const action = searchParams.get('action')
    const role = searchParams.get('role')
    const employee = searchParams.get('employee')
    const message = searchParams.get('message')

    console.log('🔍 Email Approval Debug:', {
      notification,
      action,
      role,
      employee,
      message,
      allParams: Object.fromEntries(searchParams.entries())
    })

    if (notification === 'success' && action && role) {
      console.log('✅ Success notification detected!')
      const roleText = role === 'manager' ? 'Manager' : 'HR'
      const actionText = action === 'approved' ? 'approved' : 'rejected'
      const employeeName = employee ? decodeURIComponent(employee) : 'Employee'

      const popupMessage = `Leave application ${actionText} successfully by ${roleText} for ${employeeName}`
      console.log('📝 Setting popup message:', popupMessage)
      setSuccessMessage(popupMessage)
      console.log('🎉 Setting showSuccessPopup to TRUE')
      setShowSuccessPopup(true)

      // Refresh data
      if (currentEmpId) {
        fetchApplications(currentEmpId)
        fetchAllApplications()
        fetchPendingApplications()
        if (role === 'manager') {
          fetchManagerApplications(currentEmpId)
        }
      }

      // Clear URL parameters after a delay to ensure popup shows
      setTimeout(() => {
        console.log('🧹 Clearing URL parameters')
        router.replace('/leaves', { scroll: false })
      }, 100)
    } else if (notification === 'error' && message) {
      console.log('❌ Error notification detected!')
      setErrorMessage(decodeURIComponent(message))
      setShowErrorPopup(true)

      // Clear URL parameters
      setTimeout(() => {
        router.replace('/leaves', { scroll: false })
      }, 100)
    }
  }, [searchParams, currentEmpId, router])

  const fetchInitialData = async () => {
    try {
      setLoading(true)

      // Get current user's empId from session
      const empId = session?.user?.emp_id || '103' // Default to 103 for testing
      setCurrentEmpId(empId)

      // Fetch leave types
      const typesRes = await fetch('/api/leaves/types')
      if (typesRes.ok) {
        const types = await typesRes.json()
        setLeaveTypes(types)
      }

      // Fetch my applications
      await fetchApplications(empId)

      // Fetch all applications
      await fetchAllApplications()

      // Fetch pending applications
      await fetchPendingApplications()

      // Fetch employee balances
      await fetchEmployeeBalances()

      // Fetch remote work applications
      await fetchRemoteApplications('all')
      await fetchRemoteApplications('my')
      await fetchRemoteApplications('pending')

      // Fetch employee remote balances
      await fetchEmployeeRemoteBalances()

      // Fetch remote work validation
      await fetchRemoteValidation()

      // Fetch current employee's manager
      await fetchCurrentEmployeeManager(empId)
    } catch (error) {
      console.error('Error fetching initial data:', error)
      setErrorMessage('Failed to load leave data')
      setShowErrorPopup(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentEmployeeManager = async (empId: string) => {
    try {
      const res = await fetch(`/api/leaves/employee-info?empId=${empId}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentEmployeeManager(data.manager_name || 'N/A')
      }
    } catch (error) {
      console.error('Error fetching employee manager:', error)
    }
  }

  const fetchApplications = async (empId?: string) => {
    try {
      setLoadingMy(true)
      const url = empId ? `/api/leaves/applications?empId=${empId}` : '/api/leaves/applications'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoadingMy(false)
    }
  }

  const fetchAllApplications = async () => {
    try {
      setLoadingAll(true)
      const res = await fetch('/api/leaves/applications')
      if (res.ok) {
        const data = await res.json()
        setAllApplications(data)
      }
    } catch (error) {
      console.error('Error fetching all applications:', error)
    } finally {
      setLoadingAll(false)
    }
  }

  const fetchPendingApplications = async () => {
    try {
      setLoadingPending(true)
      const res = await fetch('/api/leaves/applications?status=0')
      if (res.ok) {
        const data = await res.json()
        setPendingApplications(data)
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error)
    } finally {
      setLoadingPending(false)
    }
  }

  const fetchManagerApplications = async (managerId: string) => {
    try {
      setLoadingManager(true)
      const res = await fetch(`/api/leaves/manager-approvals?managerId=${managerId}`)
      if (res.ok) {
        const data = await res.json()
        setManagerApplications(data)
      }
    } catch (error) {
      console.error('Error fetching manager applications:', error)
    } finally {
      setLoadingManager(false)
    }
  }

  const fetchEmployeeBalances = async () => {
    try {
      setLoadingBalances(true)
      console.log('🔄 Fetching employee balances...')
      const res = await fetch('/api/leaves/employees-balance')
      console.log('📡 Employee balance response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Employee balances fetched:', data.length, 'employees')
        setEmployeeBalances(data)
      } else {
        console.error('❌ Failed to fetch employee balances:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching employee balances:', error)
    } finally {
      setLoadingBalances(false)
    }
  }

  const fetchEmployeeRemoteBalances = async (month?: string) => {
    try {
      setLoadingRemoteBalances(true)
      const monthParam = month || selectedMonth
      console.log('🔄 Fetching employee remote balances for month:', monthParam)
      const res = await fetch(`/api/remote-work/employee-balances?month=${monthParam}`)
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Employee remote balances fetched:', data.length, 'employees')
        setEmployeeRemoteBalances(data)
      } else {
        console.error('❌ Failed to fetch employee remote balances:', res.status)
      }
    } catch (error) {
      console.error('❌ Error fetching employee remote balances:', error)
    } finally {
      setLoadingRemoteBalances(false)
    }
  }

  const fetchRemoteApplications = async (type: 'my' | 'all' | 'pending' = 'all') => {
    try {
      setLoadingRemote(true)
      let url = '/api/remote-work/applications?type=' + type
      if (type === 'my') {
        url += `&empId=${currentEmpId}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()

        if (type === 'my') {
          setMyRemoteApplications(data)
        } else if (type === 'pending') {
          setPendingRemoteApplications(data)
        } else {
          setRemoteApplications(data)
        }

        console.log(`✅ Fetched ${data.length} ${type} remote applications`)
      }
    } catch (error) {
      console.error('❌ Error fetching remote applications:', error)
    } finally {
      setLoadingRemote(false)
    }
  }

  const fetchRemoteValidation = async () => {
    try {
      if (!currentEmpId) return

      const res = await fetch(`/api/remote-work/validate?empId=${currentEmpId}`)
      if (res.ok) {
        const data = await res.json()
        setRemoteValidation(data)
      }
    } catch (error) {
      console.error('❌ Error fetching remote validation:', error)
    }
  }

  // Handle tab changes
  const handleTabChange = async (value: string) => {
    setActiveTab(value)

    // Fetch data when switching tabs
    if (value === 'my-applications') {
      await fetchApplications(currentEmpId)
    } else if (value === 'all-applications') {
      await fetchAllApplications()
    } else if (value === 'pending-approvals') {
      await fetchPendingApplications()
    } else if (value === 'manager-approvals') {
      if (currentEmpId) {
        await fetchManagerApplications(currentEmpId)
      }
    } else if (value === 'employees-leave-balance') {
      await fetchEmployeeBalances()
    } else if (value === 'remote-work') {
      await fetchRemoteApplications('all')
      await fetchRemoteApplications('my')
      await fetchRemoteApplications('pending')
      await fetchRemoteValidation()
    }
  }

  const handleViewEmployeeLeaves = async (empId: string, employeeName: string) => {
    try {
      setSelectedEmployee(empId)
      setSelectedEmployeeName(employeeName)

      // Fetch leave applications
      const res = await fetch(`/api/leaves/applications?empId=${empId}`)
      if (res.ok) {
        const data = await res.json()
        setEmployeeLeaveDetails(data)
      }

      // Fetch leave balance by type with selected year
      const balanceRes = await fetch(`/api/leaves/balance?empId=${empId}&year=${selectedYear}`)
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setEmployeeLeaveBalance(balanceData.balance || [])
        setSelectedEmployeePolicy(balanceData.policyName || 'N/A')
      }

      setIsEmployeeDialogOpen(true)
    } catch (error) {
      console.error('Error fetching employee leave details:', error)
      setErrorMessage('Failed to fetch employee leave details')
      setShowErrorPopup(true)
    }
  }

  const handleManagerApproveReject = async (applicationId: number, approve: boolean) => {
    try {
      const response = await fetch(`/api/leaves/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approverRole: 'manager',
          approvalStatus: approve ? 1 : 2,
          approved: 0  // Never set to approved for manager, only HR can do final approval
        })
      })

      if (response.ok) {
        setSuccessMessage(`Leave application ${approve ? 'approved' : 'rejected'} successfully`)
        setShowSuccessPopup(true)
        // Refresh manager applications
        if (currentEmpId) {
          fetchManagerApplications(currentEmpId)
        }
        fetchPendingApplications()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} leave application`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error approving/rejecting application:', error)
      setErrorMessage('An error occurred while processing the request')
      setShowErrorPopup(true)
    }
  }

  const handleHRApproveReject = async (applicationId: number, approve: boolean) => {
    try {
      const response = await fetch(`/api/leaves/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approverRole: 'hr',
          approvalStatus: approve ? 1 : 2,
          approved: approve ? 1 : 0
        })
      })

      if (response.ok) {
        setSuccessMessage(`Leave application ${approve ? 'approved' : 'rejected'} successfully`)
        setShowSuccessPopup(true)
        // Refresh all data
        fetchApplications(currentEmpId)
        fetchAllApplications()
        fetchPendingApplications()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} leave application`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error approving/rejecting application:', error)
      setErrorMessage('An error occurred while processing the request')
      setShowErrorPopup(true)
    }
  }

  // Legacy handler for backward compatibility
  const handleApproveReject = async (applicationId: number, approve: boolean) => {
    try {
      const response = await fetch(`/api/leaves/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalStatus: approve ? 1 : 2,
          approved: approve ? 1 : 0,
          approvalStatusLm: approve ? 1 : 2
        })
      })

      if (response.ok) {
        setSuccessMessage(`Leave application ${approve ? 'approved' : 'rejected'} successfully`)
        setShowSuccessPopup(true)
        // Refresh all data
        fetchApplications(currentEmpId)
        fetchAllApplications()
        fetchPendingApplications()
      } else {
        setErrorMessage(`Failed to ${approve ? 'approve' : 'reject'} leave application`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating application:', error)
      setErrorMessage(`Failed to ${approve ? 'approve' : 'reject'} leave application`)
      setShowErrorPopup(true)
    }
  }

  const handleEditClick = (application: LeaveApplication) => {
    setEditingApplication(application)
    setEditLeave({
      leaveType: application.leave_type_id.toString(),
      leaveDayType: application.leave_day_type.toString(),
      fromDate: application.from_date,
      toDate: application.to_date,
      numberOfDays: application.no_of_days,
      halfDayType: application.first_second_half || '',
      reason: application.reason
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (application: LeaveApplication) => {
    setDeletingApplicationId(application.id)
    setDeletingApplicationName(application.employee_name || 'this application')
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingApplicationId) return

    setIsDeleting(true)

    // Optimistic UI update - immediately remove from list
    const deletedId = deletingApplicationId
    const previousAllApplications = [...allApplications]
    const previousApplications = [...applications]
    const previousPendingApplications = [...pendingApplications]

    // Remove from UI immediately
    setAllApplications(prev => prev.filter(app => app.id !== deletedId))
    setApplications(prev => prev.filter(app => app.id !== deletedId))
    setPendingApplications(prev => prev.filter(app => app.id !== deletedId))

    // Close dialog immediately
    setIsDeleteDialogOpen(false)

    try {
      const response = await fetch(`/api/leaves/applications/${deletedId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Success - show message and refresh to sync
        setSuccessMessage('Leave application deleted successfully')
        setShowSuccessPopup(true)
        setDeletingApplicationId(null)
        setDeletingApplicationName('')

        // Refresh in background to sync
        fetchEmployeeBalances()
      } else {
        // Rollback on error
        setAllApplications(previousAllApplications)
        setApplications(previousApplications)
        setPendingApplications(previousPendingApplications)
        setErrorMessage('Failed to delete leave application')
        setShowErrorPopup(true)
      }
    } catch (error) {
      // Rollback on error
      setAllApplications(previousAllApplications)
      setApplications(previousApplications)
      setPendingApplications(previousPendingApplications)
      console.error('Error deleting application:', error)
      setErrorMessage('Failed to delete leave application')
      setShowErrorPopup(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editingApplication) return

    // Validation
    if (!editLeave.leaveType) {
      setErrorMessage('Please select a leave type')
      setShowErrorPopup(true)
      return
    }

    if (!editLeave.fromDate || !editLeave.toDate) {
      setErrorMessage('Please select from and to dates')
      setShowErrorPopup(true)
      return
    }

    if (!editLeave.reason.trim()) {
      setErrorMessage('Please provide a reason for leave')
      setShowErrorPopup(true)
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/leaves/applications/${editingApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leaveType: parseInt(editLeave.leaveType),
          leaveDayType: parseInt(editLeave.leaveDayType),
          fromDate: editLeave.fromDate,
          toDate: editLeave.toDate,
          numberOfDays: editLeave.numberOfDays,
          halfDayType: editLeave.halfDayType,
          halfDayDate: editLeave.leaveDayType === '2' ? editLeave.fromDate : '',
          returnDate: editLeave.toDate,
          reason: editLeave.reason,
          leaveAddress: 'N/A'
        })
      })

      if (response.ok) {
        setSuccessMessage('Leave application updated successfully!')
        setShowSuccessPopup(true)
        setIsEditDialogOpen(false)
        setEditingApplication(null)

        // Refresh all data
        await fetchApplications(currentEmpId)
        await fetchAllApplications()
        await fetchPendingApplications()
      } else {
        const error = await response.json()
        setErrorMessage(error.details || error.error || 'Failed to update leave application')
        setShowErrorPopup(true)
      }
    } catch (error: any) {
      console.error('Error updating leave:', error)
      setErrorMessage('Failed to update leave application: ' + error.message)
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateEditDays = useCallback(() => {
    if (!editLeave.fromDate || !editLeave.toDate) return

    const from = new Date(editLeave.fromDate)
    const to = new Date(editLeave.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    if (editLeave.leaveDayType === '2') {
      setEditLeave(prev => ({ ...prev, numberOfDays: workingDays / 2 }))
    } else {
      setEditLeave(prev => ({ ...prev, numberOfDays: workingDays }))
    }
  }, [editLeave.fromDate, editLeave.toDate, editLeave.leaveDayType])

  useEffect(() => {
    if (isEditDialogOpen) {
      calculateEditDays()
    }
  }, [isEditDialogOpen, calculateEditDays])

  // Format employee list for SearchableSelect - using unique ID to avoid duplicate keys
  const formattedEmployeeOptions = useMemo(() => {
    return employeeList
      .filter(emp => emp.emp_id && emp.emp_id.trim() !== '')
      .map((emp, index) => ({
        value: `${emp.id}-${emp.emp_id}`, // Use unique database ID + emp_id to avoid duplicates
        label: `${emp.emp_name} (${emp.emp_id})`,
        empId: emp.emp_id, // Store actual emp_id for later use
        empData: emp // Store full employee data
      }))
  }, [employeeList])

  // Get the composite value for the currently selected employee
  const selectedEmployeeValue = useMemo(() => {
    if (!addLeaveData.empId) return ''
    const matchingOption = formattedEmployeeOptions.find(opt => opt.empId === addLeaveData.empId)
    return matchingOption?.value || ''
  }, [addLeaveData.empId, formattedEmployeeOptions])

  // Fetch employees when Add Leave dialog opens
  const fetchEmployees = async () => {
    try {
      console.log('🔄 Fetching employees...')
      const res = await fetch('/api/leaves/employees')
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Employees fetched:', data.length)
        setEmployeeList(data)
      } else {
        console.error('❌ Failed to fetch employees:', res.status)
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
    }
  }

  const handleOpenAddLeaveDialog = () => {
    setIsAddLeaveDialogOpen(true)
    fetchEmployees()
  }

  const handleEmployeeSelect = (compositeValue: string) => {
    // Extract emp_id from composite value (format: "id-emp_id")
    const parts = compositeValue.split('-')
    const actualEmpId = parts.slice(1).join('-') // Handle emp_ids that might contain dashes

    const employee = employeeList.find(emp => emp.emp_id === actualEmpId)
    if (employee) {
      setSelectedEmployeeForAdd(employee)
      setAddLeaveData(prev => ({
        ...prev,
        empId: employee.emp_id,
        empName: employee.emp_name,
        managerName: employee.manager_name || 'N/A'
      }))
    }
  }

  const calculateAddLeaveDays = useCallback(() => {
    if (!addLeaveData.fromDate || !addLeaveData.toDate) return

    const from = new Date(addLeaveData.fromDate)
    const to = new Date(addLeaveData.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    if (addLeaveData.leaveDayType === '2') {
      setAddLeaveData(prev => ({ ...prev, numberOfDays: workingDays / 2 }))
    } else {
      setAddLeaveData(prev => ({ ...prev, numberOfDays: workingDays }))
    }
  }, [addLeaveData.fromDate, addLeaveData.toDate, addLeaveData.leaveDayType])

  useEffect(() => {
    if (isAddLeaveDialogOpen) {
      calculateAddLeaveDays()
    }
  }, [isAddLeaveDialogOpen, calculateAddLeaveDays])

  const handleSubmitAddLeave = async () => {
    // Validation
    if (!addLeaveData.empId) {
      setErrorMessage('Please select an employee')
      setShowErrorPopup(true)
      return
    }

    if (!addLeaveData.leaveType) {
      setErrorMessage('Please select a leave type')
      setShowErrorPopup(true)
      return
    }

    if (!addLeaveData.fromDate || !addLeaveData.toDate) {
      setErrorMessage('Please select from and to dates')
      setShowErrorPopup(true)
      return
    }

    // Reason is optional - no validation needed

    try {
      setSubmitting(true)

      const empIdNum = addLeaveData.empId ? parseInt(addLeaveData.empId) : 0

      const response = await fetch('/api/leaves/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          empId: addLeaveData.empId,
          empIdNum: empIdNum,
          leavePolicyId: selectedEmployeeForAdd?.leaves_policy_id || 1,
          companyId: 1,
          leaveType: parseInt(addLeaveData.leaveType),
          leaveDayType: parseInt(addLeaveData.leaveDayType),
          fromDate: addLeaveData.fromDate,
          toDate: addLeaveData.toDate,
          numberOfDays: addLeaveData.numberOfDays,
          halfDayType: addLeaveData.halfDayType,
          halfDayDate: addLeaveData.leaveDayType === '2' ? addLeaveData.fromDate : '',
          returnDate: addLeaveData.toDate,
          reason: addLeaveData.reason,
          leaveAddress: 'N/A',
          username: addLeaveData.empId
        })
      })

      if (response.ok) {
        setSuccessMessage('Leave added successfully for ' + addLeaveData.empName)
        setShowSuccessPopup(true)
        setIsAddLeaveDialogOpen(false)
        setAddLeaveData({
          empId: '',
          empName: '',
          managerName: '',
          leaveType: '',
          leaveDayType: '1',
          fromDate: '',
          toDate: '',
          numberOfDays: 1,
          halfDayType: '',
          reason: ''
        })
        setSelectedEmployeeForAdd(null)

        // Refresh all data
        await fetchApplications(currentEmpId)
        await fetchAllApplications()
        await fetchPendingApplications()
        await fetchEmployeeBalances()
      } else {
        const error = await response.json()
        setErrorMessage(error.details || error.error || 'Failed to add leave')
        setShowErrorPopup(true)
      }
    } catch (error: any) {
      console.error('Error adding leave:', error)
      setErrorMessage('Failed to add leave: ' + error.message)
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateDays = useCallback(() => {
    if (!newLeave.fromDate || !newLeave.toDate) return

    const from = new Date(newLeave.fromDate)
    const to = new Date(newLeave.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    if (newLeave.leaveDayType === '2') {
      // Half day - half of the working days
      setNewLeave(prev => ({ ...prev, numberOfDays: workingDays / 2 }))
    } else {
      setNewLeave(prev => ({ ...prev, numberOfDays: workingDays }))
    }
  }, [newLeave.fromDate, newLeave.toDate, newLeave.leaveDayType])

  useEffect(() => {
    calculateDays()
  }, [calculateDays])

  const handleInputChange = useCallback((field: string, value: any) => {
    setNewLeave(prev => ({ ...prev, [field]: value }))
  }, [])

  // Optimized handler for reason field
  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewLeave(prev => ({ ...prev, reason: e.target.value }))
  }, [])

  const handleSubmitLeave = async () => {
    // Validation
    if (!newLeave.leaveType) {
      setErrorMessage('Please select a leave type')
      setShowErrorPopup(true)
      return
    }

    if (!newLeave.fromDate || !newLeave.toDate) {
      setErrorMessage('Please select from and to dates')
      setShowErrorPopup(true)
      return
    }

    // Reason is optional - no validation needed

    try {
      setSubmitting(true)

      // Get employee numeric ID
      const empIdNum = currentEmpId ? parseInt(currentEmpId) : 0

      // Default leave policy ID (can be fetched from employee data if needed)
      const leavePolicyId = 25 // Default policy ID

      console.log('📤 Submitting leave application:', {
        empId: currentEmpId,
        empIdNum,
        leavePolicyId,
        leaveType: newLeave.leaveType,
        fromDate: newLeave.fromDate,
        toDate: newLeave.toDate
      })

      const response = await fetch('/api/leaves/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          empId: currentEmpId,
          empIdNum: empIdNum,
          leavePolicyId: leavePolicyId,
          companyId: 1,
          leaveType: parseInt(newLeave.leaveType),
          leaveDayType: parseInt(newLeave.leaveDayType),
          fromDate: newLeave.fromDate,
          toDate: newLeave.toDate,
          numberOfDays: newLeave.numberOfDays,
          halfDayType: newLeave.halfDayType,
          halfDayDate: newLeave.leaveDayType === '2' ? newLeave.fromDate : '',
          returnDate: newLeave.toDate,
          reason: newLeave.reason,
          leaveAddress: 'N/A',
          username: currentEmpId
        })
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Leave application created:', result)

        setSuccessMessage('Leave application submitted successfully!')
        setShowSuccessPopup(true)
        setIsApplyDialogOpen(false)
        setNewLeave({
          leaveType: '',
          leaveDayType: '1',
          fromDate: '',
          toDate: '',
          numberOfDays: 1,
          halfDayType: '',
          reason: ''
        })

        // Refresh all data
        await fetchApplications(currentEmpId)
        await fetchAllApplications()
        await fetchPendingApplications()
      } else {
        const error = await response.json()
        console.error('❌ Error response:', error)
        setErrorMessage(error.details || error.error || 'Failed to submit leave application')
        setShowErrorPopup(true)
      }
    } catch (error: any) {
      console.error('❌ Error submitting leave:', error)
      setErrorMessage('Failed to submit leave application: ' + error.message)
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (approvalStatus: number, approved: number, approvalStatusLm?: number) => {
    // Final approval
    if (approved === 1) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Approved</Badge>
    }

    // If manager rejected
    if (approvalStatusLm === 2) {
      return <Badge className="bg-red-600 hover:bg-red-700 text-white">Rejected by Manager</Badge>
    }

    // If HR rejected (manager approved)
    if (approvalStatus === 2 && approvalStatusLm === 1) {
      return <Badge className="bg-red-600 hover:bg-red-700 text-white">Rejected by HR</Badge>
    }

    // If manager approved, waiting for HR
    if (approvalStatusLm === 1 && approvalStatus === 0) {
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Pending HR Approval</Badge>
    }

    // Waiting for manager approval
    if (approvalStatusLm === 0) {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Pending Manager Approval</Badge>
    }

    // Default pending
    return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Pending</Badge>
  }

  const getLeaveDayTypeBadge = (dayType: number) => {
    switch (dayType) {
      case 1:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Full Day</Badge>
      case 2:
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">Half Day</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getLeaveTypeBadge = (leaveTypeName: string | null) => {
    if (!leaveTypeName) {
      return <Badge variant="outline">N/A</Badge>
    }

    // Specific colors for specific leave types
    const lowerCaseName = leaveTypeName.toLowerCase()
    let colorClass = ''

    if (lowerCaseName.includes('annual')) {
      colorClass = 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    } else if (lowerCaseName.includes('emergency')) {
      colorClass = 'bg-red-100 text-red-700 hover:bg-red-200'
    } else if (lowerCaseName.includes('medical') || lowerCaseName.includes('sick')) {
      colorClass = 'bg-green-100 text-green-700 hover:bg-green-200'
    } else if (lowerCaseName.includes('casual')) {
      colorClass = 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    } else if (lowerCaseName.includes('maternity') || lowerCaseName.includes('paternity')) {
      colorClass = 'bg-pink-100 text-pink-700 hover:bg-pink-200'
    } else if (lowerCaseName.includes('unpaid')) {
      colorClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    } else if (lowerCaseName.includes('compensatory') || lowerCaseName.includes('comp')) {
      colorClass = 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    } else if (lowerCaseName.includes('bereavement')) {
      colorClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    } else if (lowerCaseName.includes('study') || lowerCaseName.includes('education')) {
      colorClass = 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
    } else {
      // Fallback colors for any other leave types
      const fallbackColors = [
        'bg-amber-100 text-amber-700 hover:bg-amber-200',
        'bg-lime-100 text-lime-700 hover:bg-lime-200',
        'bg-teal-100 text-teal-700 hover:bg-teal-200',
        'bg-orange-100 text-orange-700 hover:bg-orange-200',
        'bg-violet-100 text-violet-700 hover:bg-violet-200',
      ]
      const hash = leaveTypeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      colorClass = fallbackColors[hash % fallbackColors.length]
    }

    return <Badge className={`${colorClass} border-0`}>{leaveTypeName}</Badge>
  }

  // Filter functions
  const filterApplications = (apps: LeaveApplication[], search: string, filterYear?: number) => {
    let filtered = apps

    // Filter by year if provided (starting from July of that year)
    if (filterYear) {
      filtered = filtered.filter(app => {
        if (!app.from_date) return false

        const appDate = new Date(app.from_date)
        const appYear = appDate.getFullYear()
        const appMonth = appDate.getMonth() + 1 // JavaScript months are 0-indexed

        // Show applications from July of the selected year onwards
        if (appYear > filterYear) return true
        if (appYear === filterYear && appMonth >= 7) return true // July = 7

        return false
      })
    }

    // Filter by search term
    if (!search.trim()) return filtered

    const lowerSearch = search.toLowerCase()
    return filtered.filter(app =>
      app.employee_name?.toLowerCase().includes(lowerSearch) ||
      app.emp_id?.toLowerCase().includes(lowerSearch) ||
      app.leave_type_name?.toLowerCase().includes(lowerSearch) ||
      app.reason?.toLowerCase().includes(lowerSearch) ||
      app.department_name?.toLowerCase().includes(lowerSearch)
    )
  }

  // Helper function to remove duplicates by ID
  const removeDuplicates = (apps: LeaveApplication[]) => {
    const seen = new Set<number>()
    return apps.filter(app => {
      if (seen.has(app.id)) {
        console.warn(`⚠️ Duplicate leave application found: ID ${app.id}`)
        return false
      }
      seen.add(app.id)
      return true
    })
  }

  const filteredMyApplications = useMemo(() => {
    const unique = removeDuplicates(applications)
    return filterApplications(unique, searchTerm, myAppFilterYear)
  }, [applications, searchTerm, myAppFilterYear])

  const filteredAllApplications = useMemo(() => {
    const unique = removeDuplicates(allApplications)
    return filterApplications(unique, allSearchTerm, allAppFilterYear)
  }, [allApplications, allSearchTerm, allAppFilterYear])

  const filteredPendingApplications = useMemo(() => {
    const unique = removeDuplicates(pendingApplications)
    return filterApplications(unique, pendingSearchTerm)
  }, [pendingApplications, pendingSearchTerm])

  const filteredManagerApplications = useMemo(() => {
    const unique = removeDuplicates(managerApplications)
    return filterApplications(unique, managerSearchTerm)
  }, [managerApplications, managerSearchTerm])

  const filteredEmployeeBalances = useMemo(() =>
    employeeBalances.filter(emp => {
      if (!employeeSearchTerm.trim()) return true
      const lowerSearch = employeeSearchTerm.toLowerCase()
      return (
        emp.employee_name?.toLowerCase().includes(lowerSearch) ||
        emp.emp_id?.toLowerCase().includes(lowerSearch) ||
        emp.department_name?.toLowerCase().includes(lowerSearch)
      )
    }),
    [employeeBalances, employeeSearchTerm]
  )

  // Refresh all data
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchInitialData()
      setSuccessMessage('Data refreshed successfully')
      setShowSuccessPopup(true)
    } catch (error) {
      console.error('Error refreshing data:', error)
      setErrorMessage('Failed to refresh data')
      setShowErrorPopup(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate remote work days
  const calculateRemoteDays = useCallback(() => {
    if (!remoteWorkData.fromDate || !remoteWorkData.toDate) return

    const from = new Date(remoteWorkData.fromDate)
    const to = new Date(remoteWorkData.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    setRemoteWorkData(prev => ({ ...prev, numberOfDays: workingDays }))
  }, [remoteWorkData.fromDate, remoteWorkData.toDate])

  useEffect(() => {
    calculateRemoteDays()
  }, [calculateRemoteDays])

  // Calculate add remote days
  const calculateAddRemoteDays = useCallback(() => {
    if (!addRemoteData.fromDate || !addRemoteData.toDate) return

    const from = new Date(addRemoteData.fromDate)
    const to = new Date(addRemoteData.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    setAddRemoteData(prev => ({ ...prev, numberOfDays: workingDays }))
  }, [addRemoteData.fromDate, addRemoteData.toDate])

  useEffect(() => {
    calculateAddRemoteDays()
  }, [calculateAddRemoteDays])

  // Filter functions for remote tabs
  const filteredEmployeeRemoteBalances = useMemo(() => {
    if (!searchRemoteBalance) return employeeRemoteBalances
    const searchLower = searchRemoteBalance.toLowerCase()
    return employeeRemoteBalances.filter(emp =>
      emp.emp_name?.toLowerCase().includes(searchLower) ||
      emp.emp_id?.toLowerCase().includes(searchLower) ||
      emp.manager_name?.toLowerCase().includes(searchLower)
    )
  }, [employeeRemoteBalances, searchRemoteBalance])

  const filteredMyRemoteApplications = useMemo(() => {
    if (!searchMyRemote) return myRemoteApplications
    const searchLower = searchMyRemote.toLowerCase()
    return myRemoteApplications.filter(app =>
      app.manager_name?.toLowerCase().includes(searchLower) ||
      new Date(app.from_date || app.date).toLocaleDateString('en-GB').includes(searchLower) ||
      new Date(app.to_date || app.date).toLocaleDateString('en-GB').includes(searchLower)
    )
  }, [myRemoteApplications, searchMyRemote])

  const filteredAllRemoteApplications = useMemo(() => {
    if (!searchAllRemote) return remoteApplications
    const searchLower = searchAllRemote.toLowerCase()
    return remoteApplications.filter(app =>
      app.employee_name?.toLowerCase().includes(searchLower) ||
      app.emp_id?.toLowerCase().includes(searchLower) ||
      new Date(app.from_date || app.date).toLocaleDateString('en-GB').includes(searchLower) ||
      new Date(app.to_date || app.date).toLocaleDateString('en-GB').includes(searchLower)
    )
  }, [remoteApplications, searchAllRemote])

  const filteredPendingRemoteApplications = useMemo(() => {
    if (!searchPendingRemote) return pendingRemoteApplications
    const searchLower = searchPendingRemote.toLowerCase()
    return pendingRemoteApplications.filter(app =>
      app.employee_name?.toLowerCase().includes(searchLower) ||
      app.emp_id?.toLowerCase().includes(searchLower) ||
      new Date(app.from_date || app.date).toLocaleDateString('en-GB').includes(searchLower) ||
      new Date(app.to_date || app.date).toLocaleDateString('en-GB').includes(searchLower)
    )
  }, [pendingRemoteApplications, searchPendingRemote])

  // Handle remote work application submission
  const handleRemoteApplication = async () => {
    try {
      if (!remoteWorkData.fromDate || !remoteWorkData.toDate) {
        setErrorMessage('Please select from date and to date for remote work')
        setShowErrorPopup(true)
        return
      }

      setSubmitting(true)

      // Use session data directly for current user
      const empId = session?.user?.emp_id || currentEmpId
      const employeeName = session?.user?.name || 'Unknown'

      // Get manager info from current employee data (already loaded)
      const employee = await fetch(`/api/leaves/employees?empId=${empId}`)
      const empData = await employee.json()

      console.log('📝 Submitting remote application for:', {
        empId,
        employeeName,
        managerId: empData[0]?.manager_id,
        managerName: empData[0]?.manager_name
      })

      const response = await fetch('/api/remote-work/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId: empId,
          employeeName: employeeName,
          fromDate: remoteWorkData.fromDate,
          toDate: remoteWorkData.toDate,
          numberOfDays: remoteWorkData.numberOfDays,
          reason: remoteWorkData.reason,
          managerId: empData[0]?.manager_id,
          managerName: empData[0]?.manager_name
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Remote work application submitted successfully')
        setShowSuccessPopup(true)
        setIsApplyRemoteDialogOpen(false)
        setRemoteWorkData({ fromDate: '', toDate: '', numberOfDays: 1, reason: '' })

        // Refresh remote applications
        await fetchRemoteApplications('all')
        await fetchRemoteApplications('my')
        await fetchRemoteApplications('pending')
        await fetchRemoteValidation()
      } else {
        setErrorMessage(data.error || 'Failed to submit remote work application')
        setShowErrorPopup(true)
      }
    } catch (error: any) {
      console.error('Error submitting remote application:', error)
      setErrorMessage('Failed to submit remote work application')
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle remote work approval/rejection
  const handleRemoteApproval = async (id: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/remote-work/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          approvedBy: currentEmpId
        })
      })

      if (response.ok) {
        setSuccessMessage(`Remote work application ${action}d successfully`)
        setShowSuccessPopup(true)

        // Refresh remote applications
        await fetchRemoteApplications('all')
        await fetchRemoteApplications('my')
        await fetchRemoteApplications('pending')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || `Failed to ${action} remote work application`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error(`Error ${action}ing remote application:`, error)
      setErrorMessage(`Failed to ${action} remote work application`)
      setShowErrorPopup(true)
    }
  }

  // Handle opening Add Remote dialog
  const handleOpenAddRemoteDialog = () => {
    setIsAddRemoteDialogOpen(true)
    fetchEmployees()
  }

  // Handle employee selection for Add Remote
  const handleEmployeeSelectForRemote = (compositeValue: string) => {
    const parts = compositeValue.split('-')
    const actualEmpId = parts.slice(1).join('-')

    const employee = employeeList.find(emp => emp.emp_id === actualEmpId)
    if (employee) {
      setSelectedEmployeeForRemote(employee.emp_id)
      setAddRemoteData(prev => ({
        ...prev,
        empId: employee.emp_id,
        empName: employee.emp_name,
        managerName: employee.manager_name || 'N/A'
      }))
    }
  }

  // Get composite value for selected employee in Add Remote dialog
  const selectedEmployeeValueForRemote = useMemo(() => {
    if (!addRemoteData.empId) return ''
    const matchingOption = formattedEmployeeOptions.find(opt => opt.empId === addRemoteData.empId)
    return matchingOption?.value || ''
  }, [addRemoteData.empId, formattedEmployeeOptions])

  // Handle Add Remote submission
  const handleSubmitAddRemote = async () => {
    try {
      // Validation
      if (!addRemoteData.empId) {
        setErrorMessage('Please select an employee')
        setShowErrorPopup(true)
        return
      }

      if (!addRemoteData.fromDate || !addRemoteData.toDate) {
        setErrorMessage('Please select from date and to date for remote work')
        setShowErrorPopup(true)
        return
      }

      setSubmitting(true)

      const response = await fetch('/api/remote-work/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId: addRemoteData.empId,
          employeeName: addRemoteData.empName,
          fromDate: addRemoteData.fromDate,
          toDate: addRemoteData.toDate,
          numberOfDays: addRemoteData.numberOfDays,
          reason: addRemoteData.reason,
          managerName: addRemoteData.managerName
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Remote work added successfully for ' + addRemoteData.empName)
        setShowSuccessPopup(true)
        setIsAddRemoteDialogOpen(false)
        setAddRemoteData({
          empId: '',
          empName: '',
          managerName: '',
          fromDate: '',
          toDate: '',
          numberOfDays: 1,
          reason: ''
        })
        setSelectedEmployeeForRemote(null)

        // Refresh remote applications
        await fetchRemoteApplications('all')
        await fetchRemoteApplications('my')
        await fetchRemoteApplications('pending')
      } else {
        setErrorMessage(data.error || 'Failed to add remote work')
        setShowErrorPopup(true)
      }
    } catch (error: any) {
      console.error('Error adding remote work:', error)
      setErrorMessage('Failed to add remote work')
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Remote Click
  const handleEditRemoteClick = (application: any) => {
    setEditingRemoteApplication(application)
    setEditRemoteData({
      fromDate: new Date(application.from_date || application.date).toISOString().split('T')[0],
      toDate: new Date(application.to_date || application.date).toISOString().split('T')[0],
      numberOfDays: application.number_of_days || 1,
      reason: application.reason || ''
    })
    setIsEditRemoteDialogOpen(true)
  }

  // Calculate edit remote days
  const calculateEditRemoteDays = useCallback(() => {
    if (!editRemoteData.fromDate || !editRemoteData.toDate) return

    const from = new Date(editRemoteData.fromDate)
    const to = new Date(editRemoteData.toDate)

    // Calculate working days excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(from, to)

    setEditRemoteData(prev => ({ ...prev, numberOfDays: workingDays }))
  }, [editRemoteData.fromDate, editRemoteData.toDate])

  useEffect(() => {
    calculateEditRemoteDays()
  }, [calculateEditRemoteDays])

  // Handle Edit Remote Submit
  const handleEditRemoteSubmit = async () => {
    if (!editingRemoteApplication) return

    try {
      if (!editRemoteData.fromDate || !editRemoteData.toDate) {
        setErrorMessage('Please select from date and to date')
        setShowErrorPopup(true)
        return
      }

      setSubmitting(true)

      const response = await fetch('/api/remote-work/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRemoteApplication.id,
          fromDate: editRemoteData.fromDate,
          toDate: editRemoteData.toDate,
          numberOfDays: editRemoteData.numberOfDays,
          reason: editRemoteData.reason
        })
      })

      if (response.ok) {
        setSuccessMessage('Remote work application updated successfully')
        setShowSuccessPopup(true)
        setIsEditRemoteDialogOpen(false)
        setEditingRemoteApplication(null)

        // Refresh all remote applications
        await fetchRemoteApplications('all')
        await fetchRemoteApplications('my')
        await fetchRemoteApplications('pending')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to update remote application')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating remote application:', error)
      setErrorMessage('Failed to update remote application')
      setShowErrorPopup(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Remote Click
  const handleDeleteRemoteClick = (id: number) => {
    setDeletingRemoteId(id)
    setIsDeleteRemoteDialogOpen(true)
  }

  // Handle Delete Remote Confirm
  const handleDeleteRemoteConfirm = async () => {
    if (!deletingRemoteId) return

    try {
      const response = await fetch(`/api/remote-work/applications?id=${deletingRemoteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('Remote work application deleted successfully')
        setShowSuccessPopup(true)
        setIsDeleteRemoteDialogOpen(false)
        setDeletingRemoteId(null)

        // Refresh all remote applications
        await fetchRemoteApplications('all')
        await fetchRemoteApplications('my')
        await fetchRemoteApplications('pending')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to delete remote application')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting remote application:', error)
      setErrorMessage('Failed to delete remote application')
      setShowErrorPopup(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation session={session} />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Leave Management</h1>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleOpenAddLeaveDialog}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Leave
            </Button>
            <Button
              onClick={() => setIsApplyDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
            <Button
              onClick={() => {
                // Check if employee has reached the 6-month limit (4 days)
                if (remoteValidation?.usage?.sixMonths?.used >= 4) {
                  setShowRemoteLimitReachedDialog(true)
                } else {
                  setIsApplyRemoteDialogOpen(true)
                }
              }}
              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full sm:w-auto ${
                remoteValidation?.usage?.sixMonths?.used >= 4 ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Apply Remote
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex gap-3 bg-gray-50 p-1.5 rounded-lg">
              <TabsTrigger
                value="employees-leave-balance"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4 text-purple-600" />
                <span>Employees Leave Balance</span>
              </TabsTrigger>
              <TabsTrigger
                value="my-applications"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <User className="h-4 w-4 text-blue-600" />
                <span>My Applications</span>
              </TabsTrigger>
              <TabsTrigger
                value="all-applications"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-green-600" />
                <span>All Applications</span>
              </TabsTrigger>
              <TabsTrigger
                value="pending-approvals"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Pending Approvals (HR)</span>
              </TabsTrigger>
              <TabsTrigger
                value="manager-approvals"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span>Manager Approvals</span>
              </TabsTrigger>
              <TabsTrigger
                value="remote-work"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center gap-2"
              >
                <CalendarDays className="h-4 w-4 text-purple-600" />
                <span>Remote Work</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Applications Tab */}
          <TabsContent value="my-applications">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Year Filter */}
                <div className="mb-4">
                  <div className="w-48">
                    <Label htmlFor="myAppFilterYear">Filter by Year (From July onwards)</Label>
                    <Select
                      value={myAppFilterYear.toString()}
                      onValueChange={(value) => setMyAppFilterYear(parseInt(value))}
                    >
                      <SelectTrigger id="myAppFilterYear">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {[2024, 2025, 2026, 2027, 2028].map(year => (
                          <SelectItem key={year} value={year.toString()} className="bg-white hover:bg-gray-100">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee, leave type, reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredMyApplications.length} of {applications.length} applications
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Leave Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">From Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">To Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Days</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Applied On</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Status</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || loadingMy ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <p className="text-muted-foreground text-sm">Loading applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredMyApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No matching applications found' : 'No leave applications found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMyApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>{getLeaveTypeBadge(app.leave_type_name)}</TableCell>
                          <TableCell>{app.from_date}</TableCell>
                          <TableCell>{app.to_date}</TableCell>
                          <TableCell>{app.no_of_days}</TableCell>
                          <TableCell>{getLeaveDayTypeBadge(app.leave_day_type)}</TableCell>
                          <TableCell>
                            {app.application_date ? new Date(app.application_date).toLocaleDateString('en-GB') : 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.approval_status, app.approved, app.approval_status_lm)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="all-applications">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Year Filter */}
                <div className="mb-4">
                  <div className="w-48">
                    <Label htmlFor="allAppFilterYear">Filter by Year (From July onwards)</Label>
                    <Select
                      value={allAppFilterYear.toString()}
                      onValueChange={(value) => setAllAppFilterYear(parseInt(value))}
                    >
                      <SelectTrigger id="allAppFilterYear">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {[2024, 2025, 2026, 2027, 2028].map(year => (
                          <SelectItem key={year} value={year.toString()} className="bg-white hover:bg-gray-100">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, ID, department, leave type..."
                      value={allSearchTerm}
                      onChange={(e) => setAllSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {allSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredAllApplications.length} of {allApplications.length} applications
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Employee</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Emp ID</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Leave Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">From Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">To Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Days</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Applied On</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Status</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || loadingAll ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-muted-foreground text-sm">Loading all applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredAllApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          {allSearchTerm ? 'No matching applications found' : 'No leave applications found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAllApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
                          <TableCell>{getLeaveTypeBadge(app.leave_type_name)}</TableCell>
                          <TableCell>{app.from_date}</TableCell>
                          <TableCell>{app.to_date}</TableCell>
                          <TableCell>{app.no_of_days}</TableCell>
                          <TableCell>{getLeaveDayTypeBadge(app.leave_day_type)}</TableCell>
                          <TableCell>
                            {app.application_date ? new Date(app.application_date).toLocaleDateString('en-GB') : 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.approval_status, app.approved, app.approval_status_lm)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <button
                                className="inline-flex items-center justify-center rounded-md h-7 px-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                                onClick={() => handleEditClick(app)}
                                title="Edit application"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                className="inline-flex items-center justify-center rounded-md h-7 px-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                onClick={() => handleDeleteClick(app)}
                                title="Delete application"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending-approvals">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, department, leave type..."
                      value={pendingSearchTerm}
                      onChange={(e) => setPendingSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {pendingSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredPendingApplications.length} of {pendingApplications.length} pending applications
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Employee</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Emp ID</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Leave Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">From Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">To Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Days</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Applied On</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Actions</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || loadingPending ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            <p className="text-muted-foreground text-sm">Loading pending applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPendingApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {pendingSearchTerm ? 'No matching pending applications found' : 'No pending applications'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
                          <TableCell>{getLeaveTypeBadge(app.leave_type_name)}</TableCell>
                          <TableCell>{app.from_date}</TableCell>
                          <TableCell>{app.to_date}</TableCell>
                          <TableCell>{app.no_of_days}</TableCell>
                          <TableCell>{getLeaveDayTypeBadge(app.leave_day_type)}</TableCell>
                          <TableCell>
                            {app.application_date ? new Date(app.application_date).toLocaleDateString('en-GB') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {app.approved === 1 ? (
                                <span className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </span>
                              ) : app.approved === 2 ? (
                                <span className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </span>
                              ) : (
                                <>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                                    onClick={() => handleHRApproveReject(app.id, true)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    onClick={() => handleHRApproveReject(app.id, false)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manager Approvals Tab */}
          <TabsContent value="manager-approvals">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, department, leave type..."
                      value={managerSearchTerm}
                      onChange={(e) => setManagerSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {managerSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredManagerApplications.length} of {managerApplications.length} applications
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Employee</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Reporting Manager</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Leave Type</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">From Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">To Date</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Days</span>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Status</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Actions</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || loadingManager ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-muted-foreground text-sm">Loading manager applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredManagerApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {managerSearchTerm ? 'No matching applications found' : 'No applications for your team members'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredManagerApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-indigo-600" />
                              <span className="font-medium text-indigo-700">{app.reporting_manager_name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getLeaveTypeBadge(app.leave_type_name)}</TableCell>
                          <TableCell>{app.from_date}</TableCell>
                          <TableCell>{app.to_date}</TableCell>
                          <TableCell>{app.no_of_days}</TableCell>
                          <TableCell>{getStatusBadge(app.approval_status, app.approved, app.approval_status_lm)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {app.approval_status_lm === 1 ? (
                                <span className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </span>
                              ) : app.approval_status_lm === 2 ? (
                                <span className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </span>
                              ) : (
                                <>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                                    onClick={() => handleManagerApproveReject(app.id, true)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    onClick={() => handleManagerApproveReject(app.id, false)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Leave Balance Tab */}
          <TabsContent value="employees-leave-balance">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Year Filter and Search Bar */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-48">
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger className="bg-white">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()} className="bg-white hover:bg-gray-100">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, ID, department..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Employee</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Emp ID</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Manager</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Total Leaves</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Annual</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Sick</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Emergency</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Remaining</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Action</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || loadingBalances ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="text-muted-foreground text-sm">Loading employee data...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEmployeeBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {employeeSearchTerm ? 'No matching employees found' : 'No employee data found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployeeBalances.map((emp) => (
                        <TableRow key={emp.emp_id}>
                          <TableCell className="font-medium">{emp.employee_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{emp.emp_id}</TableCell>
                          <TableCell className="text-sm">{emp.manager_name}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                              {emp.total_allocated}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                              {emp.annual_used}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">
                              {emp.sick_used}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                              {emp.emergency_used}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                              {emp.total_remaining}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
                              onClick={() => handleViewEmployeeLeaves(emp.emp_id, emp.employee_name)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remote Work Tab */}
          <TabsContent value="remote-work">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={handleOpenAddRemoteDialog}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Remote
                  </Button>
                </div>
                <Tabs defaultValue="employee-remote-balance" className="w-full">
                  <div className="overflow-x-auto mb-4">
                    <TabsList className="inline-flex">
                      <TabsTrigger value="employee-remote-balance" className="whitespace-nowrap">Employee Remote Balance</TabsTrigger>
                      <TabsTrigger value="my-remote" className="whitespace-nowrap">My Remote Applications</TabsTrigger>
                      <TabsTrigger value="all-remote" className="whitespace-nowrap">All Remote Applications</TabsTrigger>
                      <TabsTrigger value="pending-remote" className="whitespace-nowrap">Pending Remote Approvals</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* My Remote Applications */}
                  <TabsContent value="my-remote">
                    <div className="mb-4">
                      <Input
                        type="text"
                        placeholder="Search by date or manager..."
                        value={searchMyRemote}
                        onChange={(e) => setSearchMyRemote(e.target.value)}
                        className="w-full sm:max-w-md"
                      />
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>From Date</TableHead>
                          <TableHead>To Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingRemote ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-muted-foreground text-sm">Loading remote applications...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredMyRemoteApplications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              {searchMyRemote ? 'No matching applications found' : 'No remote work applications found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMyRemoteApplications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell>{new Date(app.from_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>{new Date(app.to_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                                  {app.number_of_days || 1} {(app.number_of_days || 1) === 1 ? 'day' : 'days'}
                                </span>
                              </TableCell>
                              <TableCell>{new Date(app.application_date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>{app.manager_name || 'N/A'}</TableCell>
                              <TableCell>
                                {app.approved === 0 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
                                    Pending
                                  </span>
                                )}
                                {app.approved === 1 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                                    Approved
                                  </span>
                                )}
                                {app.approved === 2 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                    Rejected
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => setIsRemoteUsageDialogOpen(true)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Usage
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </TabsContent>

                  {/* All Remote Applications */}
                  <TabsContent value="all-remote">
                    <div className="mb-4">
                      <Input
                        type="text"
                        placeholder="Search by employee name, ID, or date..."
                        value={searchAllRemote}
                        onChange={(e) => setSearchAllRemote(e.target.value)}
                        className="w-full sm:max-w-md"
                      />
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Emp ID</TableHead>
                          <TableHead>From Date</TableHead>
                          <TableHead>To Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingRemote ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-muted-foreground text-sm">Loading remote applications...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredAllRemoteApplications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              {searchAllRemote ? 'No matching applications found' : 'No remote work applications found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAllRemoteApplications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.employee_name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
                              <TableCell>{new Date(app.from_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>{new Date(app.to_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                                  {app.number_of_days || 1} {(app.number_of_days || 1) === 1 ? 'day' : 'days'}
                                </span>
                              </TableCell>
                              <TableCell>{new Date(app.application_date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                {app.approved === 0 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
                                    Pending
                                  </span>
                                )}
                                {app.approved === 1 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                                    Approved
                                  </span>
                                )}
                                {app.approved === 2 && (
                                  <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                    Rejected
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditRemoteClick(app)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRemoteClick(app.id)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pending Remote Approvals */}
                  <TabsContent value="pending-remote">
                    <div className="mb-4">
                      <Input
                        type="text"
                        placeholder="Search by employee name, ID, or date..."
                        value={searchPendingRemote}
                        onChange={(e) => setSearchPendingRemote(e.target.value)}
                        className="w-full sm:max-w-md"
                      />
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Emp ID</TableHead>
                          <TableHead>From Date</TableHead>
                          <TableHead>To Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingRemote ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-muted-foreground text-sm">Loading pending applications...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredPendingRemoteApplications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              {searchPendingRemote ? 'No matching applications found' : 'No pending remote work applications'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPendingRemoteApplications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.employee_name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
                              <TableCell>{new Date(app.from_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>{new Date(app.to_date || app.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md h-6 px-2 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                                  {app.number_of_days || 1} {(app.number_of_days || 1) === 1 ? 'day' : 'days'}
                                </span>
                              </TableCell>
                              <TableCell>{new Date(app.application_date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-7 px-2 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                                    onClick={() => handleRemoteApproval(app.id, 'approve')}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-7 px-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    onClick={() => handleRemoteApproval(app.id, 'reject')}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Employee Remote Balance */}
                  <TabsContent value="employee-remote-balance">
                    <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                      <Input
                        type="text"
                        placeholder="Search by employee name, ID, or manager..."
                        value={searchRemoteBalance}
                        onChange={(e) => setSearchRemoteBalance(e.target.value)}
                        className="w-full sm:max-w-md sm:flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Select Month:
                        </label>
                        <Input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => {
                            setSelectedMonth(e.target.value)
                            fetchEmployeeRemoteBalances(e.target.value)
                          }}
                          className="w-full sm:w-40"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Emp ID</TableHead>
                          <TableHead>Reporting Manager</TableHead>
                          <TableHead>Total Remote (6 Months)</TableHead>
                          <TableHead>6 Months Used</TableHead>
                          <TableHead>6 Months Remaining</TableHead>
                          <TableHead>Month Used <span className="text-xs text-green-700 bg-green-200 px-1.5 py-0.5 rounded font-medium">({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span></TableHead>
                          <TableHead>Month Remaining <span className="text-xs text-green-700 bg-green-200 px-1.5 py-0.5 rounded font-medium">({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span></TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingRemoteBalances ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-muted-foreground text-sm">Loading employee remote balances...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredEmployeeRemoteBalances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              {searchRemoteBalance ? 'No matching employees found' : 'No employee remote balance data found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEmployeeRemoteBalances.map((emp) => (
                            <TableRow key={emp.emp_id}>
                              <TableCell className="font-medium">{emp.emp_name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{emp.emp_id}</TableCell>
                              <TableCell className="text-sm">{emp.manager_name || 'N/A'}</TableCell>
                              <TableCell>
                                <span className="font-semibold text-blue-700">4</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-purple-700">{emp.sixMonths.used || 0}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-md h-6 px-2 text-xs font-medium ${
                                  emp.sixMonths.remaining === 0
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : emp.sixMonths.remaining <= 1
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                    : 'bg-green-100 text-green-700 border border-green-300'
                                }`}>
                                  {emp.sixMonths.remaining} days
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-purple-700">{emp.oneMonth.used || 0}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-md h-6 px-2 text-xs font-medium ${
                                  emp.oneMonth.remaining === 0
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : emp.oneMonth.remaining <= 0
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                    : 'bg-green-100 text-green-700 border border-green-300'
                                }`}>
                                  {emp.oneMonth.remaining} days
                                </span>
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => {
                                    setSelectedEmployeeDetails(emp)
                                    setIsEmployeeDetailsDialogOpen(true)
                                  }}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Apply for Leave
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Leave Type *
                </Label>
                <Select
                  value={newLeave.leaveType}
                  onValueChange={(value) => handleInputChange('leaveType', value)}
                >
                  <SelectTrigger className="bg-white border-purple-200 focus:ring-purple-500">
                    <SelectValue placeholder="Select leave type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="bg-white hover:bg-purple-50">
                        {type.leave_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="h-4 w-4 text-blue-600" />
                  Reporting Manager
                </Label>
                <Input
                  type="text"
                  value={currentEmployeeManager}
                  readOnly
                  className="bg-blue-50 border-blue-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  From Date *
                </Label>
                <Input
                  type="date"
                  value={newLeave.fromDate}
                  onChange={(e) => handleInputChange('fromDate', e.target.value)}
                  className="bg-white border-green-200 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-red-600" />
                  To Date *
                </Label>
                <Input
                  type="date"
                  value={newLeave.toDate}
                  onChange={(e) => handleInputChange('toDate', e.target.value)}
                  min={newLeave.fromDate}
                  className="bg-white border-red-200 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Hash className="h-4 w-4 text-amber-600" />
                  Number of Days
                </Label>
                <Input
                  type="number"
                  value={newLeave.numberOfDays}
                  readOnly
                  className="bg-amber-50 border-amber-200 font-semibold text-amber-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                <Timer className="h-4 w-4 text-indigo-600" />
                Leave Day Type *
              </Label>
              <Select
                value={newLeave.leaveDayType}
                onValueChange={(value) => handleInputChange('leaveDayType', value)}
              >
                <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="1" className="bg-white hover:bg-indigo-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Full Day
                    </div>
                  </SelectItem>
                  <SelectItem value="2" className="bg-white hover:bg-indigo-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Half Day
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newLeave.leaveDayType === '2' && (
              <div className="space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <Label htmlFor="halfDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Half Day Type
                </Label>
                <Select
                  value={newLeave.halfDayType}
                  onValueChange={(value) => handleInputChange('halfDayType', value)}
                >
                  <SelectTrigger className="bg-white border-orange-200 focus:ring-orange-500">
                    <SelectValue placeholder="Select half day type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="First" className="bg-white hover:bg-orange-50">First Half</SelectItem>
                    <SelectItem value="Second" className="bg-white hover:bg-orange-50">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason" className="flex items-center gap-2 text-gray-700 font-medium">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                Reason (Optional)
              </Label>
              <Textarea
                value={newLeave.reason}
                onChange={handleReasonChange}
                placeholder="Enter reason for leave (optional)..."
                rows={3}
                className="bg-white border-teal-200 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <Button
              variant="outline"
              onClick={() => setIsApplyDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitLeave}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Leave Details Dialog */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Leave Details - {selectedEmployeeName} ({selectedYear})</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Employee Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Leave Policy:</span>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                  {selectedEmployeePolicy}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Year:</span>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                  {selectedYear}
                </Badge>
              </div>
            </div>

            {/* Leave Balance Cards */}
            {employeeLeaveBalance.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {employeeLeaveBalance.map((balance) => (
                  <Card key={balance.leaveTypeId} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {balance.leaveTypeName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Allocated:</span>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                            {balance.allocated}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Used:</span>
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                            {balance.used}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Remaining:</span>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                            {balance.remaining}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Leave History Table */}
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Leave Application History</h3>
            {employeeLeaveDetails.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No leave applications found for this employee</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">Leave Type</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">From - To</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <span className="text-gray-700 font-semibold">Days</span>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">Type</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">Applied On</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">Status</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeLeaveDetails.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{getLeaveTypeBadge(app.leave_type_name)}</TableCell>
                      <TableCell>
                        {app.from_date} <br />
                        <span className="text-muted-foreground text-sm">to {app.to_date}</span>
                      </TableCell>
                      <TableCell>{app.no_of_days}</TableCell>
                      <TableCell>{getLeaveDayTypeBadge(app.leave_day_type)}</TableCell>
                      <TableCell>
                        {app.application_date ? new Date(app.application_date).toLocaleDateString('en-GB') : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.approval_status, app.approved)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Leave Dialog */}
      <Dialog open={isAddLeaveDialogOpen} onOpenChange={setIsAddLeaveDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Add Leave for Employee
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectEmployee" className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="h-4 w-4 text-purple-600" />
                  Select Employee *
                </Label>
                <SearchableSelect
                  options={formattedEmployeeOptions}
                  value={selectedEmployeeValue}
                  onValueChange={handleEmployeeSelect}
                  placeholder="Search and select employee..."
                  searchPlaceholder="Type to search employees..."
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
                {formattedEmployeeOptions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Loading employees...</p>
                )}
                {formattedEmployeeOptions.length > 0 && (
                  <p className="text-sm text-purple-600 mt-1">✅ {formattedEmployeeOptions.length} employees available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerName" className="flex items-center gap-2 text-gray-700 font-medium">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Reporting Manager
                </Label>
                <Input
                  type="text"
                  value={addLeaveData.managerName}
                  readOnly
                  className="bg-blue-50 border-blue-200"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addLeaveType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Leave Type *
                </Label>
                <Select
                  value={addLeaveData.leaveType}
                  onValueChange={(value) => setAddLeaveData(prev => ({ ...prev, leaveType: value }))}
                >
                  <SelectTrigger className="bg-white border-purple-200 focus:ring-purple-500">
                    <SelectValue placeholder="Select leave type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="bg-white hover:bg-purple-50">
                        {type.leave_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addLeaveDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  Leave Day Type *
                </Label>
                <Select
                  value={addLeaveData.leaveDayType}
                  onValueChange={(value) => setAddLeaveData(prev => ({ ...prev, leaveDayType: value }))}
                >
                  <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1" className="bg-white hover:bg-indigo-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Full Day
                      </div>
                    </SelectItem>
                    <SelectItem value="2" className="bg-white hover:bg-indigo-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Half Day
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addFromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  From Date *
                </Label>
                <Input
                  type="date"
                  value={addLeaveData.fromDate}
                  onChange={(e) => setAddLeaveData(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addToDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  To Date *
                </Label>
                <Input
                  type="date"
                  value={addLeaveData.toDate}
                  onChange={(e) => setAddLeaveData(prev => ({ ...prev, toDate: e.target.value }))}
                  min={addLeaveData.fromDate}
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Hash className="h-4 w-4 text-amber-600" />
                  Number of Days
                </Label>
                <Input
                  type="number"
                  value={addLeaveData.numberOfDays}
                  readOnly
                  className="bg-amber-50 border-amber-200 font-semibold text-amber-700"
                />
              </div>
            </div>

            {addLeaveData.leaveDayType === '2' && (
              <div className="space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <Label htmlFor="addHalfDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Half Day Type
                </Label>
                <Select
                  value={addLeaveData.halfDayType}
                  onValueChange={(value) => setAddLeaveData(prev => ({ ...prev, halfDayType: value }))}
                >
                  <SelectTrigger className="bg-white border-orange-200 focus:ring-orange-500">
                    <SelectValue placeholder="Select half day type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="First" className="bg-white hover:bg-orange-50">First Half</SelectItem>
                    <SelectItem value="Second" className="bg-white hover:bg-orange-50">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="addReason" className="flex items-center gap-2 text-gray-700 font-medium">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                Reason (Optional)
              </Label>
              <Textarea
                value={addLeaveData.reason}
                onChange={(e) => setAddLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for leave (optional)..."
                rows={3}
                className="bg-white border-purple-200 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddLeaveDialogOpen(false)
                setAddLeaveData({
                  empId: '',
                  empName: '',
                  managerName: '',
                  leaveType: '',
                  leaveDayType: '1',
                  fromDate: '',
                  toDate: '',
                  numberOfDays: 1,
                  halfDayType: '',
                  reason: ''
                })
                setSelectedEmployeeForAdd(null)
              }}
              className="border-gray-300 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAddLeave}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Leave...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Leave
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-gray-900">Confirm Deletion</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 text-base leading-relaxed">
              Are you sure you want to delete the leave application for{' '}
              <span className="font-semibold text-gray-900">{deletingApplicationName}</span>?
            </p>
            <p className="text-sm text-red-600 mt-3 bg-red-50 p-3 rounded-md border border-red-200">
              <strong>Warning:</strong> This action cannot be undone. The application and all its data will be permanently removed.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingApplicationId(null)
                setDeletingApplicationName('')
              }}
              disabled={isDeleting}
              className="border-gray-300 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Pencil className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Edit Leave Application
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLeaveType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Leave Type *
                </Label>
                <Select
                  value={editLeave.leaveType}
                  onValueChange={(value) => setEditLeave(prev => ({ ...prev, leaveType: value }))}
                >
                  <SelectTrigger className="bg-white border-purple-200 focus:ring-purple-500">
                    <SelectValue placeholder="Select leave type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="bg-white hover:bg-purple-50">
                        {type.leave_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLeaveDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  Leave Day Type *
                </Label>
                <Select
                  value={editLeave.leaveDayType}
                  onValueChange={(value) => setEditLeave(prev => ({ ...prev, leaveDayType: value }))}
                >
                  <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1" className="bg-white hover:bg-indigo-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Full Day
                      </div>
                    </SelectItem>
                    <SelectItem value="2" className="bg-white hover:bg-indigo-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Half Day
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  From Date *
                </Label>
                <Input
                  type="date"
                  value={editLeave.fromDate}
                  onChange={(e) => setEditLeave(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="bg-white border-green-200 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editToDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-red-600" />
                  To Date *
                </Label>
                <Input
                  type="date"
                  value={editLeave.toDate}
                  onChange={(e) => setEditLeave(prev => ({ ...prev, toDate: e.target.value }))}
                  min={editLeave.fromDate}
                  className="bg-white border-red-200 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Hash className="h-4 w-4 text-amber-600" />
                  Number of Days
                </Label>
                <Input
                  type="number"
                  value={editLeave.numberOfDays}
                  readOnly
                  className="bg-amber-50 border-amber-200 font-semibold text-amber-700"
                />
              </div>
            </div>

            {editLeave.leaveDayType === '2' && (
              <div className="space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <Label htmlFor="editHalfDayType" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Half Day Type
                </Label>
                <Select
                  value={editLeave.halfDayType}
                  onValueChange={(value) => setEditLeave(prev => ({ ...prev, halfDayType: value }))}
                >
                  <SelectTrigger className="bg-white border-orange-200 focus:ring-orange-500">
                    <SelectValue placeholder="Select half day type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="First" className="bg-white hover:bg-orange-50">First Half</SelectItem>
                    <SelectItem value="Second" className="bg-white hover:bg-orange-50">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editReason" className="flex items-center gap-2 text-gray-700 font-medium">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                Reason *
              </Label>
              <Textarea
                value={editLeave.reason}
                onChange={(e) => setEditLeave(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for leave..."
                rows={3}
                className="bg-white border-teal-200 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingApplication(null)
              }}
              className="border-gray-300 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Remote Work Dialog */}
      <Dialog open={isApplyRemoteDialogOpen} onOpenChange={setIsApplyRemoteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Apply for Remote Work
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Validation Info */}
          {remoteValidation && (
            <div className="space-y-3 mb-4 p-4 bg-white/60 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Last 6 Months:</span>
                <span className="font-semibold text-purple-700">
                  {remoteValidation.usage?.sixMonths.used || 0} / 4 used
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Last Month:</span>
                <span className="font-semibold text-purple-700">
                  {remoteValidation.usage?.oneMonth.used || 0} / 2 used
                </span>
              </div>
              {!remoteValidation.canApply && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {remoteValidation.reason}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Date Range Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  From Date *
                </label>
                <input
                  type="date"
                  value={remoteWorkData.fromDate}
                  onChange={(e) => setRemoteWorkData(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="w-full p-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  To Date *
                </label>
                <input
                  type="date"
                  value={remoteWorkData.toDate}
                  onChange={(e) => setRemoteWorkData(prev => ({ ...prev, toDate: e.target.value }))}
                  className="w-full p-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Number of Days Display */}
            {remoteWorkData.fromDate && remoteWorkData.toDate && (
              <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Working Days:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {remoteWorkData.numberOfDays} {remoteWorkData.numberOfDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Excludes weekends (Saturday & Sunday)</p>
              </div>
            )}

            {/* Reason Field */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-semibold text-gray-700">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                value={remoteWorkData.reason}
                onChange={(e) => setRemoteWorkData(prev => ({ ...prev, reason: e.target.value }))}
                className="min-h-[100px] border-purple-200 focus:ring-purple-500 bg-white"
                placeholder="Why do you need to work remotely?"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleRemoteApplication}
              disabled={submitting || !remoteWorkData.fromDate || !remoteWorkData.toDate}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Remote Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Remote Work Dialog (for HR) */}
      <Dialog open={isAddRemoteDialogOpen} onOpenChange={setIsAddRemoteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Add Remote Work for Employee
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectEmployeeRemote" className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="h-4 w-4 text-purple-600" />
                  Select Employee *
                </Label>
                <SearchableSelect
                  options={formattedEmployeeOptions}
                  value={selectedEmployeeValueForRemote}
                  onValueChange={handleEmployeeSelectForRemote}
                  placeholder="Search and select employee..."
                  searchPlaceholder="Type to search employees..."
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
                {formattedEmployeeOptions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Loading employees...</p>
                )}
                {formattedEmployeeOptions.length > 0 && (
                  <p className="text-sm text-purple-600 mt-1">✅ {formattedEmployeeOptions.length} employees available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remoteManagerName" className="flex items-center gap-2 text-gray-700 font-medium">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Reporting Manager
                </Label>
                <Input
                  type="text"
                  value={addRemoteData.managerName}
                  readOnly
                  className="bg-blue-50 border-blue-200"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="remoteFromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  From Date *
                </Label>
                <Input
                  type="date"
                  value={addRemoteData.fromDate}
                  onChange={(e) => setAddRemoteData(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remoteToDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  To Date *
                </Label>
                <Input
                  type="date"
                  value={addRemoteData.toDate}
                  onChange={(e) => setAddRemoteData(prev => ({ ...prev, toDate: e.target.value }))}
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Number of Days Display */}
            {addRemoteData.fromDate && addRemoteData.toDate && (
              <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Working Days:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {addRemoteData.numberOfDays} {addRemoteData.numberOfDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Excludes weekends (Saturday & Sunday)</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="remoteReason" className="flex items-center gap-2 text-gray-700 font-medium">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                Reason (Optional)
              </Label>
              <Textarea
                value={addRemoteData.reason}
                onChange={(e) => setAddRemoteData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for remote work..."
                rows={3}
                className="bg-white border-purple-200 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRemoteDialogOpen(false)
                setAddRemoteData({
                  empId: '',
                  empName: '',
                  managerName: '',
                  fromDate: '',
                  toDate: '',
                  numberOfDays: 1,
                  reason: ''
                })
                setSelectedEmployeeForRemote(null)
              }}
              className="border-gray-300 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAddRemote}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Remote...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Remote Work
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Remote Work Dialog */}
      <Dialog open={isEditRemoteDialogOpen} onOpenChange={setIsEditRemoteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Pencil className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Edit Remote Work
              </span>
            </DialogTitle>
          </DialogHeader>

          {editingRemoteApplication && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Employee:</p>
                <p className="font-semibold text-gray-900">{editingRemoteApplication.employee_name}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {editingRemoteApplication.emp_id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRemoteFromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    From Date *
                  </Label>
                  <Input
                    type="date"
                    value={editRemoteData.fromDate}
                    onChange={(e) => setEditRemoteData(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="bg-white border-purple-200 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editRemoteToDate" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    To Date *
                  </Label>
                  <Input
                    type="date"
                    value={editRemoteData.toDate}
                    onChange={(e) => setEditRemoteData(prev => ({ ...prev, toDate: e.target.value }))}
                    className="bg-white border-purple-200 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Number of Days Display */}
              {editRemoteData.fromDate && editRemoteData.toDate && (
                <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Working Days:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {editRemoteData.numberOfDays} {editRemoteData.numberOfDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Excludes weekends (Saturday & Sunday)</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="editRemoteReason" className="flex items-center gap-2 text-gray-700 font-medium">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  Reason (Optional)
                </Label>
                <Textarea
                  value={editRemoteData.reason}
                  onChange={(e) => setEditRemoteData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for remote work..."
                  rows={3}
                  className="bg-white border-purple-200 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditRemoteDialogOpen(false)
                    setEditingRemoteApplication(null)
                  }}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditRemoteSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Remote Work
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Remote Confirmation Dialog */}
      <Dialog open={isDeleteRemoteDialogOpen} onOpenChange={setIsDeleteRemoteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-gray-900">Confirm Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this remote work application? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteRemoteDialogOpen(false)
                  setDeletingRemoteId(null)
                }}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteRemoteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remote Work Usage Stats Dialog */}
      <Dialog open={isRemoteUsageDialogOpen} onOpenChange={setIsRemoteUsageDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Remote Work Usage Stats
              </span>
            </DialogTitle>
          </DialogHeader>

          {remoteValidation && remoteValidation.usage && (
            <div className="space-y-4 py-4">
              {/* 6 Months Usage Card */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Last 6 Months Usage
                </h3>
                <div className="text-4xl font-bold text-purple-700 mb-2">
                  {remoteValidation.usage.sixMonths.used} / {remoteValidation.usage.sixMonths.limit}
                </div>
                <p className="text-sm text-purple-600">
                  {remoteValidation.usage.sixMonths.remaining} days remaining
                </p>

                {remoteValidation.usage.sixMonths.applications && remoteValidation.usage.sixMonths.applications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recent Applications:</p>
                    <div className="space-y-1">
                      {remoteValidation.usage.sixMonths.applications.slice(0, 3).map((app: any) => (
                        <div key={app.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          {new Date(app.date).toLocaleDateString('en-GB')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 1 Month Usage Card */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Last Month Usage
                </h3>
                <div className="text-4xl font-bold text-purple-700 mb-2">
                  {remoteValidation.usage.oneMonth.used} / {remoteValidation.usage.oneMonth.limit}
                </div>
                <p className="text-sm text-purple-600">
                  {remoteValidation.usage.oneMonth.remaining} days remaining this month
                </p>

                {remoteValidation.usage.oneMonth.applications && remoteValidation.usage.oneMonth.applications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Recent Applications:</p>
                    <div className="space-y-1">
                      {remoteValidation.usage.oneMonth.applications.map((app: any) => (
                        <div key={app.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          {new Date(app.date).toLocaleDateString('en-GB')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIsRemoteUsageDialogOpen(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remote Limit Reached Dialog */}
      <Dialog open={showRemoteLimitReachedDialog} onOpenChange={setShowRemoteLimitReachedDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200">
          <DialogHeader className="pb-4 border-b border-red-200">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full animate-pulse">
                <AlertCircle className="h-7 w-7 text-white" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent font-bold">
                Remote Limit Reached
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Main Message */}
            <div className="text-center space-y-3">
              <div className="p-6 bg-white/80 rounded-lg border-2 border-red-200 shadow-sm">
                <p className="text-lg font-semibold text-gray-800 mb-3">
                  You have used all your remote work days!
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full border border-red-300">
                  <span className="text-3xl font-bold text-red-700">
                    {remoteValidation?.usage?.sixMonths?.used || 4} / 4
                  </span>
                  <span className="text-sm text-red-600">days used</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-5 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">
                    What should you do?
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    You have reached the maximum limit of <span className="font-bold text-orange-700">4 remote work days in 6 months</span>. Please contact the HR department for further assistance or to request an exception.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 bg-white/60 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Contact HR Department
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Human Resources</span>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setShowRemoteLimitReachedDialog(false)}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 shadow-md"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={isEmployeeDetailsDialogOpen} onOpenChange={setIsEmployeeDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Employee Remote Work Details
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedEmployeeDetails && (
            <div className="space-y-6 py-4">
              {/* Employee Info Card */}
              <div className="p-6 bg-white/80 rounded-lg border border-purple-200 shadow-sm">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Employee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{selectedEmployeeDetails.emp_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Employee ID</p>
                    <p className="font-semibold text-gray-900">{selectedEmployeeDetails.emp_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Reporting Manager</p>
                    <p className="font-semibold text-gray-900">{selectedEmployeeDetails.manager_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Designation</p>
                    <p className="font-semibold text-gray-900">{selectedEmployeeDetails.designation_name}</p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 6 Months Stats */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Last 6 Months
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Total Limit:</span>
                      <span className="font-bold text-purple-700">4 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Used:</span>
                      <span className="font-bold text-purple-700">{selectedEmployeeDetails.sixMonths.used} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Remaining:</span>
                      <span className={`font-bold ${
                        selectedEmployeeDetails.sixMonths.remaining === 0
                          ? 'text-red-600'
                          : selectedEmployeeDetails.sixMonths.remaining <= 1
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {selectedEmployeeDetails.sixMonths.remaining} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Month Stats */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Monthly Limit:</span>
                      <span className="font-bold text-purple-700">2 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Used:</span>
                      <span className="font-bold text-purple-700">{selectedEmployeeDetails.oneMonth.used} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Remaining:</span>
                      <span className={`font-bold ${
                        selectedEmployeeDetails.oneMonth.remaining === 0
                          ? 'text-red-600'
                          : selectedEmployeeDetails.oneMonth.remaining <= 0
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {selectedEmployeeDetails.oneMonth.remaining} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Months Applications */}
              {selectedEmployeeDetails.sixMonths.applications && selectedEmployeeDetails.sixMonths.applications.length > 0 && (
                <div className="p-6 bg-white/80 rounded-lg border border-purple-200 shadow-sm">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Last 6 Months Applications ({selectedEmployeeDetails.sixMonths.applications.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedEmployeeDetails.sixMonths.applications.map((app: any) => (
                      <div key={app.id} className="p-3 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarDays className="h-4 w-4 text-purple-600" />
                              <span className="font-semibold text-sm text-gray-900">
                                {new Date(app.from_date || app.date).toLocaleDateString('en-GB')} - {new Date(app.to_date || app.date).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {app.number_of_days || 1} {(app.number_of_days || 1) === 1 ? 'day' : 'days'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Applied: {new Date(app.application_date).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex items-center rounded-md h-6 px-2 text-xs font-medium ${
                              app.approved === 1
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : app.approved === 0
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                              {app.approved === 1 ? 'Approved' : app.approved === 0 ? 'Pending' : 'Rejected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Month Applications */}
              {selectedEmployeeDetails.oneMonth.applications && selectedEmployeeDetails.oneMonth.applications.length > 0 && (
                <div className="p-6 bg-white/80 rounded-lg border border-purple-200 shadow-sm">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Applications ({selectedEmployeeDetails.oneMonth.applications.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEmployeeDetails.oneMonth.applications.map((app: any) => (
                      <div key={app.id} className="p-3 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarDays className="h-4 w-4 text-purple-600" />
                              <span className="font-semibold text-sm text-gray-900">
                                {new Date(app.from_date || app.date).toLocaleDateString('en-GB')} - {new Date(app.to_date || app.date).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {app.number_of_days || 1} {(app.number_of_days || 1) === 1 ? 'day' : 'days'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Applied: {new Date(app.application_date).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex items-center rounded-md h-6 px-2 text-xs font-medium ${
                              app.approved === 1
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : app.approved === 0
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                              {app.approved === 1 ? 'Approved' : app.approved === 0 ? 'Pending' : 'Rejected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Applications Message */}
              {(!selectedEmployeeDetails.sixMonths.applications || selectedEmployeeDetails.sixMonths.applications.length === 0) &&
               (!selectedEmployeeDetails.oneMonth.applications || selectedEmployeeDetails.oneMonth.applications.length === 0) && (
                <div className="p-8 bg-white/80 rounded-lg border border-purple-200 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No remote work applications found for this employee</p>
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={() => setIsEmployeeDetailsDialogOpen(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success/Error Popups */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        message={successMessage}
      />
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        message={errorMessage}
      />
    </div>
  )
}
