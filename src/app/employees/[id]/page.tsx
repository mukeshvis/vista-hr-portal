"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MaleIcon } from "@/components/ui/male-icon"
import { FemaleIcon } from "@/components/ui/female-icon"
import { TopNavigation } from "@/components/top-navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  User,
  FileText,
  Clock,
  Settings
} from "lucide-react"

interface EmployeeProfile {
  id: string
  empId: string
  name: string
  email: string
  phone: string
  designation: string
  department: string
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
  grade: string
  workingHoursPolicy: string
  leavePolicy: string
  employmentStatus: string
}

export default function EmployeeProfilePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const employeeId = params?.id as string

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails()
    }
  }, [employeeId])

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/employees/${employeeId}`)

      if (response.ok) {
        const data = await response.json()
        setEmployee(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch employee details')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      setError('Failed to fetch employee details')
    } finally {
      setLoading(false)
    }
  }


  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(salary)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation session={session} />
        <main className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading employee details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation session={session} />
        <main className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Employee Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'The requested employee could not be found.'}
              </p>
              <Button onClick={() => router.push('/employees')}>
                Back to Employees
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation session={null} />

      <main className="container mx-auto px-6 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/employees')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
        </div>

        {/* Employee Header Card */}
        <Card className="mb-6 p-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {employee.gender?.toLowerCase() === 'female' || employee.gender?.toLowerCase() === 'f' ? (
                <FemaleIcon size={80} className="rounded-full" />
              ) : (
                <MaleIcon size={80} className="rounded-full" />
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{employee.name}</h1>
                    <p className="text-xl text-muted-foreground mb-2">{employee.designation}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Employee ID: {employee.empId} • {employee.department}
                    </p>

                    <div className="flex gap-2">
                      <Badge
                        variant={employee.status === 'Active' ? 'default' : 'secondary'}
                        className={employee.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
                      >
                        {employee.status}
                      </Badge>
                      <Badge variant="outline">
                        {employee.gender}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2 text-white" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
              </div>

              {employee.professionalEmail && employee.professionalEmail !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Professional Email</p>
                    <p className="font-medium">{employee.professionalEmail}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-orange-500 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{employee.address}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Father&apos;s Name</p>
                  <p className="font-medium">{employee.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">{employee.nationality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marital Status</p>
                  <p className="font-medium">{employee.maritalStatus || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNIC</p>
                  <p className="font-medium">{employee.cnic || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNIC Expiry Date</p>
                  <p className="font-medium">{employee.cnicExpiryDate ? formatDate(employee.cnicExpiryDate) : 'N/A'}</p>
                </div>
              </div>

              {employee.permanentAddress && employee.permanentAddress !== 'N/A' && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-purple-500 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Permanent Address</p>
                      <p className="font-medium">{employee.permanentAddress}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{formatDate(employee.joiningDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-indigo-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-teal-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium">{employee.designation}</p>
                </div>
              </div>

              {employee.employmentStatus && employee.employmentStatus !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Type</p>
                    <p className="font-medium">{employee.employmentStatus}</p>
                  </div>
                </div>
              )}

              {employee.grade && employee.grade !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <p className="font-medium">{employee.grade}</p>
                  </div>
                </div>
              )}

              {employee.workingHoursPolicy && employee.workingHoursPolicy !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Working Hours Policy</p>
                    <p className="font-medium">{employee.workingHoursPolicy}</p>
                  </div>
                </div>
              )}

              {employee.leavePolicy && employee.leavePolicy !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Leave Policy</p>
                    <p className="font-medium">{employee.leavePolicy}</p>
                  </div>
                </div>
              )}

              {employee.reportingManager && employee.reportingManager !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reporting Manager</p>
                    <p className="font-medium">{employee.reportingManager}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-cyan-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="font-medium">{employee.branch}</p>
                </div>
              </div>

              {employee.username && employee.username !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{employee.username}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Employment Status</p>
                <Badge
                  variant={employee.status === 'Active' ? 'default' : 'secondary'}
                  className={employee.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
                >
                  {employee.status}
                </Badge>
              </div>

              {/* Additional Job Info */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Day Off</p>
                  <p className="font-medium">{employee.dayOff || 'N/A'}</p>
                </div>
                {employee.username && employee.username !== 'N/A' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{employee.username}</p>
                  </div>
                )}
                {employee.probationExpireDate && employee.probationExpireDate !== 'N/A' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Probation Expire Date</p>
                    <p className="font-medium">{formatDate(employee.probationExpireDate)}</p>
                  </div>
                )}
                {employee.dateOfLeaving && employee.dateOfLeaving !== 'N/A' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Leaving</p>
                    <p className="font-medium">{formatDate(employee.dateOfLeaving)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payroll Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Payroll Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <p className="text-2xl font-bold text-green-600">{formatSalary(employee.salary)}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Title</p>
                  <p className="font-medium">{employee.accountTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Account</p>
                  <p className="font-medium">{employee.bankAccount}</p>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-4 w-4 mr-2 text-amber-500" />
                  View Payslips
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">Attendance Record</p>
                      <p className="text-sm text-muted-foreground">Last updated today</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="font-medium">Leave Applications</p>
                      <p className="text-sm text-muted-foreground">2 pending requests</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium">Performance Reviews</p>
                      <p className="text-sm text-muted-foreground">Next review due</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}