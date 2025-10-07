"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { TopNavigation } from "@/components/top-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { GraduationCap, Plus, Search, Edit, Trash2, Building2, Clock, UserCog, Badge, User, Mail, Briefcase, CheckCircle2, Eye, EyeOff } from "lucide-react"

interface PortalSystemProps {}

interface DesignationOption {
  value: string
  label: string
}

interface NewGrade {
  designation_id: string
  employee_grade_type: string
  category: string
}

interface Grade {
  id: number
  designation_id: number
  designation_name: string
  employee_grade_type: string
  category?: string
  status: number
}

interface Designation {
  id: number
  designation_name: string
  status: number
}

interface NewDesignation {
  designation_name: string
}

interface WorkingHoursPolicy {
  id: number
  working_hours_policy: string
  start_working_hours_time: string
  end_working_hours_time: string
  status: number
}

interface NewWorkingHoursPolicy {
  working_hours_policy: string
  start_working_hours_time: string
  end_working_hours_time: string
}

interface User {
  id: number
  emp_id: string | null
  name: string | null
  username: string
  email: string
  password: string
  acc_type: string
  status: number
}

interface NewUser {
  emp_id: string
  acc_type: string
  name: string
  username: string
  email: string
  password: string
  status: number
}

export default function PortalSystemPage() {
  const { data: session } = useSession()

  // Tab Management
  const [activeTab, setActiveTab] = useState('grades')

  // Grades Management State
  const [grades, setGrades] = useState<Grade[]>([])
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [newGrade, setNewGrade] = useState<NewGrade>({
    designation_id: '',
    employee_grade_type: '',
    category: ''
  })
  const [isAddingGrade, setIsAddingGrade] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)

  // Designations Management State
  const [designationsData, setDesignationsData] = useState<Designation[]>([])
  const [filteredDesignations, setFilteredDesignations] = useState<Designation[]>([])
  const [designationSearchTerm, setDesignationSearchTerm] = useState('')
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false)
  const [newDesignation, setNewDesignation] = useState<NewDesignation>({
    designation_name: ''
  })
  const [isAddingDesignation, setIsAddingDesignation] = useState(false)
  const [isDesignationDialogOpen, setIsDesignationDialogOpen] = useState(false)
  const [isEditDesignationDialogOpen, setIsEditDesignationDialogOpen] = useState(false)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)

  // Working Hours Policy State
  const [workingHoursPolicies, setWorkingHoursPolicies] = useState<WorkingHoursPolicy[]>([])
  const [filteredPolicies, setFilteredPolicies] = useState<WorkingHoursPolicy[]>([])
  const [policySearchTerm, setPolicySearchTerm] = useState('')
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false)
  const [newPolicy, setNewPolicy] = useState<NewWorkingHoursPolicy>({
    working_hours_policy: '',
    start_working_hours_time: '',
    end_working_hours_time: ''
  })
  const [isAddingPolicy, setIsAddingPolicy] = useState(false)
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false)
  const [isEditPolicyDialogOpen, setIsEditPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<WorkingHoursPolicy | null>(null)

  // User Management State
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showActiveUsers, setShowActiveUsers] = useState(true)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [newUser, setNewUser] = useState<NewUser>({
    emp_id: '',
    acc_type: 'user',
    name: '',
    username: '',
    email: '',
    password: '',
    status: 1
  })

  // Confirmation Dialog State
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
  } | null>(null)

  // Fetch designations from API (for SearchableSelect)
  const fetchDesignations = useCallback(async () => {
    try {
      const response = await fetch('/api/designations?forSelect=true')
      if (response.ok) {
        const data = await response.json()
        setDesignations(data)
        console.log('✅ Designations loaded:', data.length)
      } else {
        console.error('Failed to fetch designations')
        setDesignations([])
      }
    } catch (error) {
      console.error('Error fetching designations:', error)
      setDesignations([])
    }
  }, [])

  // Fetch designations data for table
  const fetchDesignationsData = useCallback(async () => {
    try {
      setIsLoadingDesignations(true)
      const response = await fetch('/api/designations')
      if (response.ok) {
        const data = await response.json()
        setDesignationsData(data)
        setFilteredDesignations(data)
        console.log('✅ Designations data loaded:', data.length)
      } else {
        console.error('Failed to fetch designations data')
        setDesignationsData([])
        setFilteredDesignations([])
      }
    } catch (error) {
      console.error('Error fetching designations data:', error)
      setDesignationsData([])
      setFilteredDesignations([])
    } finally {
      setIsLoadingDesignations(false)
    }
  }, [])

  // Fetch grades from API
  const fetchGrades = useCallback(async () => {
    try {
      setIsLoadingGrades(true)
      const response = await fetch('/api/grades')
      if (response.ok) {
        const data = await response.json()
        setGrades(data)
        setFilteredGrades(data)
        console.log('✅ Grades loaded:', data.length)
      } else {
        console.error('Failed to fetch grades')
        setGrades([])
        setFilteredGrades([])
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
      setGrades([])
      setFilteredGrades([])
    } finally {
      setIsLoadingGrades(false)
    }
  }, [])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.trim() === '') {
      setFilteredGrades(grades)
    } else {
      const filtered = grades.filter(grade =>
        grade.designation_name.toLowerCase().includes(value.toLowerCase()) ||
        grade.employee_grade_type.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredGrades(filtered)
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof NewGrade, value: string) => {
    setNewGrade(prev => ({ ...prev, [field]: value }))
  }

  // Handle edit grade
  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade)
    setNewGrade({
      designation_id: grade.designation_id.toString(),
      employee_grade_type: grade.employee_grade_type,
      category: grade.category || ''
    })
    setIsEditDialogOpen(true)
  }

  // Handle delete grade
  const handleDeleteGrade = (gradeId: number, gradeName: string) => {
    showConfirmDialog(
      'Delete Grade',
      `Are you sure you want to delete the grade "${gradeName}"? This action cannot be undone.`,
      () => performDeleteGrade(gradeId),
      'Delete',
      'Cancel'
    )
  }

  // Perform actual grade deletion
  const performDeleteGrade = async (gradeId: number) => {
    try {
      const response = await fetch(`/api/grades?id=${gradeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccessMessage('Grade deleted successfully!')
        setShowSuccessPopup(true)
        fetchGrades() // Refresh the list
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to delete grade')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting grade:', error)
      setErrorMessage('Something went wrong while deleting grade')
      setShowErrorPopup(true)
    }
  }

  // Add new grade with enhanced validation
  const handleAddGrade = async () => {
    // Validate Designation selection
    if (!newGrade.designation_id || newGrade.designation_id.trim() === '') {
      setErrorMessage('Designation is required. Please select a designation.')
      setShowErrorPopup(true)
      return
    }

    // Validate Grade Type
    if (!newGrade.employee_grade_type || newGrade.employee_grade_type.trim() === '') {
      setErrorMessage('Grade Type is required. Please enter a grade type.')
      setShowErrorPopup(true)
      return
    }

    // Validate Grade Type format (basic validation)
    const gradeRegex = /^[A-Z0-9\-\s]+$/i
    if (!gradeRegex.test(newGrade.employee_grade_type)) {
      setErrorMessage('Grade Type should contain only letters, numbers, and hyphens (e.g., G4, ENG-III).')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingGrade(true)

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designation_id: parseInt(newGrade.designation_id),
          employee_grade_type: newGrade.employee_grade_type,
          category: newGrade.category || null,
          status: 1,
          company_id: 1 // You can make this dynamic
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(`Grade "${newGrade.employee_grade_type}" added successfully for selected designation!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsGradesDialogOpen(false)
        setNewGrade({
          designation_id: '',
          employee_grade_type: '',
          category: ''
        })
        fetchGrades() // Refresh the list
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to add grade')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error adding grade:', error)
      setErrorMessage('Something went wrong while adding grade')
      setShowErrorPopup(true)
    } finally {
      setIsAddingGrade(false)
    }
  }

  // Handle update grade
  const handleUpdateGrade = async () => {
    if (!editingGrade) return

    // Same validation as add grade
    if (!newGrade.designation_id || newGrade.designation_id.trim() === '') {
      setErrorMessage('Designation is required. Please select a designation.')
      setShowErrorPopup(true)
      return
    }

    if (!newGrade.employee_grade_type || newGrade.employee_grade_type.trim() === '') {
      setErrorMessage('Grade Type is required. Please enter a grade type.')
      setShowErrorPopup(true)
      return
    }

    const gradeRegex = /^[A-Z0-9\-\s]+$/i
    if (!gradeRegex.test(newGrade.employee_grade_type)) {
      setErrorMessage('Grade Type should contain only letters, numbers, and hyphens (e.g., G4, ENG-III).')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingGrade(true)

      const response = await fetch('/api/grades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingGrade.id,
          designation_id: parseInt(newGrade.designation_id),
          employee_grade_type: newGrade.employee_grade_type,
          category: newGrade.category || null,
        }),
      })

      if (response.ok) {
        setSuccessMessage(`Grade "${newGrade.employee_grade_type}" updated successfully!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsEditDialogOpen(false)
        setEditingGrade(null)
        setNewGrade({
          designation_id: '',
          employee_grade_type: '',
          category: ''
        })
        fetchGrades() // Refresh the list
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to update grade')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating grade:', error)
      setErrorMessage('Something went wrong while updating grade')
      setShowErrorPopup(true)
    } finally {
      setIsAddingGrade(false)
    }
  }

  // Handle designation search
  const handleDesignationSearch = (value: string) => {
    setDesignationSearchTerm(value)
    if (value.trim() === '') {
      setFilteredDesignations(designationsData)
    } else {
      const filtered = designationsData.filter(designation =>
        designation.designation_name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredDesignations(filtered)
    }
  }

  // Get sequence number based on database ID order
  const getSequenceNumber = (designationId: number) => {
    const sortedDesignations = [...designationsData].sort((a, b) => a.id - b.id)
    return sortedDesignations.findIndex(d => d.id === designationId) + 1
  }

  // Get sequence number for grades based on database ID order
  const getGradeSequenceNumber = (gradeId: number) => {
    const sortedGrades = [...grades].sort((a, b) => a.id - b.id)
    return sortedGrades.findIndex(g => g.id === gradeId) + 1
  }

  // Show confirmation dialog
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Delete",
    cancelText: string = "Cancel"
  ) => {
    setConfirmationData({
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    })
    setIsConfirmDialogOpen(true)
  }

  // Handle designation input changes
  const handleDesignationInputChange = (field: keyof NewDesignation, value: string) => {
    setNewDesignation(prev => ({ ...prev, [field]: value }))
  }

  // Handle add designation
  const handleAddDesignation = async () => {
    if (!newDesignation.designation_name || newDesignation.designation_name.trim() === '') {
      setErrorMessage('Designation name is required. Please enter a designation name.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingDesignation(true)

      const response = await fetch('/api/designations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designation_name: newDesignation.designation_name.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(`Designation "${newDesignation.designation_name}" added successfully!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsDesignationDialogOpen(false)
        setNewDesignation({
          designation_name: ''
        })
        fetchDesignationsData() // Refresh the table
        fetchDesignations() // Refresh the dropdown options
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to add designation')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error adding designation:', error)
      setErrorMessage('Something went wrong while adding designation')
      setShowErrorPopup(true)
    } finally {
      setIsAddingDesignation(false)
    }
  }

  // Handle edit designation
  const handleEditDesignation = (designation: Designation) => {
    setEditingDesignation(designation)
    setNewDesignation({
      designation_name: designation.designation_name
    })
    setIsEditDesignationDialogOpen(true)
  }

  // Handle update designation
  const handleUpdateDesignation = async () => {
    if (!editingDesignation) return

    if (!newDesignation.designation_name || newDesignation.designation_name.trim() === '') {
      setErrorMessage('Designation name is required. Please enter a designation name.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingDesignation(true)

      const response = await fetch('/api/designations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingDesignation.id,
          designation_name: newDesignation.designation_name.trim(),
        }),
      })

      if (response.ok) {
        setSuccessMessage(`Designation "${newDesignation.designation_name}" updated successfully!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsEditDesignationDialogOpen(false)
        setEditingDesignation(null)
        setNewDesignation({
          designation_name: ''
        })
        fetchDesignationsData() // Refresh the table
        fetchDesignations() // Refresh the dropdown options
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to update designation')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating designation:', error)
      setErrorMessage('Something went wrong while updating designation')
      setShowErrorPopup(true)
    } finally {
      setIsAddingDesignation(false)
    }
  }

  // Handle delete designation
  const handleDeleteDesignation = (designationId: number, designationName: string) => {
    showConfirmDialog(
      'Delete Designation',
      `Are you sure you want to delete the designation "${designationName}"? This action cannot be undone.`,
      () => performDeleteDesignation(designationId),
      'Delete',
      'Cancel'
    )
  }

  // Perform actual designation deletion
  const performDeleteDesignation = async (designationId: number) => {
    try {
      const response = await fetch(`/api/designations?id=${designationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccessMessage('Designation deleted successfully!')
        setShowSuccessPopup(true)
        fetchDesignationsData() // Refresh the table
        fetchDesignations() // Refresh the dropdown options
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to delete designation')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting designation:', error)
      setErrorMessage('Something went wrong while deleting designation')
      setShowErrorPopup(true)
    }
  }

  // Fetch working hours policies
  const fetchWorkingHoursPolicies = useCallback(async () => {
    try {
      setIsLoadingPolicies(true)
      const response = await fetch('/api/working-hours')
      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('📦 API Response data:', result)
        const data = result.data || []
        setWorkingHoursPolicies(data)
        setFilteredPolicies(data)
        console.log('✅ Working hours policies loaded:', data.length)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch working hours policies. Status:', response.status, 'Error:', errorText)
        setWorkingHoursPolicies([])
        setFilteredPolicies([])
      }
    } catch (error) {
      console.error('❌ Error fetching working hours policies:', error)
      setWorkingHoursPolicies([])
      setFilteredPolicies([])
    } finally {
      setIsLoadingPolicies(false)
    }
  }, [])

  // Handle policy search
  const handlePolicySearch = (value: string) => {
    setPolicySearchTerm(value)
    if (value.trim() === '') {
      setFilteredPolicies(workingHoursPolicies)
    } else {
      const filtered = workingHoursPolicies.filter(policy =>
        policy.working_hours_policy.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredPolicies(filtered)
    }
  }

  // Handle policy input changes
  const handlePolicyInputChange = (field: keyof NewWorkingHoursPolicy, value: string) => {
    setNewPolicy(prev => ({ ...prev, [field]: value }))
  }

  // Handle add working hours policy
  const handleAddPolicy = async () => {
    if (!newPolicy.working_hours_policy || newPolicy.working_hours_policy.trim() === '') {
      setErrorMessage('Policy name is required.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingPolicy(true)

      const response = await fetch('/api/working-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          working_hours_policy: newPolicy.working_hours_policy.trim(),
        }),
      })

      if (response.ok) {
        setSuccessMessage(`Policy "${newPolicy.working_hours_policy}" added successfully!`)
        setShowSuccessPopup(true)

        setIsPolicyDialogOpen(false)
        setNewPolicy({
          working_hours_policy: '',
          start_working_hours_time: '',
          end_working_hours_time: ''
        })
        fetchWorkingHoursPolicies()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to add policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error adding policy:', error)
      setErrorMessage('Something went wrong while adding policy')
      setShowErrorPopup(true)
    } finally {
      setIsAddingPolicy(false)
    }
  }

  // Handle edit policy
  const handleEditPolicy = (policy: WorkingHoursPolicy) => {
    setEditingPolicy(policy)
    setNewPolicy({
      working_hours_policy: policy.working_hours_policy,
      start_working_hours_time: policy.start_working_hours_time,
      end_working_hours_time: policy.end_working_hours_time
    })
    setIsEditPolicyDialogOpen(true)
  }

  // Handle update policy
  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return

    if (!newPolicy.working_hours_policy || newPolicy.working_hours_policy.trim() === '') {
      setErrorMessage('Policy name is required.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingPolicy(true)

      const response = await fetch('/api/working-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPolicy.id,
          working_hours_policy: newPolicy.working_hours_policy.trim(),
        }),
      })

      if (response.ok) {
        setSuccessMessage(`Policy "${newPolicy.working_hours_policy}" updated successfully!`)
        setShowSuccessPopup(true)

        setIsEditPolicyDialogOpen(false)
        setEditingPolicy(null)
        setNewPolicy({
          working_hours_policy: '',
          start_working_hours_time: '',
          end_working_hours_time: ''
        })
        fetchWorkingHoursPolicies()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to update policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating policy:', error)
      setErrorMessage('Something went wrong while updating policy')
      setShowErrorPopup(true)
    } finally {
      setIsAddingPolicy(false)
    }
  }

  // Handle delete policy
  const handleDeletePolicy = (policyId: number, policyName: string) => {
    showConfirmDialog(
      'Delete Working Hours Policy',
      `Are you sure you want to delete the policy "${policyName}"? This action cannot be undone.`,
      () => performDeletePolicy(policyId),
      'Delete',
      'Cancel'
    )
  }

  // Perform actual policy deletion
  const performDeletePolicy = async (policyId: number) => {
    try {
      const response = await fetch(`/api/working-hours?id=${policyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccessMessage('Policy deleted successfully!')
        setShowSuccessPopup(true)
        fetchWorkingHoursPolicies()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to delete policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      setErrorMessage('Something went wrong while deleting policy')
      setShowErrorPopup(true)
    }
  }

  // Fetch users from API
  const fetchUsers = useCallback(async (maintainFilter = false) => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch('/api/users')
      console.log('📡 Users API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Users data:', data)
        setUsers(data)

        // Apply filter based on current checkbox state
        if (maintainFilter && showActiveUsers) {
          // Maintain current filter (show only active)
          const activeUsers = data.filter((user: User) => user.status === 1)
          setFilteredUsers(activeUsers)
          console.log('✅ Users loaded:', data.length, 'Active:', activeUsers.length)
        } else if (!maintainFilter) {
          // Initial load - show only active users by default
          const activeUsers = data.filter((user: User) => user.status === 1)
          setFilteredUsers(activeUsers)
          console.log('✅ Users loaded:', data.length, 'Active:', activeUsers.length)
        } else {
          // Show all users
          setFilteredUsers(data)
          console.log('✅ Users loaded:', data.length, 'All users shown')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch users. Status:', response.status, 'Error:', errorText)
        setUsers([])
        setFilteredUsers([])
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      setUsers([])
      setFilteredUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [showActiveUsers])

  // Handle user search and filter
  const handleUserSearch = (value: string) => {
    setUserSearchTerm(value)
    applyFilters(value, showActiveUsers)
  }

  // Handle status filter change
  const handleStatusFilterChange = (activeChecked: boolean) => {
    setShowActiveUsers(activeChecked)
    applyFilters(userSearchTerm, activeChecked)
  }

  // Apply filters
  const applyFilters = (searchTerm: string, showActive: boolean) => {
    console.log('🔍 Applying filters - showActive:', showActive, 'searchTerm:', searchTerm)
    console.log('📊 Total users:', users.length)

    let filtered = users

    // Filter by status - show only active users if checkbox is checked
    if (showActive) {
      filtered = filtered.filter(user => user.status === 1)
      console.log('✅ Showing only active users:', filtered.length)
    } else {
      console.log('📋 Showing all users:', filtered.length)
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const beforeSearch = filtered.length
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log('🔎 After search filter:', beforeSearch, '→', filtered.length)
    }

    console.log('📝 Final filtered users:', filtered.length)
    setFilteredUsers(filtered)
  }

  // Handle new user input changes
  const handleUserInputChange = (field: keyof NewUser, value: string | number) => {
    setNewUser(prev => ({ ...prev, [field]: value }))
  }

  // Handle add user
  const handleAddUser = async () => {
    // Validate all required fields
    if (!newUser.emp_id || newUser.emp_id.trim() === '') {
      setErrorMessage('Employee ID is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.name || newUser.name.trim() === '') {
      setErrorMessage('Name is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.username || newUser.username.trim() === '') {
      setErrorMessage('Username is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.email || newUser.email.trim() === '') {
      setErrorMessage('Email is required.')
      setShowErrorPopup(true)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setErrorMessage('Please enter a valid email address.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.password || newUser.password.trim() === '') {
      setErrorMessage('Password is required.')
      setShowErrorPopup(true)
      return
    }

    if (newUser.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingUser(true)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccessMessage(`User "${newUser.username}" added successfully!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsAddUserDialogOpen(false)
        setNewUser({
          emp_id: '',
          acc_type: 'user',
          name: '',
          username: '',
          email: '',
          password: '',
          status: 1
        })
        fetchUsers(true) // Refresh the list with current filter maintained
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to add user')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error adding user:', error)
      setErrorMessage('Something went wrong while adding user')
      setShowErrorPopup(true)
    } finally {
      setIsAddingUser(false)
    }
  }

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowPassword(false) // Reset password visibility
    setShowNewPassword(false) // Reset new password visibility
    setNewPasswordValue('') // Clear new password field
    setNewUser({
      emp_id: user.emp_id || '',
      acc_type: user.acc_type,
      name: user.name || '',
      username: user.username,
      email: user.email,
      password: user.password, // Show existing hashed password
      status: user.status
    })
    setIsEditUserDialogOpen(true)
  }

  // Handle delete user
  const handleDeleteUser = (userId: number, username: string) => {
    showConfirmation(
      'Delete User',
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      () => performDeleteUser(userId),
      'Delete',
      'Cancel'
    )
  }

  // Perform actual user deletion
  const performDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccessMessage('User deleted successfully!')
        setShowSuccessPopup(true)
        fetchUsers(true) // Refresh the list with current filter maintained
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to delete user')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setErrorMessage('Something went wrong while deleting user')
      setShowErrorPopup(true)
    }
  }

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser) return

    // Validate all required fields
    if (!newUser.emp_id || newUser.emp_id.trim() === '') {
      setErrorMessage('Employee ID is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.name || newUser.name.trim() === '') {
      setErrorMessage('Name is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.username || newUser.username.trim() === '') {
      setErrorMessage('Username is required.')
      setShowErrorPopup(true)
      return
    }

    if (!newUser.email || newUser.email.trim() === '') {
      setErrorMessage('Email is required.')
      setShowErrorPopup(true)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setErrorMessage('Please enter a valid email address.')
      setShowErrorPopup(true)
      return
    }

    // New password is optional during edit - only validate if provided
    if (newPasswordValue && newPasswordValue.trim() !== '' && newPasswordValue.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsAddingUser(true)

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...newUser,
          password: newPasswordValue // Send new password if provided, empty otherwise
        }),
      })

      if (response.ok) {
        setSuccessMessage(`User "${newUser.username}" updated successfully!`)
        setShowSuccessPopup(true)

        // Close dialog and reset form
        setIsEditUserDialogOpen(false)
        setEditingUser(null)
        setShowPassword(false)
        setShowNewPassword(false)
        setNewPasswordValue('')
        setNewUser({
          emp_id: '',
          acc_type: 'user',
          name: '',
          username: '',
          email: '',
          password: '',
          status: 1
        })

        // Refresh users list with current filter maintained
        fetchUsers(true)
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to update user')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setErrorMessage('Something went wrong while updating user')
      setShowErrorPopup(true)
    } finally {
      setIsAddingUser(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchDesignations()
    fetchGrades()
    if (activeTab === 'designations') {
      fetchDesignationsData()
    }
    if (activeTab === 'working-hours') {
      fetchWorkingHoursPolicies()
    }
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [fetchDesignations, fetchGrades, fetchDesignationsData, fetchWorkingHoursPolicies, fetchUsers, activeTab])

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation session={session} />

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('grades')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'grades'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="h-5 w-5 inline mr-2" />
                Grades Management
              </button>
              <button
                onClick={() => {
                  setActiveTab('designations')
                  fetchDesignationsData() // Load designations when tab is clicked
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'designations'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5 inline mr-2" />
                Designations Management
              </button>
              <button
                onClick={() => {
                  setActiveTab('working-hours')
                  fetchWorkingHoursPolicies() // Load policies when tab is clicked
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'working-hours'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-5 w-5 inline mr-2" />
                Working Hours Policy
              </button>
              <button
                onClick={() => {
                  setActiveTab('users')
                  fetchUsers() // Load users when tab is clicked
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCog className="h-5 w-5 inline mr-2" />
                User Management
              </button>
            </nav>
          </div>
        </div>

        {/* Grades Tab Content */}
        {activeTab === 'grades' && (
          <div className="space-y-6">
            {/* Search and Add Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by designation or grade type..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-28"
                />
                <Button
                  onClick={() => setIsGradesDialogOpen(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 h-7 px-3 text-xs"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Grade
                </Button>
              </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {isLoadingGrades ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                            <span>Loading grades...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredGrades.length > 0 ? (
                      filteredGrades.map((grade, index) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {grade.id}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {grade.designation_name}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {grade.employee_grade_type}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              grade.status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {grade.status === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditGrade(grade)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteGrade(grade.id, grade.employee_grade_type)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {searchTerm ? 'No grades found matching your search.' : 'No grades available. Add your first grade!'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Designations Tab Content */}
        {activeTab === 'designations' && (
          <div className="space-y-6">
            {/* Search and Add Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search designations..."
                  value={designationSearchTerm}
                  onChange={(e) => handleDesignationSearch(e.target.value)}
                  className="pl-10 pr-28"
                />
                <Button
                  onClick={() => setIsDesignationDialogOpen(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 h-7 px-3 text-xs"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Designation
                </Button>
              </div>
            </div>

            {/* Designations Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {isLoadingDesignations ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                            <span>Loading designations...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDesignations.length > 0 ? (
                      filteredDesignations.map((designation) => (
                        <tr key={designation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getSequenceNumber(designation.id)}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {designation.designation_name}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              designation.status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {designation.status === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDesignation(designation)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDesignation(designation.id, designation.designation_name)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {designationSearchTerm ? 'No designations found matching your search.' : 'No designations available. Add your first designation!'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours Policy Tab Content */}
        {activeTab === 'working-hours' && (
          <div className="space-y-6">
            {/* Search and Add Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search policies..."
                  value={policySearchTerm}
                  onChange={(e) => handlePolicySearch(e.target.value)}
                  className="pl-10 pr-28"
                />
                <Button
                  onClick={() => setIsPolicyDialogOpen(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 h-7 px-3 text-xs"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Policy
                </Button>
              </div>
            </div>

            {/* Policies Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Policy Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {isLoadingPolicies ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                            <span>Loading policies...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPolicies.length > 0 ? (
                      filteredPolicies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {policy.id}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {policy.working_hours_policy}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPolicy(policy)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePolicy(policy.id, policy.working_hours_policy)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {policySearchTerm ? 'No policies found matching your search.' : 'No policies available. Add your first policy!'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, username, email, or employee ID..."
                    value={userSearchTerm}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="pl-10 pr-32"
                  />
                  <Button
                    onClick={() => setIsAddUserDialogOpen(true)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add User
                  </Button>
                </div>

                {/* Active Users Checkbox */}
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <Checkbox
                    id="show-active"
                    checked={showActiveUsers}
                    onCheckedChange={(checked) => {
                      console.log('Checkbox changed:', checked)
                      handleStatusFilterChange(checked as boolean)
                    }}
                  />
                  <label
                    htmlFor="show-active"
                    className="text-sm font-medium leading-none cursor-pointer select-none"
                    onClick={() => {
                      const newValue = !showActiveUsers
                      console.log('Label clicked, new value:', newValue)
                      handleStatusFilterChange(newValue)
                    }}
                  >
                    Show Active Only
                  </label>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Badge className="h-4 w-4 text-blue-500" />
                          Employee ID
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-500" />
                          Name
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-indigo-500" />
                          Username
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-orange-500" />
                          Email
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-teal-500" />
                          Account Type
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Status
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.emp_id || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.acc_type}
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            {userSearchTerm ? 'No users found matching your search.' : 'No users available.'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Grades Management Dialog */}
        <Dialog open={isGradesDialogOpen} onOpenChange={setIsGradesDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                Add New Grade
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Designation Selection */}
                <div>
                  <Label htmlFor="designation">Designation *</Label>
                  <SearchableSelect
                    options={designations}
                    value={newGrade.designation_id}
                    onValueChange={(value) => handleInputChange('designation_id', value)}
                    placeholder="Select designation..."
                    searchPlaceholder="Search designations..."
                  />
                  {designations.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Loading designations...</p>
                  )}
                </div>

                {/* Grade Type Input */}
                <div>
                  <Label htmlFor="employee_grade_type">Grade Type *</Label>
                  <Input
                    id="employee_grade_type"
                    value={newGrade.employee_grade_type}
                    onChange={(e) => handleInputChange('employee_grade_type', e.target.value)}
                    placeholder="e.g., G4, ENG-III, EX-II"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter grade like G1, G2, ENG-I, EX-III, etc.
                  </p>
                </div>

                {/* Category Input */}
                <div className="md:col-span-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={newGrade.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Engineering, Management"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddGrade}
                  disabled={isAddingGrade}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingGrade ? 'Adding...' : 'Add Grade'}
                </Button>
                <Button
                  onClick={() => setIsGradesDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Grade Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-600" />
                Edit Grade
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Designation Selection */}
                <div>
                  <Label htmlFor="edit-designation">Designation *</Label>
                  <SearchableSelect
                    options={designations}
                    value={newGrade.designation_id}
                    onValueChange={(value) => handleInputChange('designation_id', value)}
                    placeholder="Select designation..."
                    searchPlaceholder="Search designations..."
                  />
                  {designations.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Loading designations...</p>
                  )}
                </div>

                {/* Grade Type Input */}
                <div>
                  <Label htmlFor="edit-employee_grade_type">Grade Type *</Label>
                  <Input
                    id="edit-employee_grade_type"
                    value={newGrade.employee_grade_type}
                    onChange={(e) => handleInputChange('employee_grade_type', e.target.value)}
                    placeholder="e.g., G4, ENG-III, EX-II"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter grade like G1, G2, ENG-I, EX-III, etc.
                  </p>
                </div>

                {/* Category Input */}
                <div className="md:col-span-2">
                  <Label htmlFor="edit-category">Category (Optional)</Label>
                  <Input
                    id="edit-category"
                    value={newGrade.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Engineering, Management"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateGrade}
                  disabled={isAddingGrade}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingGrade ? 'Updating...' : 'Update Grade'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingGrade(null)
                    setNewGrade({
                      designation_id: '',
                      employee_grade_type: '',
                      category: ''
                    })
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Designation Dialog */}
        <Dialog open={isDesignationDialogOpen} onOpenChange={setIsDesignationDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Add New Designation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="designation_name">Designation Name *</Label>
                <Input
                  id="designation_name"
                  value={newDesignation.designation_name}
                  onChange={(e) => handleDesignationInputChange('designation_name', e.target.value)}
                  placeholder="e.g., Senior Manager, Software Developer"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddDesignation}
                  disabled={isAddingDesignation}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingDesignation ? 'Adding...' : 'Add Designation'}
                </Button>
                <Button
                  onClick={() => setIsDesignationDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Designation Dialog */}
        <Dialog open={isEditDesignationDialogOpen} onOpenChange={setIsEditDesignationDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-600" />
                Edit Designation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-designation_name">Designation Name *</Label>
                <Input
                  id="edit-designation_name"
                  value={newDesignation.designation_name}
                  onChange={(e) => handleDesignationInputChange('designation_name', e.target.value)}
                  placeholder="e.g., Senior Manager, Software Developer"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateDesignation}
                  disabled={isAddingDesignation}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingDesignation ? 'Updating...' : 'Update Designation'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditDesignationDialogOpen(false)
                    setEditingDesignation(null)
                    setNewDesignation({
                      designation_name: ''
                    })
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Working Hours Policy Dialog */}
        <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Add New Working Hours Policy
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                {/* Policy Name */}
                <Label htmlFor="working_hours_policy">Policy Name *</Label>
                <Input
                  id="working_hours_policy"
                  value={newPolicy.working_hours_policy}
                  onChange={(e) => handlePolicyInputChange('working_hours_policy', e.target.value)}
                  placeholder="e.g., Standard Shift, Night Shift"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddPolicy}
                  disabled={isAddingPolicy}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingPolicy ? 'Adding...' : 'Add Policy'}
                </Button>
                <Button
                  onClick={() => setIsPolicyDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Working Hours Policy Dialog */}
        <Dialog open={isEditPolicyDialogOpen} onOpenChange={setIsEditPolicyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-600" />
                Edit Working Hours Policy
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                {/* Policy Name */}
                <Label htmlFor="edit-working_hours_policy">Policy Name *</Label>
                <Input
                  id="edit-working_hours_policy"
                  value={newPolicy.working_hours_policy}
                  onChange={(e) => handlePolicyInputChange('working_hours_policy', e.target.value)}
                  placeholder="e.g., Standard Shift, Night Shift"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdatePolicy}
                  disabled={isAddingPolicy}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingPolicy ? 'Updating...' : 'Update Policy'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditPolicyDialogOpen(false)
                    setEditingPolicy(null)
                    setNewPolicy({
                      working_hours_policy: '',
                      start_working_hours_time: '',
                      end_working_hours_time: ''
                    })
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                {confirmationData?.title || 'Confirm Action'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {confirmationData?.message}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    confirmationData?.onConfirm()
                    setIsConfirmDialogOpen(false)
                    setConfirmationData(null)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {confirmationData?.confirmText || 'Delete'}
                </Button>
                <Button
                  onClick={() => {
                    setIsConfirmDialogOpen(false)
                    setConfirmationData(null)
                  }}
                  variant="outline"
                >
                  {confirmationData?.cancelText || 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-emerald-600" />
                Add New User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <Label htmlFor="emp_id">Employee ID *</Label>
                  <Input
                    id="emp_id"
                    value={newUser.emp_id}
                    onChange={(e) => handleUserInputChange('emp_id', e.target.value)}
                    placeholder="e.g., EMP001"
                    required
                  />
                </div>

                {/* Account Type */}
                <div>
                  <Label htmlFor="acc_type">Account Type *</Label>
                  <select
                    id="acc_type"
                    value={newUser.acc_type}
                    onChange={(e) => handleUserInputChange('acc_type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => handleUserInputChange('name', e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => handleUserInputChange('username', e.target.value)}
                    placeholder="e.g., johndoe"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleUserInputChange('email', e.target.value)}
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleUserInputChange('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={newUser.status}
                    onChange={(e) => handleUserInputChange('status', parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddUser}
                  disabled={isAddingUser}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingUser ? 'Adding...' : 'Add User'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddUserDialogOpen(false)
                    setNewUser({
                      emp_id: '',
                      acc_type: 'user',
                      name: '',
                      username: '',
                      email: '',
                      password: '',
                      status: 1
                    })
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-emerald-600" />
                Edit User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <Label htmlFor="edit-emp_id">Employee ID *</Label>
                  <Input
                    id="edit-emp_id"
                    value={newUser.emp_id}
                    onChange={(e) => handleUserInputChange('emp_id', e.target.value)}
                    placeholder="e.g., EMP001"
                    required
                  />
                </div>

                {/* Account Type */}
                <div>
                  <Label htmlFor="edit-acc_type">Account Type *</Label>
                  <select
                    id="edit-acc_type"
                    value={newUser.acc_type}
                    onChange={(e) => handleUserInputChange('acc_type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={newUser.name}
                    onChange={(e) => handleUserInputChange('name', e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="edit-username">Username *</Label>
                  <Input
                    id="edit-username"
                    value={newUser.username}
                    onChange={(e) => handleUserInputChange('username', e.target.value)}
                    placeholder="e.g., johndoe"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleUserInputChange('email', e.target.value)}
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>

                {/* Current Password (Read-only) */}
                <div>
                  <Label htmlFor="edit-current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="edit-current-password"
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      readOnly
                      className="pr-10 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click eye icon to view current password
                  </p>
                </div>

                {/* New Password (Optional) */}
                <div>
                  <Label htmlFor="edit-new-password">New Password (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="edit-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      placeholder="Enter new password to change"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current password
                  </p>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <select
                    id="edit-status"
                    value={newUser.status}
                    onChange={(e) => handleUserInputChange('status', parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value={1}>Active</option>
                    <option value={2}>Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateUser}
                  disabled={isAddingUser}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isAddingUser ? 'Updating...' : 'Update User'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditUserDialogOpen(false)
                    setEditingUser(null)
                    setShowPassword(false)
                    setShowNewPassword(false)
                    setNewPasswordValue('')
                    setNewUser({
                      emp_id: '',
                      acc_type: 'user',
                      name: '',
                      username: '',
                      email: '',
                      password: '',
                      status: 1
                    })
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        message={successMessage}
        onClose={() => setShowSuccessPopup(false)}
      />

      {/* Error Popup */}
      <ErrorPopup
        isOpen={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
      />
    </div>
  )
}