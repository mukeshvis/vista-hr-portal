"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TopNavigation } from "@/components/top-navigation"
import { EmployeeTable } from "@/components/employee-table"
import { Pagination } from "@/components/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, User, Building, CreditCard } from "lucide-react"


interface Employee {
  id: string
  empId?: string
  name: string
  designation: string
  group: string
  gender?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface NewEmployee {
  empId: string
  name: string
  email: string
  phone: string
  designation: string // This will store designation_id as string
  grade: string // This will store grade as string
  workingHoursPolicy: string // This will store working_hours_policy_id as string
  reportingManager: string // This will store reporting_manager id as string
  leavePolicy: string // This will store leaves_policy_id as string
  department: string
  joiningDate: string
  salary: number | string
  status: string
  gender: string
  address: string
  permanentAddress: string
  maritalStatus: string
  employmentStatus: string
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

// Grade options based on the provided list
const gradeOptions = [
  '32', '33', '4', '44', '77', 'abc intern', 'CL-1', 'CLE-I', 'CLE-II', 'CLE-III', 'CLE-IV',
  'ENG 1', 'ENG 2', 'ENG 3', 'ENG II', 'ENG III', 'ENG-11', 'ENG-111', 'ENG-I', 'ENG-II',
  'ENG-III', 'ENG-IV', 'ENG-V', 'Eng-v', 'EX III', 'EX IV', 'EX-1', 'EX-I', 'EX-II', 'EX-III',
  'EX-IV', 'EX-V', 'EXG II', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'Grade Scale', 'Non',
  'President & CEO'
]

// Department options
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

// Leave Policy options
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

// Debounce hook for real-time search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]) // All employees from API
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]) // Filtered by search
  const [displayedEmployees, setDisplayedEmployees] = useState<Employee[]>([]) // Current page
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [designations, setDesignations] = useState<DesignationOption[]>([]) // Designations from API
  const [employees, setEmployees] = useState<EmployeeOption[]>([]) // Employees for reporting manager dropdown
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<{id: number, name: string}[]>([]) // Marital status options from API
  const [employmentStatuses, setEmploymentStatuses] = useState<{value: string, label: string}[]>([]) // Employment status options from API
  const [workingHoursPolicies, setWorkingHoursPolicies] = useState<{id: number, name: string}[]>([]) // Working hours policies from API
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [empIdValidation, setEmpIdValidation] = useState({
    isChecking: false,
    exists: false,
    message: ''
  })
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

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
    employmentStatus: '',
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

  const employeesPerPage = 20

  // Debounce search term to avoid too many filter operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch all employees once
  const fetchAllEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setAllEmployees(data)
        setFilteredEmployees(data) // Initially show all
      } else {
        console.error('Failed to fetch employees')
        setAllEmployees([])
        setFilteredEmployees([])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setAllEmployees([])
      setFilteredEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch designations from API
  const fetchDesignations = useCallback(async () => {
    try {
      const response = await fetch('/api/designations?forSelect=true')
      if (response.ok) {
        const data = await response.json()
        setDesignations(data)
      } else {
        console.error('Failed to fetch designations')
        setDesignations([])
      }
    } catch (error) {
      console.error('Error fetching designations:', error)
      setDesignations([])
    }
  }, [])

  // Fetch marital status options from API
  const fetchMaritalStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/marital-status')
      if (response.ok) {
        const data = await response.json()
        setMaritalStatusOptions(data)
      } else {
        console.error('Failed to fetch marital status options')
        setMaritalStatusOptions([])
      }
    } catch (error) {
      console.error('Error fetching marital status options:', error)
      setMaritalStatusOptions([])
    }
  }, [])

  // Fetch employment status options from API
  const fetchEmploymentStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/employment-status?forSelect=true')
      if (response.ok) {
        const data = await response.json()
        setEmploymentStatuses(data)
      } else {
        console.error('Failed to fetch employment statuses')
        setEmploymentStatuses([])
      }
    } catch (error) {
      console.error('Error fetching employment statuses:', error)
      setEmploymentStatuses([])
    }
  }, [])

  // Fetch working hours policies
  const fetchWorkingHoursPolicies = useCallback(async () => {
    try {
      console.log('🔄 Fetching working hours policies...')
      const response = await fetch('/api/working-hours')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Working hours policies fetched:', data.data?.length || 0, 'policies')
        const policies = data.data?.map((policy: any) => ({
          id: policy.id,
          name: policy.working_hours_policy
        })) || []
        setWorkingHoursPolicies(policies)
      } else {
        console.error('Failed to fetch working hours policies')
        setWorkingHoursPolicies([])
      }
    } catch (error) {
      console.error('Error fetching working hours policies:', error)
      setWorkingHoursPolicies([])
    }
  }, [])

  // Fetch employees for reporting manager dropdown
  const fetchEmployeesForReporting = useCallback(async () => {
    try {
      console.log('🔄 Fetching employees for reporting manager...')
      const response = await fetch('/api/employees/reporting-managers')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Employees for reporting fetched:', data.length, 'employees')
        console.log('First few employees:', data.slice(0, 3))
        setEmployees(data)
      } else {
        console.error('Failed to fetch employees for reporting')
        setEmployees([])
      }
    } catch (error) {
      console.error('Error fetching employees for reporting:', error)
      setEmployees([])
    }
  }, [])

  // Check if Employee ID exists in database
  const checkEmployeeId = useCallback(async (empId: string) => {
    if (!empId.trim()) {
      setEmpIdValidation({ isChecking: false, exists: false, message: '' })
      return
    }

    setEmpIdValidation({ isChecking: true, exists: false, message: '' })

    try {
      const response = await fetch(`/api/employees/check-id?empId=${encodeURIComponent(empId)}`)

      if (response.ok) {
        const data = await response.json()
        setEmpIdValidation({
          isChecking: false,
          exists: data.exists,
          message: data.message
        })
      } else {
        setEmpIdValidation({
          isChecking: false,
          exists: false,
          message: 'Error checking Employee ID'
        })
      }
    } catch (error) {
      console.error('Error checking employee ID:', error)
      setEmpIdValidation({
        isChecking: false,
        exists: false,
        message: 'Error checking Employee ID'
      })
    }
  }, [])

  // Debounced Employee ID check
  const debouncedEmpId = useDebounce(newEmployee.empId, 500)

  useEffect(() => {
    if (debouncedEmpId) {
      checkEmployeeId(debouncedEmpId)
    }
  }, [debouncedEmpId, checkEmployeeId])

  // Filter employees based on search term
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredEmployees(allEmployees)
    } else {
      const filtered = allEmployees.filter(employee =>
        employee.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        employee.id.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
      setFilteredEmployees(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [debouncedSearchTerm, allEmployees])

  // Update displayed employees when page or filtered employees change
  useEffect(() => {
    const startIndex = (currentPage - 1) * employeesPerPage
    const endIndex = startIndex + employeesPerPage
    setDisplayedEmployees(filteredEmployees.slice(startIndex, endIndex))
  }, [currentPage, filteredEmployees])

  // Initial load
  useEffect(() => {
    fetchAllEmployees()
    fetchDesignations()
    fetchMaritalStatus()
    fetchEmploymentStatuses()
    fetchWorkingHoursPolicies()
    fetchEmployeesForReporting()
  }, [fetchAllEmployees, fetchDesignations, fetchMaritalStatus, fetchEmploymentStatuses, fetchWorkingHoursPolicies, fetchEmployeesForReporting])

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle add employee
  const handleAddEmployee = () => {
    setEmpIdValidation({ isChecking: false, exists: false, message: '' })
    setIsAddDialogOpen(true)
  }

  const handleInputChange = (field: keyof NewEmployee, value: string | number) => {
    setNewEmployee(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Real-time field validation
    validateField(field, value)

    // Auto-populate grade when designation is selected
    if (field === 'designation' && value) {
      fetchGradeByDesignation(value as string)
    }
  }

  // Real-time field validation
  const validateField = (field: keyof NewEmployee, value: string | number) => {
    let error = ''

    switch (field) {
      case 'name':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        }
        break
      case 'email':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        } else if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address'
          }
        }
        break
      case 'phone':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        } else if (typeof value === 'string') {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            error = 'Please enter a valid phone number'
          }
        }
        break
      case 'salary':
        if (!value || value === 0 || value === '') {
          error = 'This field is required'
        } else if (Number(value) <= 0) {
          error = 'Monthly Salary must be greater than 0'
        }
        break
      case 'empId':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        }
        break
      case 'designation':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        }
        break
      case 'department':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        }
        break
      case 'joiningDate':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'This field is required'
        }
        break
    }

    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  // Fetch grade based on designation ID
  const fetchGradeByDesignation = useCallback(async (designationId: string) => {
    try {
      const response = await fetch(`/api/grades/by-designation?designationId=${designationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.grade) {
          // Auto-populate the grade field
          setNewEmployee(prev => ({
            ...prev,
            grade: data.grade
          }))

          // Log selection info
          if (data.totalGrades > 1) {
            console.log(`✅ Grade "${data.grade}" selected from ${data.totalGrades} options (${data.uniqueGrades} unique)`)
          } else {
            console.log('✅ Grade auto-populated:', data.grade)
          }
        }
      } else {
        console.log('⚠️ No grade found for designation ID:', designationId)
      }
    } catch (error) {
      console.error('❌ Error fetching grade by designation:', error)
    }
  }, [])

  // Enhanced field validation with specific messages
  const validateRequiredFields = () => {
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'empId', label: 'Employee ID' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone Number' },
      { field: 'designation', label: 'Designation' },
      { field: 'joiningDate', label: 'Joining Date' },
      { field: 'salary', label: 'Monthly Salary' }
    ]

    // Check each required field individually for specific error messages
    for (const { field, label } of requiredFields) {
      const value = newEmployee[field as keyof NewEmployee]

      if (!value || (typeof value === 'string' && value.trim() === '') || value === 0) {
        setErrorMessage(`${label} is required. Please fill in this field.`)
        setShowErrorPopup(true)
        return false
      }
    }

    // Validate Employee ID exists check
    if (empIdValidation.exists) {
      setErrorMessage('Employee ID already exists. Please choose a different ID.')
      setShowErrorPopup(true)
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (newEmployee.email && !emailRegex.test(newEmployee.email)) {
      setErrorMessage('Please enter a valid email address.')
      setShowErrorPopup(true)
      return false
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (newEmployee.phone && !phoneRegex.test(newEmployee.phone.replace(/[\s\-\(\)]/g, ''))) {
      setErrorMessage('Please enter a valid phone number.')
      setShowErrorPopup(true)
      return false
    }

    // Validate salary is a positive number
    const salaryNum = Number(newEmployee.salary)
    if (salaryNum <= 0) {
      setErrorMessage('Monthly Salary must be greater than 0.')
      setShowErrorPopup(true)
      return false
    }

    // Validate joining date is not in future
    if (newEmployee.joiningDate) {
      const joiningDate = new Date(newEmployee.joiningDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time for date comparison

      if (joiningDate > today) {
        setErrorMessage('Joining Date cannot be in the future.')
        setShowErrorPopup(true)
        return false
      }
    }

    return true
  }

  const handleSaveNewEmployee = async () => {
    // Check if Employee ID already exists
    if (empIdValidation.exists) {
      setErrorMessage('Employee ID already exists. Please choose a different ID.')
      setShowErrorPopup(true)
      return
    }

    // Validate required fields first
    if (!validateRequiredFields()) {
      return
    }

    try {
      setIsSaving(true)

      const dataToSend = {
        ...newEmployee,
        designation_id: parseInt(newEmployee.designation), // Convert designation to designation_id
        gender: newEmployee.gender === 'Male' ? 1 : 2,
        maritalStatus: newEmployee.maritalStatus, // Keep as string - API will handle conversion
        status: newEmployee.status === 'Active' ? 1 : 0
      }

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        const result = await response.json()

        // Close dialog first
        setIsAddDialogOpen(false)

        // Show success popup with animation
        setSuccessMessage(`Employee "${newEmployee.name}" has been successfully added to the system!`)
        setShowSuccessPopup(true)

        // Reset form
        setEmpIdValidation({ isChecking: false, exists: false, message: '' })
        setFieldErrors({})
        setNewEmployee({
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
          employmentStatus: '',
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

        // Refresh employee list
        fetchAllEmployees()
      } else {
        const errorData = await response.json()
        alert(`Failed to add employee: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      alert(`Error adding employee: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate pagination info
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage)
  const pagination = {
    currentPage,
    totalPages,
    totalCount: filteredEmployees.length,
    limit: employeesPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation session={session} />

      <main className="container mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Employee Management</h1>
          <Button
            className="bg-black hover:bg-gray-800 text-white"
            onClick={handleAddEmployee}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 w-full"
            />
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading employees...</p>
            </div>
          </div>
        ) : (
          <div>
            <EmployeeTable employees={displayedEmployees} />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

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
                    <User className="h-5 w-5 text-blue-600" />
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
                        required
                        className={fieldErrors['name'] ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {fieldErrors['name'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['name']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="empId">Employee ID *</Label>
                      <Input
                        id="empId"
                        value={newEmployee.empId}
                        onChange={(e) => handleInputChange('empId', e.target.value)}
                        required
                        className={`${empIdValidation.exists || fieldErrors['empId'] ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {empIdValidation.isChecking && (
                        <p className="text-sm text-gray-500 mt-1">Checking availability...</p>
                      )}
                      {empIdValidation.exists && (
                        <p className="text-sm text-red-500 mt-1">{empIdValidation.message}</p>
                      )}
                      {!empIdValidation.exists && !empIdValidation.isChecking && newEmployee.empId && empIdValidation.message && (
                        <p className="text-sm text-green-500 mt-1">{empIdValidation.message}</p>
                      )}
                      {fieldErrors['empId'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['empId']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="fatherName">Father&apos;s Name</Label>
                      <Input
                        id="fatherName"
                        value={newEmployee.fatherName}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newEmployee.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className={fieldErrors['email'] ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {fieldErrors['email'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['email']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="professionalEmail">Professional Email</Label>
                      <Input
                        id="professionalEmail"
                        type="email"
                        value={newEmployee.professionalEmail}
                        onChange={(e) => handleInputChange('professionalEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={newEmployee.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className={fieldErrors['phone'] ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {fieldErrors['phone'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['phone']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={newEmployee.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Male" className="bg-white hover:bg-gray-100">Male</SelectItem>
                          <SelectItem value="Female" className="bg-white hover:bg-gray-100">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select
                        value={newEmployee.maritalStatus}
                        onValueChange={(value) => handleInputChange('maritalStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {maritalStatusOptions.map((option) => (
                            <SelectItem key={option.id} value={option.name} className="bg-white hover:bg-gray-100">
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employmentStatus">Employment Type</Label>
                      <SearchableSelect
                        options={employmentStatuses}
                        value={newEmployee.employmentStatus}
                        onValueChange={(value) => handleInputChange('employmentStatus', value)}
                        placeholder="Select employment status..."
                        searchPlaceholder="Search employment statuses..."
                      />
                      {employmentStatuses.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">Loading employment statuses...</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={newEmployee.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnic">CNIC</Label>
                      <Input
                        id="cnic"
                        value={newEmployee.cnic}
                        onChange={(e) => handleInputChange('cnic', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnicExpiryDate">CNIC Expiry Date</Label>
                      <Input
                        id="cnicExpiryDate"
                        type="date"
                        value={newEmployee.cnicExpiryDate}
                        onChange={(e) => handleInputChange('cnicExpiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Residential Address</Label>
                    <Textarea
                      id="address"
                      value={newEmployee.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanentAddress">Permanent Address</Label>
                    <Textarea
                      id="permanentAddress"
                      value={newEmployee.permanentAddress}
                      onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="designation">Designation *</Label>
                      <SearchableSelect
                        options={designations}
                        value={newEmployee.designation}
                        onValueChange={(value) => handleInputChange('designation', value)}
                        placeholder="Select designation..."
                        searchPlaceholder="Search designations..."
                        className={fieldErrors['designation'] ? 'border-red-500' : ''}
                      />
                      {fieldErrors['designation'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['designation']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="grade">Grade</Label>
                      <Select
                        value={newEmployee.grade}
                        onValueChange={(value) => handleInputChange('grade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!newEmployee.designation ? "Select designation first..." : "Select grade..."} />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-60 overflow-y-auto">
                          {gradeOptions.map((grade) => (
                            <SelectItem key={grade} value={grade} className="bg-white hover:bg-gray-100">
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!newEmployee.grade && !newEmployee.designation && (
                        <p className="text-sm text-gray-500 mt-1">
                          Grade will be auto-selected when you choose a designation
                        </p>
                      )}
                      {!newEmployee.grade && newEmployee.designation && (
                        <p className="text-sm text-orange-600 mt-1">
                          ⚠️ No grade found for this designation. Please select manually.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="workingHoursPolicy">Working Hours Policy</Label>
                      <Select
                        value={newEmployee.workingHoursPolicy}
                        onValueChange={(value) => handleInputChange('workingHoursPolicy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select working hours policy..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {workingHoursPolicies.map((policy) => (
                            <SelectItem key={policy.id} value={policy.id.toString()} className="bg-white hover:bg-gray-100">
                              {policy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reportingManager">Reporting Manager</Label>
                      <SearchableSelect
                        options={employees}
                        value={newEmployee.reportingManager}
                        onValueChange={(value) => {
                          console.log('Selected reporting manager:', value)
                          handleInputChange('reportingManager', value)
                        }}
                        placeholder="Select reporting manager..."
                        searchPlaceholder="Search employees..."
                      />
                      {employees.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">Loading employees...</p>
                      )}
                      {employees.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">{employees.length} employees loaded</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={newEmployee.department}
                        onValueChange={(value) => handleInputChange('department', value)}
                      >
                        <SelectTrigger className={fieldErrors['department'] ? 'border-red-500' : ''}>
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
                      {fieldErrors['department'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['department']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="leavePolicy">Leave Policy</Label>
                      <Select
                        value={newEmployee.leavePolicy}
                        onValueChange={(value) => handleInputChange('leavePolicy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave policy..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-60 overflow-y-auto">
                          {leavePolicyOptions.map((policy, index) => (
                            <SelectItem key={`policy-${index}`} value={policy} className="bg-white hover:bg-gray-100">
                              {policy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={newEmployee.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="joiningDate">Joining Date *</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        value={newEmployee.joiningDate}
                        onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                        required
                        className={fieldErrors['joiningDate'] ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {fieldErrors['joiningDate'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['joiningDate']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="status">Employment Status</Label>
                      <Select
                        value={newEmployee.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Active" className="bg-white hover:bg-gray-100">Active</SelectItem>
                          <SelectItem value="Inactive" className="bg-white hover:bg-gray-100">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dayOff">Day Off</Label>
                      <Select
                        value={newEmployee.dayOff}
                        onValueChange={(value) => handleInputChange('dayOff', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="none" className="bg-white hover:bg-gray-100">None</SelectItem>
                          <SelectItem value="Sat=>Sun=>" className="bg-white hover:bg-gray-100">Sat=&gt;Sun=&gt;</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newEmployee.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="probationExpireDate">Probation Expire Date</Label>
                      <Input
                        id="probationExpireDate"
                        type="date"
                        value={newEmployee.probationExpireDate}
                        onChange={(e) => handleInputChange('probationExpireDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfLeaving">Date of Leaving (Optional)</Label>
                      <Input
                        id="dateOfLeaving"
                        type="date"
                        value={newEmployee.dateOfLeaving}
                        onChange={(e) => handleInputChange('dateOfLeaving', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    Payroll Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary">Monthly Salary (PKR) *</Label>
                      <Input
                        id="salary"
                        type="number"
                        value={newEmployee.salary === 0 ? '' : newEmployee.salary}
                        placeholder="Enter monthly salary"
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            handleInputChange('salary', '')
                          } else {
                            handleInputChange('salary', parseFloat(value) || '')
                          }
                        }}
                        required
                        className={fieldErrors['salary'] ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {fieldErrors['salary'] && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors['salary']}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="accountTitle">Account Title</Label>
                      <Input
                        id="accountTitle"
                        value={newEmployee.accountTitle}
                        onChange={(e) => handleInputChange('accountTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccount">Bank Account</Label>
                      <Input
                        id="bankAccount"
                        value={newEmployee.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNewEmployee}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Popup with Animation */}
        <SuccessPopup
          isOpen={showSuccessPopup}
          message={successMessage}
          onClose={() => setShowSuccessPopup(false)}
          duration={2000}
        />

        {/* Error Popup for Validation */}
        <ErrorPopup
          isOpen={showErrorPopup}
          message={errorMessage}
          onClose={() => {
            console.log('ErrorPopup onClose called - setting showErrorPopup to false')
            setShowErrorPopup(false)
          }}
          duration={2000}
        />
      </main>
    </div>
  )
}

