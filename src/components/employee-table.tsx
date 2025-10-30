"use client"

import { useState, useEffect, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Eye, User, Building, CreditCard, ChevronDown, Check, Trash2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { MaleIcon } from "@/components/ui/male-icon"
import { FemaleIcon } from "@/components/ui/female-icon"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface Employee {
  id: string
  empId?: string
  name: string
  designation: string
  group: string
  gender?: string
  reportingManager?: string
  reportingManagerId?: number
  status?: string
}

interface EmployeeProfile {
  id: string
  empId: string
  name: string
  email: string
  phone: string
  designation: string
  designationId: number
  department: string
  departmentId: number
  reportingManager: string
  reportingManagerId: number | null
  joiningDate: string
  dateOfConfirmation?: string
  salary: number
  status: string
  gender: string
  address: string
  permanentAddress: string
  maritalStatus: string
  maritalStatusId: number
  employmentStatus: string
  employmentStatusId: number
  nationality: string
  cnic: string
  bankAccount: string
  accountTitle: string
  fatherName: string
  dateOfBirth: string
  dateOfLeaving: string
  probationExpireDate: string
  cnicExpiryDate: string
  dayOff: string
  professionalEmail: string
  branch: string
  username: string
  grade: string
  workingHoursPolicy: string
  workingHoursPolicyId?: number | null
  leavePolicy: string
}

interface DesignationOption {
  value: string
  label: string
}

interface EmployeeTableProps {
  employees: Employee[]
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter()
  const [editData, setEditData] = useState<EmployeeProfile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [isDesignationOpen, setIsDesignationOpen] = useState(false)
  const [designationSearch, setDesignationSearch] = useState('')
  const designationRef = useRef<HTMLDivElement>(null)
  const [managers, setManagers] = useState<DesignationOption[]>([])
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [managerSearch, setManagerSearch] = useState('')
  const managerRef = useRef<HTMLDivElement>(null)
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<{id: number, name: string}[]>([])
  const [employmentStatuses, setEmploymentStatuses] = useState<{value: string, label: string}[]>([])
  const [workingHoursPolicies, setWorkingHoursPolicies] = useState<{id: number, name: string}[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)
  const [deletingEmployeeName, setDeletingEmployeeName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (designationRef.current && !designationRef.current.contains(event.target as Node)) {
        setIsDesignationOpen(false)
        setDesignationSearch('')
      }
      if (managerRef.current && !managerRef.current.contains(event.target as Node)) {
        setIsManagerOpen(false)
        setManagerSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Debug: Watch editData changes
  useEffect(() => {
    if (editData) {
      console.log('🔄 EditData updated:', {
        designation: editData.designation,
        designationId: editData.designationId
      })
    }
  }, [editData?.designation, editData?.designationId])

  const handleViewEmployee = (employeeId: string) => {
    setIsPageLoading(true)
    router.push(`/employees/${employeeId}`)
  }

  const handleEditEmployee = async (employeeId: string) => {
    try {
      setIsPageLoading(true)

      // Make all API calls in parallel for better performance
      const [
        designationResponse,
        managersResponse,
        maritalStatusResponse,
        employmentStatusResponse,
        workingHoursPolicyResponse,
        employeeResponse
      ] = await Promise.all([
        fetch('/api/designations?forSelect=true'),
        fetch('/api/employees/managers'),
        fetch('/api/marital-status'),
        fetch('/api/employment-status?forSelect=true'),
        fetch('/api/working-hours'),
        fetch(`/api/employees/${employeeId}`)
      ])

      // Process all responses
      if (designationResponse.ok) {
        const designationsData = await designationResponse.json()
        console.log('✅ Designations API Response:', designationsData)
        console.log('✅ Designations loaded:', designationsData.length, 'items')
        setDesignations(designationsData)
      } else {
        console.error('❌ Designations API failed:', designationResponse.status)
      }

      if (managersResponse.ok) {
        const managersData = await managersResponse.json()
        console.log('✅ Managers loaded:', managersData.length, 'items')
        setManagers(managersData)
      }

      if (maritalStatusResponse.ok) {
        const maritalStatusData = await maritalStatusResponse.json()
        console.log('✅ Marital status options loaded:', maritalStatusData.length, 'items')
        setMaritalStatusOptions(maritalStatusData)
      }

      if (employmentStatusResponse.ok) {
        const employmentStatusData = await employmentStatusResponse.json()
        console.log('✅ Employment status options loaded:', employmentStatusData.length, 'items')
        setEmploymentStatuses(employmentStatusData)
      }

      if (workingHoursPolicyResponse.ok) {
        const workingHoursData = await workingHoursPolicyResponse.json()
        console.log('✅ Working hours policies loaded:', workingHoursData.data?.length || 0, 'items')
        const policies = workingHoursData.data?.map((policy: any) => ({
          id: policy.id,
          name: policy.working_hours_policy
        })) || []
        setWorkingHoursPolicies(policies)
      }

      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json()
        console.log('✅ Employee data from API:', employeeData)
        console.log('🔍 Designation from API:', employeeData.designation)
        console.log('🔍 DesignationId from API:', employeeData.designationId)
        console.log('🔍 Reporting Manager from API:', employeeData.reportingManager)
        console.log('🔍 Reporting Manager ID from API:', employeeData.reportingManagerId)
        console.log('🔍 Joining Date from API:', employeeData.joiningDate, 'Type:', typeof employeeData.joiningDate)
        console.log('🔍 Date of Birth from API:', employeeData.dateOfBirth, 'Type:', typeof employeeData.dateOfBirth)
        setEditData(employeeData)
        setIsEditDialogOpen(true)
      } else {
        console.error('Failed to fetch employee details')
        setErrorMessage('Failed to load employee details. Please try again.')
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      setErrorMessage('Error loading employee data. Please try again.')
      setShowErrorPopup(true)
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!editData) return

    // Enhanced field validation
    const requiredFields = [
      { field: 'name', label: 'Employee Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone Number' },
      { field: 'designationId', label: 'Designation' },
      { field: 'departmentId', label: 'Department' },
      { field: 'joiningDate', label: 'Joining Date' },
      { field: 'salary', label: 'Monthly Salary' },
      { field: 'gender', label: 'Gender' },
      { field: 'address', label: 'Residential Address' },
      { field: 'permanentAddress', label: 'Permanent Address' },
      { field: 'maritalStatusId', label: 'Marital Status' },
      { field: 'employmentStatusId', label: 'Employment Type' },
      { field: 'nationality', label: 'Nationality' },
      { field: 'cnic', label: 'CNIC' },
      { field: 'fatherName', label: 'Father Name' },
      { field: 'dateOfBirth', label: 'Date of Birth' }
    ]

    // Check each required field
    for (const { field, label } of requiredFields) {
      const value = editData[field as keyof EmployeeProfile]

      // Special handling for different field types
      if (field === 'maritalStatusId' || field === 'employmentStatusId' || field === 'designationId' || field === 'departmentId') {
        // For ID fields, check if it's null, undefined, or empty string
        if (value === null || value === undefined || value === '') {
          setErrorMessage(`${label} is required. Please fill in this field.`)
          setShowErrorPopup(true)
          return
        }
      } else if (field === 'salary') {
        // For salary, check if it's <= 0
        if (!value || Number(value) <= 0) {
          setErrorMessage(`${label} is required. Please fill in this field.`)
          setShowErrorPopup(true)
          return
        }
      } else {
        // For string fields
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          setErrorMessage(`${label} is required. Please fill in this field.`)
          setShowErrorPopup(true)
          return
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (editData.email && !emailRegex.test(editData.email)) {
      setErrorMessage('Please enter a valid email address.')
      setShowErrorPopup(true)
      return
    }

    // Validate salary is positive
    const salaryNum = Number(editData.salary)
    if (salaryNum <= 0) {
      setErrorMessage('Monthly Salary must be greater than 0.')
      setShowErrorPopup(true)
      return
    }

    try {
      setIsSaving(true)

      // Convert gender text to numeric value for database
      const dataToSend = {
        ...editData,
        gender: editData.gender === 'Male' ? 1 : editData.gender === 'Female' ? 2 : editData.gender,
        designationId: editData.designationId,
        departmentId: editData.departmentId
      }

      console.log('🚀 Sending update data:', dataToSend)
      console.log('🔍 Current editData before sending:', editData)
      console.log('🔍 Designation in editData:', editData.designation)
      console.log('🔍 DesignationId in editData:', editData.designationId)

      const response = await fetch(`/api/employees/${editData.empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const updatedEmployee = await response.json()
        console.log('Updated employee:', updatedEmployee)

        // Close edit dialog first
        setIsEditDialogOpen(false)
        setEditData(null)

        // Show success popup
        setSuccessMessage(`Employee ${updatedEmployee.name} updated successfully!`)
        setShowSuccessPopup(true)

        // Refresh the page after a delay to show the popup
        setTimeout(() => {
          window.location.reload()
        }, 3500) // Give enough time for popup to show and auto-close
      } else {
        const errorData = await response.json()
        console.error('Failed to update employee:', errorData)
        setErrorMessage(`Failed to update employee: ${errorData.error || 'Unknown error'}`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setErrorMessage(`Error updating employee: ${error}`)
      setShowErrorPopup(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof EmployeeProfile, value: string | number) => {
    if (editData) {
      console.log('📝 Updating field:', field, 'with value:', value)
      const updatedData = { ...editData, [field]: value }
      console.log('📝 Updated editData will be:', updatedData)
      setEditData(updatedData)
    }
  }

  const handleDeleteClick = (employeeId: string, employeeName: string, employeeStatus?: string) => {
    setDeletingEmployeeId(employeeId)
    setDeletingEmployeeName(employeeName)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEmployeeId) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/employees?id=${deletingEmployeeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Close dialog
        setIsDeleteDialogOpen(false)

        // Show success popup
        setSuccessMessage(`Employee ${deletingEmployeeName} deleted successfully!`)
        setShowSuccessPopup(true)

        // Refresh the page after a delay to show the popup
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        setErrorMessage(`Failed to delete employee: ${errorData.error || 'Unknown error'}`)
        setShowErrorPopup(true)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      setErrorMessage(`Error deleting employee: ${error}`)
      setShowErrorPopup(true)
    } finally {
      setIsDeleting(false)
      setDeletingEmployeeId(null)
      setDeletingEmployeeName('')
    }
  }


  return (
    <div className="w-full relative">
      {/* Loading Overlay - Only Moving Loader */}
      {isPageLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{alignItems: 'flex-start', paddingTop: '100px'}}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="text-muted-foreground font-medium">Employee</TableHead>
            <TableHead className="text-muted-foreground font-medium">Employee ID</TableHead>
            <TableHead className="text-muted-foreground font-medium">Designation</TableHead>
            <TableHead className="text-muted-foreground font-medium">Group/Level</TableHead>
            <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id} className="border-b hover:bg-muted/50">
                <TableCell className="py-2">
                  <div className="flex items-center gap-3">
                    {employee.gender?.toLowerCase() === 'female' || employee.gender?.toLowerCase() === 'f' ? (
                      <FemaleIcon size={32} className="rounded-full text-pink-500" />
                    ) : (
                      <MaleIcon size={32} className="rounded-full text-blue-600" />
                    )}
                    <span className="font-medium">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2">{employee.empId || employee.id}</TableCell>
                <TableCell className="py-2">{employee.designation}</TableCell>
                <TableCell className="py-2">{employee.group}</TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 py-2 text-sm"
                      onClick={() => handleEditEmployee(employee.empId || employee.id)}
                      disabled={isPageLoading}
                    >
                      <Edit className="h-4 w-4 mr-1 text-blue-500" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 py-2 text-sm"
                      onClick={() => handleViewEmployee(employee.empId || employee.id)}
                      disabled={isPageLoading}
                    >
                      <Eye className="h-4 w-4 mr-1 text-green-500" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 py-2 text-sm"
                      onClick={() => handleDeleteClick(employee.id, employee.name, employee.status)}
                      disabled={isPageLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No employees found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <strong>{deletingEmployeeName}</strong>? This action will remove the employee from the active list.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingEmployeeId(null)
                  setDeletingEmployeeName('')
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
          </DialogHeader>

          {editData && (
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
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="empId">Employee ID</Label>
                      <Input
                        id="empId"
                        value={editData.empId}
                        onChange={(e) => handleInputChange('empId', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="professionalEmail">Professional Email</Label>
                      <Input
                        id="professionalEmail"
                        type="email"
                        value={editData.professionalEmail}
                        onChange={(e) => handleInputChange('professionalEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={editData.gender}
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
                        value={editData.maritalStatus}
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
                        value={editData.employmentStatusId?.toString() || ''}
                        onValueChange={(value) => handleInputChange('employmentStatusId', value)}
                        placeholder="Select employment type..."
                        searchPlaceholder="Search employment types..."
                      />
                      {employmentStatuses.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">Loading employment types...</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={editData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnic">CNIC</Label>
                      <Input
                        id="cnic"
                        value={editData.cnic}
                        onChange={(e) => handleInputChange('cnic', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fatherName">Father&apos;s Name</Label>
                      <Input
                        id="fatherName"
                        value={editData.fatherName}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editData.dateOfBirth ? (editData.dateOfBirth.includes('T') ? editData.dateOfBirth.split('T')[0] : editData.dateOfBirth) : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnicExpiryDate">CNIC Expiry Date</Label>
                      <Input
                        id="cnicExpiryDate"
                        type="date"
                        value={editData.cnicExpiryDate ? (editData.cnicExpiryDate.includes('T') ? editData.cnicExpiryDate.split('T')[0] : editData.cnicExpiryDate) : ''}
                        onChange={(e) => handleInputChange('cnicExpiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={editData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanentAddress">Permanent Address</Label>
                    <Textarea
                      id="permanentAddress"
                      value={editData.permanentAddress}
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
                      <Label htmlFor="designation">Designation</Label>
                      <div className="relative" ref={designationRef}>
                        <button
                          type="button"
                          onClick={() => setIsDesignationOpen(!isDesignationOpen)}
                          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                        >
                          <span className="block truncate text-black">
                            {editData.designation || "Select designation..."}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDesignationOpen ? "transform rotate-180" : ""}`} />
                        </button>

                        {isDesignationOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search designations..."
                                value={designationSearch}
                                onChange={(e) => setDesignationSearch(e.target.value)}
                                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Options */}
                            <div className="max-h-48 overflow-y-auto">
                              {designations
                                .filter(option =>
                                  option?.label?.toLowerCase().includes(designationSearch.toLowerCase())
                                )
                                .map((option) => (
                                <div
                                  key={option.value}
                                  onClick={() => {
                                    console.log('🎯 Selected designation:', option.label, 'with ID:', option.value)
                                    console.log('🔍 Before update - current designationId:', editData.designationId)

                                    const newDesignationId = parseInt(option.value)
                                    console.log('🔍 Will update designationId to:', newDesignationId)

                                    // Update both designation and designationId in a single state update
                                    if (editData) {
                                      const updatedData = {
                                        ...editData,
                                        designation: option.label,
                                        designationId: newDesignationId
                                      }
                                      console.log('📝 Setting both fields together:', {
                                        designation: option.label,
                                        designationId: newDesignationId
                                      })
                                      setEditData(updatedData)
                                    }

                                    setIsDesignationOpen(false)
                                    setDesignationSearch('')
                                  }}
                                  className="px-3 py-2 cursor-pointer flex items-center bg-white hover:bg-gray-100 text-black"
                                >
                                  <Check
                                    className={`w-4 h-4 mr-2 text-black ${
                                      editData.designation === option.label ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <span className="text-black">{option.label}</span>
                                </div>
                              ))}

                              {designations.filter(option =>
                                option?.label?.toLowerCase().includes(designationSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-500 text-sm bg-white">
                                  No designations found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={editData.department}
                        onValueChange={(value) => handleInputChange('department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {[
                            'Rating Division',
                            'Operation Division',
                            'Finance & Accounts',
                            'Compliance',
                            'Management Information System / Information Technology',
                            'General Department',
                            'VITAL',
                            'Pak Ujala',
                            'News VIS'
                          ].map((dept) => (
                            <SelectItem key={dept} value={dept} className="bg-white hover:bg-gray-100">
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="grade">Grade</Label>
                      <Select
                        value={editData.grade || ''}
                        onValueChange={(value) => handleInputChange('grade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto bg-white">
                          {['32', '33', '4', '44', '77', 'abc intern', 'CL-1', 'CLE-I', 'CLE-II', 'CLE-III', 'CLE-IV',
                            'ENG 1', 'ENG 2', 'ENG 3', 'ENG II', 'ENG III', 'ENG-11', 'ENG-111', 'ENG-I', 'ENG-II',
                            'ENG-III', 'ENG-IV', 'ENG-V', 'Eng-v', 'EX III', 'EX IV', 'EX-1', 'EX-I', 'EX-II', 'EX-III',
                            'EX-IV', 'EX-V', 'EXG II', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'Grade Scale', 'Non',
                            'President & CEO'].map((grade) => (
                            <SelectItem key={grade} value={grade} className="bg-white hover:bg-gray-100">
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="workingHoursPolicy">Working Hours Policy</Label>
                      <Select
                        value={editData.workingHoursPolicyId?.toString() || ''}
                        onValueChange={(value) => handleInputChange('workingHoursPolicyId', parseInt(value))}
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
                      <Label htmlFor="leavePolicy">Leave Policy</Label>
                      <Select
                        value={editData.leavePolicy || ''}
                        onValueChange={(value) => handleInputChange('leavePolicy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave policy..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto bg-white">
                          {[
                            'Annual & Emergency',
                            'Annual, Emergency and sick customized 14.5 days',
                            'Annual, Emergency and sick 15 days',
                            'Annual, emergency and sick half yearly',
                            'July-2022 to June-2023',
                            'July-2023 to June-2024',
                            'July-2024 to June-2025',
                            'July-2025 to June-2026'
                          ].map((policy, index) => (
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
                        value={editData.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportingManager">Reporting Manager</Label>
                      <div className="relative" ref={managerRef}>
                        <button
                          type="button"
                          onClick={() => setIsManagerOpen(!isManagerOpen)}
                          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                        >
                          <span className="block truncate text-black">
                            {editData.reportingManager || "Select reporting manager..."}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isManagerOpen ? "transform rotate-180" : ""}`} />
                        </button>

                        {isManagerOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search managers..."
                                value={managerSearch}
                                onChange={(e) => setManagerSearch(e.target.value)}
                                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Options */}
                            <div className="max-h-48 overflow-y-auto">
                              {/* Clear selection option */}
                              <div
                                onClick={() => {
                                  console.log('🎯 Clearing reporting manager selection')
                                  if (editData) {
                                    const updatedData = {
                                      ...editData,
                                      reportingManager: '',
                                      reportingManagerId: null
                                    }
                                    setEditData(updatedData)
                                  }
                                  setIsManagerOpen(false)
                                  setManagerSearch('')
                                }}
                                className="px-3 py-2 cursor-pointer flex items-center bg-white hover:bg-gray-100 text-black border-b border-gray-100"
                              >
                                <span className="text-gray-500 text-sm">Clear selection</span>
                              </div>

                              {managers
                                .filter(option =>
                                  option.label.toLowerCase().includes(managerSearch.toLowerCase())
                                )
                                .map((option) => (
                                <div
                                  key={option.value}
                                  onClick={() => {
                                    console.log('🎯 Selected manager:', option.label, 'with ID:', option.value)
                                    console.log('🔍 Before update - current reportingManagerId:', editData.reportingManagerId)

                                    const newManagerId = parseInt(option.value)
                                    console.log('🔍 Will update reportingManagerId to:', newManagerId)

                                    // Update both reportingManager and reportingManagerId in a single state update
                                    if (editData) {
                                      const updatedData = {
                                        ...editData,
                                        reportingManager: option.label,
                                        reportingManagerId: newManagerId
                                      }
                                      console.log('📝 Setting both fields together:', {
                                        reportingManager: option.label,
                                        reportingManagerId: newManagerId
                                      })
                                      setEditData(updatedData)
                                    }

                                    setIsManagerOpen(false)
                                    setManagerSearch('')
                                  }}
                                  className="px-3 py-2 cursor-pointer flex items-center bg-white hover:bg-gray-100 text-black"
                                >
                                  <Check
                                    className={`w-4 h-4 mr-2 text-black ${
                                      editData.reportingManager === option.label ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <span className="text-black">{option.label}</span>
                                </div>
                              ))}

                              {managers.filter(option =>
                                option.label.toLowerCase().includes(managerSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-500 text-sm bg-white">
                                  No managers found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        value={editData.joiningDate ? (editData.joiningDate.includes('T') ? editData.joiningDate.split('T')[0] : editData.joiningDate) : ''}
                        onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfConfirmation">Date of Confirmation</Label>
                      <Input
                        id="dateOfConfirmation"
                        type="date"
                        value={editData.dateOfConfirmation ? (editData.dateOfConfirmation.includes('T') ? editData.dateOfConfirmation.split('T')[0] : editData.dateOfConfirmation) : ''}
                        onChange={(e) => handleInputChange('dateOfConfirmation', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Employment Status</Label>
                      <Select
                        value={editData.status}
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
                        value={editData.dayOff || ''}
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
                        value={editData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="probationExpireDate">Probation Expire Date</Label>
                      <Input
                        id="probationExpireDate"
                        type="date"
                        value={editData.probationExpireDate ? (editData.probationExpireDate.includes('T') ? editData.probationExpireDate.split('T')[0] : editData.probationExpireDate) : ''}
                        onChange={(e) => handleInputChange('probationExpireDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfLeaving">Date of Leaving (Optional)</Label>
                      <Input
                        id="dateOfLeaving"
                        type="date"
                        value={editData.dateOfLeaving ? (editData.dateOfLeaving.includes('T') ? editData.dateOfLeaving.split('T')[0] : editData.dateOfLeaving) : ''}
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
                      <Label htmlFor="salary">Monthly Salary (PKR)</Label>
                      <Input
                        id="salary"
                        type="number"
                        value={editData.salary}
                        onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountTitle">Account Title</Label>
                      <Input
                        id="accountTitle"
                        value={editData.accountTitle}
                        onChange={(e) => handleInputChange('accountTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccount">Bank Account</Label>
                      <Input
                        id="bankAccount"
                        value={editData.bankAccount}
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
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        message={successMessage}
        onClose={() => setShowSuccessPopup(false)}
        duration={2000}
      />

      {/* Error Popup */}
      <ErrorPopup
        isOpen={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
        duration={2000}
      />

    </div>
  )
}