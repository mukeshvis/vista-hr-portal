"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Settings,
  Clock
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

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic'

export default function MyInformationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin and if viewing personal
  const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'
  const viewPersonal = searchParams.get('view') === 'personal'

  // Redirect admin to employees page ONLY if not viewing personal
  useEffect(() => {
    if (status === 'authenticated' && isAdmin && !viewPersonal) {
      router.push('/employees')
    }
  }, [status, isAdmin, viewPersonal, router])

  useEffect(() => {
    // Allow fetching if: regular employee OR admin in personal view mode
    const shouldFetch = !isAdmin || (isAdmin && viewPersonal)

    if (status === 'authenticated' && session?.user?.emp_id && shouldFetch) {
      console.log('🔍 My Information - Fetching data for emp_id:', session.user.emp_id)
      console.log('👤 Session user:', {
        emp_id: session.user.emp_id,
        name: session.user.name,
        username: session.user.username,
        user_level: session.user.user_level,
        viewPersonal: viewPersonal
      })
      fetchEmployeeDetails()
    }
  }, [status, session?.user?.emp_id, isAdmin, viewPersonal])

  const fetchEmployeeDetails = async () => {
    if (!session?.user?.emp_id) {
      setError('Employee ID not found in session')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('📡 Fetching from API: /api/employees/' + session.user.emp_id)
      const response = await fetch(`/api/employees/${session.user.emp_id}`)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Received employee data:', {
          empId: data.empId,
          name: data.name,
          designation: data.designation
        })

        // Verify that the returned data matches the logged-in user
        if (data.empId === session.user.emp_id) {
          setEmployee(data)
          console.log('✅ Data verified: Showing correct employee information')
        } else {
          console.error('❌ Data mismatch! Expected:', session.user.emp_id, 'Got:', data.empId)
          setError('Data verification failed. Please contact support.')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        setError(errorData.error || 'Failed to fetch your information')
      }
    } catch (error) {
      console.error('❌ Error fetching your information:', error)
      setError('Failed to fetch your information')
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


  // Show loading while session or data is loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div className="h-16 bg-background border-b" />}>
          <TopNavigation session={session} />
        </Suspense>
        <main className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your information...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Redirect unauthenticated users
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div className="h-16 bg-background border-b" />}>
          <TopNavigation session={session} />
        </Suspense>
        <main className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Information Not Available</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {error || 'Your information could not be loaded.'}
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <TopNavigation session={session} />
      </Suspense>

      <main className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs md:text-sm"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Employee Header Card */}
        <Card className="mb-4 md:mb-6 p-2 md:p-4">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                {employee.gender?.toLowerCase() === 'female' || employee.gender?.toLowerCase() === 'f' ? (
                  <FemaleIcon size={60} className="sm:w-20 sm:h-20 rounded-full" />
                ) : (
                  <MaleIcon size={60} className="sm:w-20 sm:h-20 rounded-full" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between">
                  <div className="w-full">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{employee.name}</h1>
                    <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-2">{employee.designation}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      Employee ID: {employee.empId} • {employee.department}
                    </p>

                    <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm md:text-base break-words">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm md:text-base">{employee.phone}</p>
                </div>
              </div>

              {employee.professionalEmail && employee.professionalEmail !== 'N/A' && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Professional Email</p>
                    <p className="font-medium text-sm md:text-base break-words">{employee.professionalEmail}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-sm md:text-base">{employee.address}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Father&apos;s Name</p>
                  <p className="font-medium text-sm md:text-base">{employee.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium text-sm md:text-base">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium text-sm md:text-base">{employee.nationality || 'N/A'}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

        </div>

        {/* Payroll Information */}
        <Card className="mt-4 md:mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Payroll Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Salary</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{formatSalary(employee.salary)}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Title</p>
                <p className="font-medium text-sm md:text-base">{employee.accountTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bank Account</p>
                <p className="font-medium text-sm md:text-base">{employee.bankAccount}</p>
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


      </main>
    </div>
  )
}
