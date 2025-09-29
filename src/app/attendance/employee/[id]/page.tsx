"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  CalendarDays,
  Settings,
  Plus
} from "lucide-react"

interface AttendanceData {
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Weekend' | 'Holiday' | 'Future'
  timeIn?: string
  timeOut?: string
  totalTime?: string
}

interface Holiday {
  date: string
  name: string
  type: 'national' | 'company'
}

export default function EmployeeAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const employeeId = params.id as string
  const employeeName = searchParams.get('name') || 'Employee'

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  // Get holidays from localStorage or use defaults
  const [holidays] = useState<Holiday[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hrPortalHolidays')
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return [
      { date: '2025-01-01', name: 'New Year', type: 'national' },
      { date: '2025-08-14', name: 'Independence Day', type: 'national' },
      { date: '2025-12-25', name: 'Christmas', type: 'national' }
    ]
  })

  // Fetch real attendance data from API
  const fetchAttendanceData = async () => {
    try {
      setLoading(true)

      // Calculate start and end dates for the selected month
      const startDate = new Date(selectedYear, selectedMonth, 1)
      const endDate = new Date(selectedYear, selectedMonth + 1, 0)

      // Format dates for API (DD/MM/YYYY)
      const formatDateForAPI = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }

      const start_date = formatDateForAPI(startDate)
      const end_date = formatDateForAPI(endDate)

      console.log('Fetching attendance for employee:', employeeId, 'from', start_date, 'to', end_date)

      // Fetch attendance logs from API
      const response = await fetch('/api/attendance/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date,
          end_date
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data')
      }

      const apiData = await response.json()
      console.log('API Response:', apiData)
      console.log('API Data type:', typeof apiData, 'Is array:', Array.isArray(apiData))

      // Handle different API response structures
      let attendanceRecords = []
      if (Array.isArray(apiData)) {
        attendanceRecords = apiData
      } else if (apiData && apiData.data && Array.isArray(apiData.data)) {
        attendanceRecords = apiData.data
      } else if (apiData && typeof apiData === 'object') {
        // If API returns object, convert to array or handle accordingly
        attendanceRecords = Object.values(apiData).filter(item =>
          item && typeof item === 'object' && 'user_id' in item
        )
      }

      console.log('Attendance records:', attendanceRecords)

      // Filter data for this specific employee using pin_auto (employeeId)
      const employeeAttendance = attendanceRecords.filter((record: any) =>
        record.user_id && record.user_id.toString() === employeeId.toString()
      )

      console.log('Filtered employee attendance:', employeeAttendance)

      // Convert API data to our format
      const processedData: AttendanceData[] = []
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // Find attendance records for this date
        const dayRecords = employeeAttendance.filter((record: any) => {
          if (!record.punch_time) return false
          const recordDate = new Date(record.punch_time)
          const targetDate = new Date(date)
          return recordDate.toDateString() === targetDate.toDateString()
        })

        if (dayRecords.length > 0) {
          // Employee was present - find check in and check out times
          const checkIn = dayRecords.find((r: any) => r.state === 'Check In')
          const checkOut = dayRecords.find((r: any) => r.state === 'Check Out')

          // Determine if late (assuming 9:00 AM is standard time)
          let status: 'Present' | 'Late' = 'Present'
          if (checkIn) {
            const punchTime = new Date(checkIn.punch_time)
            const standardTime = new Date(punchTime)
            standardTime.setHours(9, 0, 0, 0) // 9:00 AM
            if (punchTime > standardTime) {
              status = 'Late'
            }
          }

          processedData.push({
            date,
            status,
            timeIn: checkIn ? new Date(checkIn.punch_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : undefined,
            timeOut: checkOut ? new Date(checkOut.punch_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : undefined,
            totalTime: (checkIn && checkOut) ? (() => {
              const inTime = new Date(checkIn.punch_time)
              const outTime = new Date(checkOut.punch_time)
              const diff = outTime.getTime() - inTime.getTime()
              const hours = Math.floor(diff / (1000 * 60 * 60))
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
              return `${hours}h ${minutes}m`
            })() : undefined
          })
        } else {
          // Check if this is a future date
          const dayDate = new Date(date)
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Reset time for accurate comparison
          const isFutureDate = dayDate > today

          // Check if it's weekend (Saturday = 6, Sunday = 0)
          const dayOfWeek = new Date(date).getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

          // Check if it's a holiday
          const isHoliday = holidays.some(holiday => holiday.date === date)
          const holidayInfo = holidays.find(holiday => holiday.date === date)

          if (isFutureDate) {
            // Future date - don't count in any stats
            processedData.push({
              date,
              status: 'Future' as any,
              timeIn: '-',
              timeOut: '-',
              totalTime: 'Upcoming'
            })
          } else if (isWeekend) {
            // Weekend - don't count in any stats
            processedData.push({
              date,
              status: 'Weekend' as any,
              timeIn: 'Weekend',
              timeOut: 'Weekend',
              totalTime: 'Off Day'
            })
          } else if (isHoliday) {
            // Holiday - don't count as absent
            processedData.push({
              date,
              status: 'Holiday' as any,
              timeIn: 'Holiday',
              timeOut: 'Holiday',
              totalTime: holidayInfo?.name || 'Holiday'
            })
          } else {
            // Employee was absent on weekday
            processedData.push({
              date,
              status: 'Absent'
            })
          }
        }
      }

      setAttendanceData(processedData)
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      // Fallback to empty data or show error message
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [selectedYear, selectedMonth, employeeId])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  // Calculate statistics (exclude weekends, holidays, and future dates)
  const workingDays = attendanceData.filter(d =>
    d.status !== 'Weekend' && d.status !== 'Holiday' && d.status !== 'Future'
  )
  const totalDays = workingDays.length
  const presentDays = workingDays.filter(d => d.status === 'Present').length
  const lateDays = workingDays.filter(d => d.status === 'Late').length
  const absentDays = workingDays.filter(d => d.status === 'Absent').length
  const workedDays = presentDays + lateDays
  const presentPercentage = totalDays > 0 ? (workedDays / totalDays * 100).toFixed(1) : '0'

  // Calculate total hours worked
  const totalHoursWorked = workingDays.reduce((total, day) => {
    if (day.status === 'Present' || day.status === 'Late') {
      if (day.totalTime) {
        // Extract hours from "8h 30m" format
        const timeMatch = day.totalTime.match(/(\d+)h\s*(\d+)?m?/)
        if (timeMatch) {
          const hours = parseInt(timeMatch[1] || '0')
          const minutes = parseInt(timeMatch[2] || '0')
          return total + hours + (minutes / 60)
        }
      }
      // If no totalTime, assume 8 hours
      return total + 8
    }
    return total
  }, 0)

  const expectedHours = workedDays * 8
  const hoursStatus = totalHoursWorked >= expectedHours ? 'Excellent' : totalHoursWorked >= expectedHours * 0.9 ? 'Good' : 'Below Expected'

  // Get calendar layout
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const calendarDays = []

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const attendanceRecord = attendanceData.find(d => d.date === dateStr)
    calendarDays.push({
      day,
      date: dateStr,
      attendance: attendanceRecord || { date: dateStr, status: 'Absent' as const }
    })
  }

  const getDateStyle = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-200 text-green-800 border border-green-300'
      case 'Late':
        return 'bg-yellow-200 text-yellow-800 border border-yellow-300'
      case 'Absent':
        return 'bg-red-200 text-red-800 border border-red-300'
      case 'Weekend':
        return 'bg-blue-200 text-blue-800 border border-blue-300'
      case 'Holiday':
        return 'bg-orange-200 text-orange-800 border border-orange-300'
      case 'Future':
        return 'bg-gray-200 text-gray-600 border border-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-200 shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="secondary"
                onClick={() => window.close()}
                className="flex items-center gap-2 bg-white/70 hover:bg-white/90 text-gray-700 border-gray-200 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Attendance
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center shadow-sm">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-gray-800">
                  <h1 className="text-4xl font-bold mb-1">{employeeName}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      ID: {employeeId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {monthNames[selectedMonth]} {selectedYear}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="hidden md:flex items-center gap-6 text-gray-700">
              <div className="text-center bg-white/50 px-4 py-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-gray-800">{presentPercentage}%</div>
                <div className="text-gray-600 text-sm">Attendance</div>
              </div>
              <div className="text-center bg-white/50 px-4 py-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-gray-800">{workedDays}</div>
                <div className="text-gray-600 text-sm">Days Worked</div>
              </div>
              <div className="text-center bg-white/50 px-4 py-3 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-gray-800">{totalHoursWorked.toFixed(0)}h</div>
                <div className="text-gray-600 text-sm">Total Hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-6 space-y-8">
        {/* Enhanced Date Filter */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50 min-h-[120px] ">
          <CardContent className="px-8 py-8 flex items-center justify-center">
            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-2xl font-semibold text-gray-900">Date Filter</span>
                  <p className="text-base text-gray-500 mt-1">Select month and year to view attendance</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 text-start pl-1">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border-2 border-gray-200 rounded-lg px-4 py-2 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all w-[150px]"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col  gap-1">
                  <label className="text-sm font-semibold text-gray-700 text-start pl-1">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="border-2 border-gray-200 rounded-lg px-4 py-2 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all w-[180px]"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 transform hover:scale-105 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium mb-1">Total Days</p>
                  <p className="text-4xl font-bold mb-2 text-blue-800">{totalDays}</p>
                  <div className="flex items-center gap-1 text-blue-500 text-sm">
                    <CalendarDays className="h-3 w-3" />
                    Working Days
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 transform hover:scale-105 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium mb-1">Present</p>
                  <p className="text-4xl font-bold mb-2 text-green-800">{presentDays + lateDays}</p>
                  <div className="flex items-center gap-2 text-green-500 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {presentPercentage}% Attendance
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 transform hover:scale-105 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium mb-1">Total Hours</p>
                  <p className="text-4xl font-bold mb-2 text-purple-800">{totalHoursWorked.toFixed(0)}h</p>
                  <div className="flex items-center gap-1 text-purple-500 text-sm">
                    <Clock className="h-3 w-3" />
                    {hoursStatus}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 transform hover:scale-105 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium mb-1">Absent</p>
                  <p className="text-4xl font-bold mb-2 text-red-800">{absentDays}</p>
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <XCircle className="h-3 w-3" />
                    Missing Days
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card className="border-2 border-gray-300 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              {monthNames[selectedMonth]} {selectedYear} - Attendance Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-gray-600">Loading attendance data...</span>
              </div>
            ) : (
              <div className="max-w-md mx-auto border-2 border-blue-200 rounded-lg bg-gradient-to-b from-blue-50 to-white">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2 bg-blue-100 p-3 pt-2 rounded-t-lg">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-blue-800 w-8 h-6 flex items-center justify-center text-xs">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 bg-white p-3 pt-0 rounded-b-lg">
                  {calendarDays.map((dayData, index) => (
                    <div key={index} className="w-8 h-8 flex items-center justify-center">
                      {dayData ? (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-110 ${getDateStyle(dayData.attendance.status)}`}
                          title={`${dayData.day} - ${dayData.attendance.status}${dayData.attendance.timeIn ? ` (${dayData.attendance.timeIn} - ${dayData.attendance.timeOut})` : ''}`}
                        >
                          {dayData.day}
                        </div>
                      ) : (
                        <div className="w-6 h-6"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">Absent</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}