"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  Settings
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
}

interface AttendanceLog {
  user_id: string
  state: string
  punch_time: string
  verify_mode: string
}


export default function AttendancePage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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
  const fetchAttendanceLogs = async (date: string) => {
    try {
      const formattedDate = formatDateForAPI(date)

      console.log(`Fetching attendance for date:`, date)
      console.log(`Formatted date for API:`, formattedDate)

      const requestBody = {
        start_date: formattedDate,
        end_date: formattedDate
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
        console.log(`Attendance logs response:`, result)
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

  // Calculate total time between two timestamps
  const calculateTotalTime = (timeIn: string, timeOut: string) => {
    if (timeIn === '--' || timeOut === '--') return '--'

    try {
      const inTime = new Date(`2025-01-01 ${timeIn}`)
      const outTime = new Date(`2025-01-01 ${timeOut}`)

      if (outTime < inTime) {
        // Handle next day case
        outTime.setDate(outTime.getDate() + 1)
      }

      const diffMs = outTime.getTime() - inTime.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      return `${hours}h ${minutes}m`
    } catch {
      return '--'
    }
  }

  // Get background color based on total working hours and attendance status
  const getTotalTimeStyles = (totalTime: string, attendanceStatus: string) => {
    if (totalTime === '--' || attendanceStatus === 'Absent') {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-black'
      }
    }

    // Extract hours from "8h 30m" format
    const hoursMatch = totalTime.match(/(\d+)h/)
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0

    if (hours >= 8) {
      // Full time: 8+ hours (Green - Good)
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-black'
      }
    } else if (hours >= 7) {
      // Moderate time: 7-7.9 hours (Yellow - Moderate)
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-black'
      }
    } else {
      // Less time: Under 7 hours (Red - Low)
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-black'
      }
    }
  }

  // Extract time from punch_time string
  const extractTime = (punchTime: string) => {
    if (!punchTime) return '--'
    try {
      // Format: "2025-09-25 05:11:00 PM"
      const timePart = punchTime.split(' ').slice(1).join(' ') // "05:11:00 PM"
      return timePart
    } catch {
      return '--'
    }
  }

  // Fetch employees data and attendance logs
  const fetchEmployees = async () => {
    try {
      setLoading(true)

      console.log('=== Starting attendance fetch ===')
      console.log('Current selectedDate:', selectedDate)
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
      const attendanceLogs = await fetchAttendanceLogs(selectedDate)

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
        const totalTime = calculateTotalTime(timeIn, timeOut)

        // Determine attendance status
        let status: 'Present' | 'Absent' | 'Late' | 'Unknown' = 'Absent'
        if (checkIn) {
          status = 'Present'
          // You can add late logic here based on your requirements
          // For example: if timeIn > "09:00:00 AM" then status = 'Late'
        }

        return {
          employeeName: emp.user_name,
          pinAuto: emp.pin_auto,
          userId: emp.pin_auto,
          attendanceStatus: status,
          timeIn,
          timeOut,
          totalTime
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

  // Filter attendance records based on search term
  const filteredRecords = attendanceRecords.filter(record =>
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  // Stats calculation
  const totalEmployees = attendanceRecords.length
  const presentCount = attendanceRecords.filter(r => r.attendanceStatus === 'Present').length
  const absentCount = attendanceRecords.filter(r => r.attendanceStatus === 'Absent').length
  const lateCount = attendanceRecords.filter(r => r.attendanceStatus === 'Late').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <TopNavigation session={session} />

      {/* Attendance Content */}
      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <select
                value={selectedDate.split('-')[0]}
                onChange={(e) => updateDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700"
              >
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span className="text-gray-400">-</span>
              <select
                value={selectedDate.split('-')[1]}
                onChange={(e) => updateDate(undefined, e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {new Date(2000, month - 1).toLocaleDateString('en', { month: 'short' })}
                  </option>
                ))}
              </select>
              <span className="text-gray-400">-</span>
              <select
                value={selectedDate.split('-')[2]}
                onChange={(e) => updateDate(undefined, undefined, e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700"
              >
                {Array.from({length: getDaysInMonth(parseInt(selectedDate.split('-')[0]), parseInt(selectedDate.split('-')[1]))}, (_, i) => i + 1).map(day => (
                  <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/attendance/holidays'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Holidays
            </Button>
          </div>
        </div>


        {/* Attendance Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Daily Attendance - {new Date(selectedDate).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-96"
                  />
                </div>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  onClick={fetchEmployees}
                  disabled={loading}
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
                <span className="ml-3 text-gray-600">Loading attendance data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-100 border border-purple-200 rounded-lg">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-purple-800">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          Employee Name
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Attendance Status
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-800">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          Time In
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-800">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          Time Out
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-purple-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          Total Time
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => (
                        <tr key={index} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleEmployeeClick(record.pinAuto, record.employeeName)}
                              className="font-medium text-black hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                            >
                              {record.employeeName}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {getAttendanceStatusBadge(record.attendanceStatus)}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <span className="bg-purple-100 px-2 py-1 rounded text-sm text-black">
                              {record.timeIn}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <span className="bg-orange-100 px-2 py-1 rounded text-sm text-black">
                              {record.timeOut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {(() => {
                              const styles = getTotalTimeStyles(record.totalTime, record.attendanceStatus)
                              return (
                                <span className={`${styles.bgColor} ${styles.textColor} px-2 py-1 rounded text-sm`}>
                                  {record.totalTime}
                                </span>
                              )
                            })()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm ? 'No employees found matching your search.' : 'No attendance data available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}