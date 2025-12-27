"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TopNavigation } from "@/components/top-navigation"
import {
  Clock,
  Users,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ArrowLeft
} from "lucide-react"

interface Employee {
  pin_manual: string
  pin_auto: string
  user_name: string
  password: string
  privilege: string
}

interface AttendanceRecord {
  employeeName: string
  pinAuto: string
  userId: string
  attendanceStatus: 'Present' | 'Absent' | 'Late' | 'Unknown'
  timeIn: string
  timeOut: string
  totalTime: string
  checkInVerifyMode: string
  checkOutVerifyMode: string
  timingStatus: 'Punctual' | 'Late' | '--'
}

interface AttendanceLog {
  user_id: string
  state: string
  punch_time: string
  verify_mode: string
}

// Force dynamic rendering to prevent prerender errors with useSearchParams
export const dynamic = 'force-dynamic'

function AttendancePageContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const viewPersonal = searchParams.get('view') === 'personal'

  // Check if user is admin (but treat as employee if viewing personal dashboard)
  const isActualAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'
  const isAdmin = isActualAdmin && !viewPersonal

  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userPinAuto, setUserPinAuto] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // Function to get days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // Function to update date safely
  const updateDate = (newYear?: string, newMonth?: string, newDay?: string) => {
    const currentParts = selectedDate.split('-')
    const year = parseInt(newYear || currentParts[0])
    const month = parseInt(newMonth || currentParts[1])
    const day = parseInt(newDay || currentParts[2])

    const maxDays = getDaysInMonth(year, month)
    const safeDay = Math.min(day, maxDays)

    setSelectedDate(`${year}-${month.toString().padStart(2, '0')}-${safeDay.toString().padStart(2, '0')}`)
  }

  // Fetch attendance logs for both start and end date
  const fetchAttendanceLogs = async (date: string, forceRefresh = false) => {
    try {
      const formattedDate = formatDateForAPI(date)

      console.log(`Fetching attendance for date:`, date, `(force_refresh: ${forceRefresh})`)
      console.log(`Formatted date for API:`, formattedDate)

      const requestBody = {
        start_date: formattedDate,
        end_date: formattedDate,
        force_refresh: forceRefresh
      }

      console.log(`Sending POST request body:`, requestBody)

      const response = await fetch('/api/attendance/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Attendance logs response (source: ${result.source}):`, result)
        return result.data || []
      } else {
        console.error(`Failed to fetch attendance logs:`, response.status, response.statusText)
      }
    } catch (error) {
      console.error(`Error fetching attendance logs:`, error)
    }
    return []
  }

  // Format date for API (DD/MM/YYYY format)
  const formatDateForAPI = (date: string) => {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  // Specific employees with 10-hour requirement (8 AM to 6 PM)
  const TEN_HOUR_EMPLOYEES = ['13', '14', '45', '1691479623873', '1691479623595']

  // Specific employees with 9-hour requirement (9 AM to 6 PM, including weekends 9 AM to 3 PM)
  const NINE_HOUR_EMPLOYEES = ['16', '3819']

  // Calculate total time between two timestamps WITHIN office hours window
  // 8-hour employees: 9:00 AM to 5:30 PM
  // 10-hour employees: 8:00 AM to 6:00 PM
  // 9-hour employees: 9:00 AM to 6:00 PM
  const calculateTotalTime = (timeIn: string, timeOut: string, pinAuto: string) => {
    if (timeIn === '--' || timeOut === '--') return '--'

    try {
      // Determine office hours window based on employee type
      const requires10Hours = TEN_HOUR_EMPLOYEES.includes(pinAuto)
      const requires9Hours = NINE_HOUR_EMPLOYEES.includes(pinAuto)

      let officeStartHour: number
      let officeStartMinute: number
      let officeEndHour: number
      let officeEndMinute: number

      if (requires10Hours) {
        // 10-hour employees: 8:00 AM to 6:00 PM
        officeStartHour = 8
        officeStartMinute = 0
        officeEndHour = 18
        officeEndMinute = 0
      } else if (requires9Hours) {
        // 9-hour employees: 9:00 AM to 6:00 PM
        officeStartHour = 9
        officeStartMinute = 0
        officeEndHour = 18
        officeEndMinute = 0
      } else {
        // Regular 8-hour employees: 9:00 AM to 5:30 PM
        officeStartHour = 9
        officeStartMinute = 0
        officeEndHour = 17
        officeEndMinute = 30
      }

      // Create office window times
      const officeStart = new Date(`2025-01-01 ${officeStartHour}:${officeStartMinute.toString().padStart(2, '0')}:00`)
      const officeEnd = new Date(`2025-01-01 ${officeEndHour}:${officeEndMinute.toString().padStart(2, '0')}:00`)

      // Parse employee's actual times
      let inTime = new Date(`2025-01-01 ${timeIn}`)
      let outTime = new Date(`2025-01-01 ${timeOut}`)

      if (outTime < inTime) {
        // Handle next day case
        outTime.setDate(outTime.getDate() + 1)
      }

      // Cap times within office hours window
      // If employee came before office start, count from office start
      if (inTime < officeStart) {
        inTime = officeStart
      }
      // If employee left after office end, count until office end
      if (outTime > officeEnd) {
        outTime = officeEnd
      }

      // If employee came after office end or left before office start, no valid time
      if (inTime >= officeEnd || outTime <= officeStart) {
        return '0h 0m'
      }

      const diffMs = outTime.getTime() - inTime.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      return `${hours}h ${minutes}m`
    } catch {
      return '--'
    }
  }

  // Calculate timing status based on employee type and required hours
  // Regular (8-hour): Must complete 8 hours
  // 10-hour employees: Must complete 10 hours
  // 9-hour employees: Must complete 9 hours
  // Status = "Punctual" if completed required hours, "Late" if not
  const getTimingStatus = (timeIn: string, totalTime: string, pinAuto: string): 'Punctual' | 'Late' | '--' => {
    if (timeIn === '--' || totalTime === '--') return '--'

    try {
      // Extract total hours and minutes worked from "8h 30m" format
      const hoursMatch = totalTime.match(/(\d+)h/)
      const minutesMatch = totalTime.match(/(\d+)m/)
      const totalHours = hoursMatch ? parseInt(hoursMatch[1]) : 0
      const totalMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 0

      // Convert to decimal hours for accurate comparison
      const totalWorkedHours = totalHours + (totalMinutes / 60)

      // Determine required hours based on employee type
      const requires10Hours = TEN_HOUR_EMPLOYEES.includes(pinAuto)
      const requires9Hours = NINE_HOUR_EMPLOYEES.includes(pinAuto)

      let requiredHours: number

      if (requires10Hours) {
        requiredHours = 10
      } else if (requires9Hours) {
        requiredHours = 9
      } else {
        requiredHours = 8
      }

      // Check if employee completed their required hours
      if (totalWorkedHours >= requiredHours) {
        return 'Punctual'
      } else {
        return 'Late'
      }
    } catch {
      return '--'
    }
  }

  // Get background color based on total working hours and attendance status
  const getTotalTimeStyles = (totalTime: string, attendanceStatus: string, pinAuto: string) => {
    if (totalTime === '--' || attendanceStatus === 'Absent') {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-black',
        showAlert: false
      }
    }

    // Extract hours from "8h 30m" format
    const hoursMatch = totalTime.match(/(\d+)h/)
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0

    // Check if this employee requires 10 hours
    const requires10Hours = TEN_HOUR_EMPLOYEES.includes(pinAuto)

    // Check if this employee requires 9 hours
    const requires9Hours = NINE_HOUR_EMPLOYEES.includes(pinAuto)

    if (requires10Hours) {
      // For 10-hour employees
      if (hours >= 10) {
        // Met 10-hour requirement (Green - Good)
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-black',
          showAlert: false
        }
      } else {
        // Did not meet 10-hour requirement (Red Alert!)
        return {
          bgColor: 'bg-red-200',
          textColor: 'text-red-800 font-bold',
          showAlert: true,
          alertMessage: '⚠️ Required: 10 hours'
        }
      }
    } else if (requires9Hours) {
      // For 9-hour employees
      if (hours >= 9) {
        // Met 9-hour requirement (Green - Good)
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-black',
          showAlert: false
        }
      } else {
        // Did not meet 9-hour requirement (Red Alert!)
        return {
          bgColor: 'bg-red-200',
          textColor: 'text-red-800 font-bold',
          showAlert: true,
          alertMessage: '⚠️ Required: 9 hours'
        }
      }
    } else {
      // For regular 8-hour employees
      if (hours >= 8) {
        // Full time: 8+ hours (Green - Good)
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-black',
          showAlert: false
        }
      } else if (hours >= 7) {
        // Moderate time: 7-7.9 hours (Yellow - Moderate)
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-black',
          showAlert: false
        }
      } else {
        // Less time: Under 7 hours (Red - Low)
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-black',
          showAlert: false
        }
      }
    }
  }

  // Extract time from punch_time string
  const extractTime = (punchTime: string) => {
    if (!punchTime) return '--'
    try {
      // Handle both formats:
      // 1. Database format: "2025-10-06 08:30:15" (24-hour)
      // 2. API format: "2025-09-25 05:11:00 PM" (12-hour with AM/PM)

      const parts = punchTime.split(' ')

      if (parts.length >= 2) {
        const timePart = parts[1] // "08:30:15" or "05:11:00"
        const ampm = parts[2] // "PM" or undefined

        if (ampm) {
          // Already has AM/PM, return as is
          return `${timePart} ${ampm}`
        } else {
          // Convert 24-hour to 12-hour format with AM/PM
          const [hours, minutes, seconds] = timePart.split(':')
          let hour = parseInt(hours)
          const period = hour >= 12 ? 'PM' : 'AM'
          hour = hour % 12 || 12 // Convert 0 to 12 for midnight
          return `${String(hour).padStart(2, '0')}:${minutes}:${seconds} ${period}`
        }
      }

      return '--'
    } catch {
      return '--'
    }
  }

  // Fetch employees data and attendance logs
  const fetchEmployees = async (forceRefresh = false) => {
    try {
      setLoading(true)

      console.log('=== Starting attendance fetch ===')
      console.log('Current selectedDate:', selectedDate)
      console.log('Force refresh:', forceRefresh)
      console.log('Today\'s date:', new Date().toISOString().split('T')[0])

      // Fetch employees
      const employeeResponse = await fetch('/api/attendance/employees')

      if (!employeeResponse.ok) {
        throw new Error('Failed to fetch employees')
      }

      const employeeResult = await employeeResponse.json()
      const employeesData = employeeResult.data || []
      console.log('Employees count:', employeesData.length)
      setEmployees(employeesData)

      // Fetch attendance logs for selected date
      const attendanceLogs = await fetchAttendanceLogs(selectedDate, forceRefresh)

      console.log('Total attendance logs count:', attendanceLogs.length)
      console.log('Attendance logs:', attendanceLogs)

      // Separate check-in and check-out logs
      const checkInLogs = attendanceLogs.filter((log: AttendanceLog) => log.state === 'Check In')
      const checkOutLogs = attendanceLogs.filter((log: AttendanceLog) => log.state === 'Check Out')

      console.log('Check-in logs count:', checkInLogs.length)
      console.log('Check-out logs count:', checkOutLogs.length)

      // Create attendance records with real data
      const records: AttendanceRecord[] = employeesData.map((emp: Employee) => {
        // Find matching logs by pin_auto (user_id in logs)
        const checkIn = checkInLogs.find((log: AttendanceLog) => log.user_id === emp.pin_auto)
        const checkOut = checkOutLogs.find((log: AttendanceLog) => log.user_id === emp.pin_auto)

        const timeIn = checkIn ? extractTime(checkIn.punch_time) : '--'
        const timeOut = checkOut ? extractTime(checkOut.punch_time) : '--'
        const totalTime = calculateTotalTime(timeIn, timeOut, emp.pin_auto)

        // Get verify modes (FACE = machine, FORM = manual HR edit)
        const checkInVerifyMode = checkIn ? (checkIn.verify_mode || 'UNKNOWN') : '--'
        const checkOutVerifyMode = checkOut ? (checkOut.verify_mode || 'UNKNOWN') : '--'

        console.log(`Employee ${emp.user_name}:`, {
          checkIn: timeIn,
          checkInMode: checkInVerifyMode,
          checkOut: timeOut,
          checkOutMode: checkOutVerifyMode
        })

        // Determine attendance status
        let status: 'Present' | 'Absent' | 'Late' | 'Unknown' = 'Absent'
        if (checkIn) {
          status = 'Present'
          // You can add late logic here based on your requirements
          // For example: if timeIn > "09:00:00 AM" then status = 'Late'
        }

        // Calculate timing status
        const timingStatus = getTimingStatus(timeIn, totalTime, emp.pin_auto)

        return {
          employeeName: emp.user_name,
          pinAuto: emp.pin_auto,
          userId: emp.pin_auto,
          attendanceStatus: status,
          timeIn,
          timeOut,
          totalTime,
          checkInVerifyMode,
          checkOutVerifyMode,
          timingStatus
        }
      })

      console.log('Final attendance records:', records)
      setAttendanceRecords(records)

    } catch (error) {
      console.error('Error fetching attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when date changes
  useEffect(() => {
    fetchEmployees()
  }, [selectedDate])

  // Fetch user's pin_auto for employee filtering
  useEffect(() => {
    const fetchUserPinAuto = async () => {
      if (!isAdmin && session?.user?.emp_id) {
        try {
          console.log('🔍 Looking for employee with emp_id:', session.user.emp_id)
          console.log('👤 Session user:', {
            emp_id: session.user.emp_id,
            username: session.user.username,
            name: session.user.name,
            email: session.user.email
          })

          // Fetch the employee's pin_auto from the API
          const response = await fetch('/api/attendance/employees')
          if (response.ok) {
            const result = await response.json()
            const employeesData = result.data || []

            console.log('📋 Total employees in biometric system:', employeesData.length)
            console.log('📋 First few employees:', employeesData.slice(0, 3))

            // Try multiple matching strategies
            let userEmployee = null

            // Strategy 1: Direct match emp_id with pin_auto
            userEmployee = employeesData.find((emp: Employee) => emp.pin_auto === session.user.emp_id)
            if (userEmployee) console.log('✅ Match Strategy 1: pin_auto === emp_id')

            // Strategy 2: Match emp_id with pin_manual
            if (!userEmployee) {
              userEmployee = employeesData.find((emp: Employee) => emp.pin_manual === session.user.emp_id)
              if (userEmployee) console.log('✅ Match Strategy 2: pin_manual === emp_id')
            }

            // Strategy 3: Match username with user_name (case insensitive)
            if (!userEmployee && session.user.username) {
              userEmployee = employeesData.find((emp: Employee) =>
                emp.user_name.toLowerCase() === session.user.username.toLowerCase()
              )
              if (userEmployee) console.log('✅ Match Strategy 3: user_name === username')
            }

            // Strategy 4: Match name with user_name (case insensitive)
            if (!userEmployee && session.user.name) {
              userEmployee = employeesData.find((emp: Employee) =>
                emp.user_name.toLowerCase() === session.user.name?.toLowerCase()
              )
              if (userEmployee) console.log('✅ Match Strategy 4: user_name === name')
            }

            if (userEmployee) {
              setUserPinAuto(userEmployee.pin_auto)
              console.log('✅ Found user in biometric system:', {
                pin_auto: userEmployee.pin_auto,
                pin_manual: userEmployee.pin_manual,
                user_name: userEmployee.user_name
              })
            } else {
              console.error('❌ Could not find employee in biometric system for emp_id:', session.user.emp_id)
              console.error('❌ Available employees:', employeesData.map((e: Employee) => ({
                pin_auto: e.pin_auto,
                pin_manual: e.pin_manual,
                user_name: e.user_name
              })).slice(0, 5))
              console.error('⚠️ Please check if this user exists in the biometric system')
            }
          }
        } catch (error) {
          console.error('Error fetching user pin_auto:', error)
        }
      }
    }

    fetchUserPinAuto()
  }, [isAdmin, session?.user?.emp_id, session?.user?.username, session?.user?.name, session?.user?.email])

  // Load initial data
  useEffect(() => {
    fetchEmployees()
  }, [])

  // Handle employee name click for detailed attendance search
  const handleEmployeeClick = (pinAuto: string, employeeName: string) => {
    console.log('Employee clicked:', { pinAuto, employeeName })
    // Navigate to employee detail page
    window.open(`/attendance/employee/${pinAuto}?name=${encodeURIComponent(employeeName)}`, '_blank')
  }

  // Filter attendance records based on search term and user_level
  const filteredRecords = attendanceRecords.filter(record => {
    // Search term filter
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())

    // User level filter: employees can only see their own attendance
    if (!isAdmin) {
      // Use the fetched userPinAuto if available, otherwise try direct emp_id match
      const pinToMatch = userPinAuto || session?.user?.emp_id
      return matchesSearch && record.pinAuto === pinToMatch
    }

    // Admins can see all
    return matchesSearch
  })

  // Get attendance status badge
  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Present</Badge>
      case 'Late':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>
      case 'Absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>
    }
  }

  // Get mobile-specific attendance status badge (smaller)
  const getMobileAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0.5"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />Present</Badge>
      case 'Late':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-[10px] px-1.5 py-0.5"><AlertCircle className="w-2.5 h-2.5 mr-0.5" />Late</Badge>
      case 'Absent':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5 py-0.5"><XCircle className="w-2.5 h-2.5 mr-0.5" />Absent</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-[10px] px-1.5 py-0.5"><AlertCircle className="w-2.5 h-2.5 mr-0.5" />Unknown</Badge>
    }
  }

  // Get timing status badge (Punctual/Late based on office hours completion)
  const getTimingStatusBadge = (status: 'Punctual' | 'Late' | '--') => {
    switch (status) {
      case 'Punctual':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" />Punctual</Badge>
      case 'Late':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>
      default:
        return <span className="text-gray-400 text-sm">--</span>
    }
  }

  // Get mobile timing status badge (smaller)
  const getMobileTimingStatusBadge = (status: 'Punctual' | 'Late' | '--') => {
    switch (status) {
      case 'Punctual':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0.5"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />Punctual</Badge>
      case 'Late':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0.5"><AlertCircle className="w-2.5 h-2.5 mr-0.5" />Late</Badge>
      default:
        return <span className="text-gray-400 text-[10px]">--</span>
    }
  }

  // Get combined verify mode display (Check-In Mode - Check-Out Mode)
  const getCombinedVerifyMode = (checkInMode: string, checkOutMode: string) => {
    // Handle cases where data is not available
    if (checkInMode === '--' && checkOutMode === '--') {
      return <span className="text-gray-400 text-sm">--</span>
    }

    // Convert FACE to Machine and FORM to Manual
    const formatMode = (mode: string) => {
      if (mode === '--') return '--'
      if (mode === 'FACE') return 'Machine'
      if (mode === 'FORM') return 'Manual'
      return mode
    }

    const inMode = formatMode(checkInMode)
    const outMode = formatMode(checkOutMode)

    // Determine badge color based on modes
    let badgeClass = 'bg-gray-100 text-gray-700'

    if (inMode === 'Machine' && outMode === 'Machine') {
      badgeClass = 'bg-blue-100 text-blue-700'
    } else if (inMode === 'Manual' && outMode === 'Manual') {
      badgeClass = 'bg-orange-100 text-orange-700'
    } else if (inMode !== '--' && outMode !== '--') {
      badgeClass = 'bg-purple-100 text-purple-700'
    }

    return (
      <Badge className={`${badgeClass} hover:${badgeClass} text-sm font-medium`}>
        {inMode}-{outMode}
      </Badge>
    )
  }

  // Get mobile-specific verify mode display (smaller)
  const getMobileCombinedVerifyMode = (checkInMode: string, checkOutMode: string) => {
    // Handle cases where data is not available
    if (checkInMode === '--' && checkOutMode === '--') {
      return <span className="text-gray-400 text-[10px]">--</span>
    }

    // Convert FACE to Machine and FORM to Manual
    const formatMode = (mode: string) => {
      if (mode === '--') return '--'
      if (mode === 'FACE') return 'Machine'
      if (mode === 'FORM') return 'Manual'
      return mode
    }

    const inMode = formatMode(checkInMode)
    const outMode = formatMode(checkOutMode)

    // Determine badge color based on modes
    let badgeClass = 'bg-gray-100 text-gray-700'

    if (inMode === 'Machine' && outMode === 'Machine') {
      badgeClass = 'bg-blue-100 text-blue-700'
    } else if (inMode === 'Manual' && outMode === 'Manual') {
      badgeClass = 'bg-orange-100 text-orange-700'
    } else if (inMode !== '--' && outMode !== '--') {
      badgeClass = 'bg-purple-100 text-purple-700'
    }

    return (
      <Badge className={`${badgeClass} hover:${badgeClass} text-[10px] px-1.5 py-0.5 font-medium`}>
        {inMode}-{outMode}
      </Badge>
    )
  }

  // Stats calculation
  const totalEmployees = attendanceRecords.length
  const presentCount = attendanceRecords.filter(r => r.attendanceStatus === 'Present').length
  const absentCount = attendanceRecords.filter(r => r.attendanceStatus === 'Absent').length
  const lateCount = attendanceRecords.filter(r => r.attendanceStatus === 'Late').length

  // Show loading state while session is loading
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-green-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-3">
              <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Attendance</p>
          <p className="text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <TopNavigation session={session} />
      </Suspense>

      {/* Attendance Content */}
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Back to Admin Dashboard button (only for admins viewing personal) */}
        {isActualAdmin && viewPersonal && (
          <div className="flex justify-start">
            <Button
              onClick={() => window.location.href = '/attendance'}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Back to Admin View</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs md:text-sm"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              {isAdmin ? 'Attendance Management' : 'My Attendance'}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 sm:gap-2 bg-purple-50 border border-purple-200 rounded-lg px-2 sm:px-3 py-2 w-full sm:w-auto overflow-x-auto">
              <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <select
                value={selectedDate.split('-')[0]}
                onChange={(e) => updateDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-gray-700 min-w-[60px]"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="text-gray-400 text-xs">-</span>
              <select
                value={selectedDate.split('-')[1]}
                onChange={(e) => updateDate(undefined, e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-gray-700 min-w-[50px]"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {new Date(2000, month - 1).toLocaleDateString('en', { month: 'short' })}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 text-xs">-</span>
              <select
                value={selectedDate.split('-')[2]}
                onChange={(e) => updateDate(undefined, undefined, e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-gray-700 min-w-[40px]"
              >
                {Array.from({length: getDaysInMonth(parseInt(selectedDate.split('-')[0]), parseInt(selectedDate.split('-')[1]))}, (_, i) => i + 1).map(day => (
                  <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                ))}
              </select>
            </div>
            {/* Manage Holidays - Admin Only */}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/attendance/holidays'}
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto text-xs md:text-sm"
              >
                <Settings className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Manage Holidays</span>
                <span className="md:hidden">Holidays</span>
              </Button>
            )}
          </div>
        </div>


        {/* Attendance Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <CardTitle className="text-base md:text-lg lg:text-xl text-slate-800 flex items-center gap-2 flex-wrap">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                <span>{isAdmin ? 'Daily Attendance' : 'My Daily Attendance'}</span>
                <span className="text-sm md:text-base text-muted-foreground">- {new Date(selectedDate).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {isAdmin && (
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64 md:w-80 text-sm"
                    />
                  </div>
                )}
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 w-full sm:w-auto text-sm"
                  onClick={() => fetchEmployees(false)}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-sm md:text-base text-gray-600">Loading attendance data...</span>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100 border border-purple-200 rounded-lg">
                      <tr>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            Employee Name
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Status
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            Time In
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-600" />
                            Time Out
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-purple-600" />
                            Mode
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            Total Time
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-purple-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            Timing Status
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                          <tr key={index} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleEmployeeClick(record.pinAuto, record.employeeName)}
                                className="font-medium text-sm text-black hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                              >
                                {record.employeeName}
                              </button>
                            </td>
                            <td className="py-3 px-3">
                              {getAttendanceStatusBadge(record.attendanceStatus)}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              <span className="bg-purple-100 px-2 py-1 rounded text-xs text-black">
                                {record.timeIn}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              <span className="bg-orange-100 px-2 py-1 rounded text-xs text-black">
                                {record.timeOut}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {getCombinedVerifyMode(record.checkInVerifyMode, record.checkOutVerifyMode)}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              {(() => {
                                const styles = getTotalTimeStyles(record.totalTime, record.attendanceStatus, record.pinAuto)
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className={`${styles.bgColor} ${styles.textColor} px-2 py-1 rounded text-xs whitespace-nowrap`}>
                                      {record.totalTime}
                                    </span>
                                    {styles.showAlert && (
                                      <span className="text-red-600 text-xs font-semibold whitespace-nowrap">
                                        {styles.alertMessage}
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="py-3 px-3">
                              {getTimingStatusBadge(record.timingStatus)}
                            </td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record, index) => (
                      <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
                        <CardContent className="p-3 space-y-3">
                          {/* Header: Employee Name & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleEmployeeClick(record.pinAuto, record.employeeName)}
                              className="flex items-center gap-2 flex-1 min-w-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Users className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-xs truncate hover:text-blue-600 transition-colors">
                                  {record.employeeName}
                                </p>
                                <p className="text-[10px] text-gray-500">Tap to view</p>
                              </div>
                            </button>
                            <div className="flex-shrink-0">
                              {getMobileAttendanceStatusBadge(record.attendanceStatus)}
                            </div>
                          </div>

                          {/* Time Cards Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Time In Card */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <Clock className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-emerald-700">Time In</span>
                              </div>
                              <p className="text-base font-bold text-emerald-900">{record.timeIn}</p>
                            </div>

                            {/* Time Out Card */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                                  <Clock className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-orange-700">Time Out</span>
                              </div>
                              <p className="text-base font-bold text-orange-900">{record.timeOut}</p>
                            </div>
                          </div>

                          {/* Footer: Total Time & Mode */}
                          <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 border border-gray-200">
                            {/* Total Time */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Calendar className="h-2.5 w-2.5 text-white" />
                                </div>
                                <span className="text-[10px] font-medium text-gray-600">Total Time</span>
                              </div>
                              {(() => {
                                const styles = getTotalTimeStyles(record.totalTime, record.attendanceStatus, record.pinAuto)
                                return (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className={`${styles.bgColor} ${styles.textColor} px-2 py-0.5 rounded text-[10px] font-bold`}>
                                      {record.totalTime}
                                    </span>
                                    {styles.showAlert && (
                                      <span className="text-red-600 text-[9px] font-semibold">
                                        {styles.alertMessage}
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Check Mode */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-300">
                              <div className="flex items-center gap-1.5">
                                <Settings className="h-3 w-3 text-gray-500" />
                                <span className="text-[10px] font-medium text-gray-600">Check Mode</span>
                              </div>
                              <div className="text-[10px]">
                                {getMobileCombinedVerifyMode(record.checkInVerifyMode, record.checkOutVerifyMode)}
                              </div>
                            </div>

                            {/* Timing Status */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-300">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-medium text-gray-600">Timing Status</span>
                              </div>
                              <div className="text-[10px]">
                                {getMobileTimingStatusBadge(record.timingStatus)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : null}
                </div>

                {/* No Records Message */}
                {filteredRecords.length === 0 && (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <div className="text-gray-500 text-sm md:text-base">No employees found matching your search.</div>
                    ) : !isAdmin && attendanceRecords.length > 0 ? (
                      <div className="space-y-3 px-4">
                        <div className="text-amber-600 font-semibold flex items-center justify-center gap-2 text-sm md:text-base">
                          <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                          Your attendance record is not visible
                        </div>
                        <div className="text-gray-600 text-xs md:text-sm max-w-md mx-auto">
                          Your account (ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{session?.user?.emp_id}</code>) could not be matched with the biometric system.
                          <br />Please contact HR or check the browser console for details.
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm md:text-base">No attendance data available.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AttendancePageContent />
    </Suspense>
  )
}
