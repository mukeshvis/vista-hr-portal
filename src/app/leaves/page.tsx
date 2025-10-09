"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle, Search, RefreshCw, User, Users, ClipboardList, FileText, Tag, CalendarDays, Hash, Timer, MessageSquare, CalendarClock, Activity, Eye, UserCheck, Pencil, Trash2 } from "lucide-react"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"

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
  approved: number
  application_date: string
  designation_name: string
  department_name: string
  first_second_half: string
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
}

export default function LeavesPage() {
  const { data: session } = useSession()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [allApplications, setAllApplications] = useState<LeaveApplication[]>([])
  const [pendingApplications, setPendingApplications] = useState<LeaveApplication[]>([])
  const [employeeBalances, setEmployeeBalances] = useState<EmployeeLeaveBalance[]>([])
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentEmpId, setCurrentEmpId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [allSearchTerm, setAllSearchTerm] = useState('')
  const [pendingSearchTerm, setPendingSearchTerm] = useState('')
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
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
    leaveDayType: '1', // 1=Full Day, 2=Half Day, 3=Remote
    fromDate: '',
    toDate: '',
    numberOfDays: 1,
    halfDayType: '', // First/Second
    reason: ''
  })

  useEffect(() => {
    if (session?.user?.emp_id) {
      fetchInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.emp_id])

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
      const url = empId ? `/api/leaves/applications?empId=${empId}` : '/api/leaves/applications'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchAllApplications = async () => {
    try {
      const res = await fetch('/api/leaves/applications')
      if (res.ok) {
        const data = await res.json()
        setAllApplications(data)
      }
    } catch (error) {
      console.error('Error fetching all applications:', error)
    }
  }

  const fetchPendingApplications = async () => {
    try {
      const res = await fetch('/api/leaves/applications?status=0')
      if (res.ok) {
        const data = await res.json()
        setPendingApplications(data)
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error)
    }
  }

  const fetchEmployeeBalances = async () => {
    try {
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

    // Calculate working days (excluding Saturday & Sunday)
    let workingDays = 0
    const currentDate = new Date(from)

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

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

  const handleEmployeeSelect = (empId: string) => {
    const employee = employeeList.find(emp => emp.emp_id === empId)
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

    let workingDays = 0
    const currentDate = new Date(from)

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

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

    if (!addLeaveData.reason.trim()) {
      setErrorMessage('Please provide a reason for leave')
      setShowErrorPopup(true)
      return
    }

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

    // Calculate working days (excluding Saturday & Sunday)
    let workingDays = 0
    const currentDate = new Date(from)

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay()
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (newLeave.leaveDayType === '2') {
      // Half day - half of the total working days
      setNewLeave(prev => ({ ...prev, numberOfDays: workingDays / 2 }))
    } else {
      setNewLeave(prev => ({ ...prev, numberOfDays: workingDays }))
    }
  }, [newLeave.fromDate, newLeave.toDate, newLeave.leaveDayType])

  useEffect(() => {
    calculateDays()
  }, [calculateDays])

  const handleInputChange = useCallback((field: string, value: any) => {
    if (field === 'leaveType') {
      // Check if the new leave type is Annual
      const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === value)
      const isAnnual = selectedLeaveType?.leave_type_name?.toLowerCase().includes('annual')

      // If not Annual and Remote was selected, reset to Full Day
      if (!isAnnual && newLeave.leaveDayType === '3') {
        setNewLeave(prev => ({ ...prev, [field]: value, leaveDayType: '1' }))
        return
      }
    }
    setNewLeave(prev => ({ ...prev, [field]: value }))
  }, [leaveTypes, newLeave.leaveDayType])

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

    if (!newLeave.reason.trim()) {
      setErrorMessage('Please provide a reason for leave')
      setShowErrorPopup(true)
      return
    }

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

  const getStatusBadge = (approvalStatus: number, approved: number) => {
    if (approved === 1) {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Approved</Badge>
    } else if (approved === 2) {
      return <Badge className="bg-red-600 hover:bg-red-700 text-white">Rejected</Badge>
    } else {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Pending</Badge>
    }
  }

  const getLeaveDayTypeBadge = (dayType: number) => {
    switch (dayType) {
      case 1:
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Full Day</Badge>
      case 2:
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">Half Day</Badge>
      case 3:
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">Remote</Badge>
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
  const filterApplications = (apps: LeaveApplication[], search: string) => {
    if (!search.trim()) return apps

    const lowerSearch = search.toLowerCase()
    return apps.filter(app =>
      app.employee_name?.toLowerCase().includes(lowerSearch) ||
      app.emp_id?.toLowerCase().includes(lowerSearch) ||
      app.leave_type_name?.toLowerCase().includes(lowerSearch) ||
      app.reason?.toLowerCase().includes(lowerSearch) ||
      app.department_name?.toLowerCase().includes(lowerSearch)
    )
  }

  const filteredMyApplications = useMemo(() =>
    filterApplications(applications, searchTerm),
    [applications, searchTerm]
  )

  const filteredAllApplications = useMemo(() =>
    filterApplications(allApplications, allSearchTerm),
    [allApplications, allSearchTerm]
  )

  const filteredPendingApplications = useMemo(() =>
    filterApplications(pendingApplications, pendingSearchTerm),
    [pendingApplications, pendingSearchTerm]
  )

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

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation session={session} />

      <main className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Leave Management</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleOpenAddLeaveDialog}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Leave
            </Button>
            <Button onClick={() => setIsApplyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="employees-leave-balance" className="w-full">
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
                <span>Pending Approvals</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Applications Tab */}
          <TabsContent value="my-applications">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee, leave type, reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredMyApplications.length} of {applications.length} applications
                    </p>
                  )}
                </div>

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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-muted-foreground text-sm">Loading applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredMyApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No matching applications found' : 'No leave applications found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMyApplications.map((app) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="all-applications">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, ID, department, leave type..."
                      value={allSearchTerm}
                      onChange={(e) => setAllSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {allSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredAllApplications.length} of {allApplications.length} applications
                    </p>
                  )}
                </div>

                <Table>
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
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-muted-foreground text-sm">Loading applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredAllApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {allSearchTerm ? 'No matching applications found' : 'No leave applications found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAllApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
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
                      className="pl-10"
                    />
                  </div>
                  {pendingSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Found {filteredPendingApplications.length} of {pendingApplications.length} pending applications
                    </p>
                  )}
                </div>

                <Table>
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
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-semibold">Actions</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-muted-foreground text-sm">Loading applications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPendingApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {pendingSearchTerm ? 'No matching pending applications found' : 'No pending applications'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.employee_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{app.emp_id}</TableCell>
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
                                    onClick={() => handleApproveReject(app.id, true)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md h-6 px-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    onClick={() => handleApproveReject(app.id, false)}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Leave Balance Tab */}
          <TabsContent value="employees-leave-balance">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-6">
                {/* Year Filter and Search Bar */}
                <div className="mb-4 flex gap-3">
                  <div className="w-48">
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
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
                        <span className="text-gray-700 font-semibold">Used Leaves</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Remaining</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Applied Applications</span>
                      </TableHead>
                      <TableHead>
                        <span className="text-gray-700 font-semibold">Action</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-muted-foreground text-sm">Loading employee data...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEmployeeBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                              {emp.total_used}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                              {emp.total_remaining}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{emp.total_applications}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
          <DialogHeader className="pb-4 border-b border-purple-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Apply for Leave
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
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
                  {/* Remote option only shows when Annual leave is selected */}
                  {(() => {
                    const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === newLeave.leaveType)
                    const isAnnual = selectedLeaveType?.leave_type_name?.toLowerCase().includes('annual')
                    return isAnnual ? (
                      <SelectItem value="3" className="bg-white hover:bg-indigo-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Remote
                        </div>
                      </SelectItem>
                    ) : null
                  })()}
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
                Reason *
              </Label>
              <Textarea
                value={newLeave.reason}
                onChange={handleReasonChange}
                placeholder="Enter reason for leave..."
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
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
              <div className="grid grid-cols-3 gap-4 mb-6">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <DialogHeader className="pb-4 border-b border-green-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Add Leave for Employee
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectEmployee" className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="h-4 w-4 text-green-600" />
                  Select Employee *
                </Label>
                <Select
                  value={addLeaveData.empId}
                  onValueChange={handleEmployeeSelect}
                >
                  <SelectTrigger className="bg-white border-green-200 focus:ring-green-500">
                    <SelectValue placeholder="Search and select employee..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px]">
                    {employeeList
                      .filter(emp => emp.emp_id && emp.emp_id.trim() !== '')
                      .map((emp, index) => (
                        <SelectItem key={`emp-${emp.id || emp.emp_id}-${index}`} value={emp.emp_id} className="bg-white hover:bg-green-50">
                          {emp.emp_name} ({emp.emp_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-2 gap-4">
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
                    {(() => {
                      const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === addLeaveData.leaveType)
                      const isAnnual = selectedLeaveType?.leave_type_name?.toLowerCase().includes('annual')
                      return isAnnual ? (
                        <SelectItem value="3" className="bg-white hover:bg-indigo-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Remote
                          </div>
                        </SelectItem>
                      ) : null
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addFromDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  From Date *
                </Label>
                <Input
                  type="date"
                  value={addLeaveData.fromDate}
                  onChange={(e) => setAddLeaveData(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="bg-white border-green-200 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addToDate" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CalendarDays className="h-4 w-4 text-red-600" />
                  To Date *
                </Label>
                <Input
                  type="date"
                  value={addLeaveData.toDate}
                  onChange={(e) => setAddLeaveData(prev => ({ ...prev, toDate: e.target.value }))}
                  min={addLeaveData.fromDate}
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
                <MessageSquare className="h-4 w-4 text-teal-600" />
                Reason *
              </Label>
              <Textarea
                value={addLeaveData.reason}
                onChange={(e) => setAddLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for leave..."
                rows={3}
                className="bg-white border-teal-200 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-200">
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
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
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
        <DialogContent className="max-w-md bg-white">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <DialogHeader className="pb-4 border-b border-blue-200">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <Pencil className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Edit Leave Application
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {(() => {
                      const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === editLeave.leaveType)
                      const isAnnual = selectedLeaveType?.leave_type_name?.toLowerCase().includes('annual')
                      return isAnnual ? (
                        <SelectItem value="3" className="bg-white hover:bg-indigo-50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Remote
                          </div>
                        </SelectItem>
                      ) : null
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
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
