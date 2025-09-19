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
import { Edit, Eye, User, Building, CreditCard, ChevronDown, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { MaleIcon } from "@/components/ui/male-icon"
import { FemaleIcon } from "@/components/ui/female-icon"
import { SuccessPopup } from "@/components/ui/success-popup"

interface Employee {
  id: string
  name: string
  designation: string
  group: string
  gender?: string
  reportingManager?: string
  reportingManagerId?: number
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
  reportingManagerId: number
  joiningDate: string
  salary: number
  status: string
  gender: string
  address: string
  permanentAddress: string
  maritalStatus: string
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
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [isDesignationOpen, setIsDesignationOpen] = useState(false)
  const [designationSearch, setDesignationSearch] = useState('')
  const designationRef = useRef<HTMLDivElement>(null)
  const [managers, setManagers] = useState<DesignationOption[]>([])
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [managerSearch, setManagerSearch] = useState('')
  const managerRef = useRef<HTMLDivElement>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
    router.push(`/employees/${employeeId}`)
  }

  const handleEditEmployee = async (employeeId: string) => {
    try {
      // Fetch designations first
      const designationResponse = await fetch('/api/designations')
      if (designationResponse.ok) {
        const designationsData = await designationResponse.json()
        console.log('✅ Designations loaded:', designationsData.length, 'items')
        console.log('🔍 First few designations:', designationsData.slice(0, 3))
        setDesignations(designationsData)
      }

      // Fetch managers list
      const managersResponse = await fetch('/api/employees/managers')
      if (managersResponse.ok) {
        const managersData = await managersResponse.json()
        console.log('✅ Managers loaded:', managersData.length, 'items')
        setManagers(managersData)
      }

      // Fetch full employee details for editing
      const response = await fetch(`/api/employees/${employeeId}`)
      if (response.ok) {
        const employeeData = await response.json()
        console.log('✅ Employee data from API:', employeeData)
        console.log('🔍 Designation from API:', employeeData.designation)
        console.log('🔍 DesignationId from API:', employeeData.designationId)
        console.log('🔍 Reporting Manager from API:', employeeData.reportingManager)
        console.log('🔍 Reporting Manager ID from API:', employeeData.reportingManagerId)
        setEditData(employeeData)
        setIsEditDialogOpen(true)
      } else {
        console.error('Failed to fetch employee details')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
    }
  }

  const handleSaveChanges = async () => {
    if (!editData) return

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

      const response = await fetch(`/api/employees/${editData.id}`, {
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
        alert(`Failed to update employee: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert(`Error updating employee: ${error}`)
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


  return (
    <div className="w-full">
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
                      <FemaleIcon size={32} className="rounded-full" />
                    ) : (
                      <MaleIcon size={32} className="rounded-full" />
                    )}
                    <span className="font-medium">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2">{employee.id}</TableCell>
                <TableCell className="py-2">{employee.designation}</TableCell>
                <TableCell className="py-2">{employee.group}</TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 py-2 text-sm"
                      onClick={() => handleEditEmployee(employee.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 py-2 text-sm"
                      onClick={() => handleViewEmployee(employee.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
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
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={editData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
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
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                        </SelectContent>
                      </Select>
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
                                  option.label.toLowerCase().includes(designationSearch.toLowerCase())
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
                                option.label.toLowerCase().includes(designationSearch.toLowerCase())
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
                      <Input
                        id="department"
                        value={editData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
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
                        value={editData.joiningDate?.split('T')[0] || ''}
                        onChange={(e) => handleInputChange('joiningDate', e.target.value)}
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
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label htmlFor="salary">Monthly Salary (INR)</Label>
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
        duration={3000}
      />
    </div>
  )
}