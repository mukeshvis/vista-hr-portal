"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopNavigation } from "@/components/top-navigation"
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  CalendarDays
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

interface DayData {
  timeIn: string
  timeOut: string
  hours: string
  status: string
}

interface WeeklyData {
  weekNumber: number
  monday: DayData
  tuesday: DayData
  wednesday: DayData
  thursday: DayData
  friday: DayData
  totalHours: string
}

export default function EmployeeAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const employeeId = params.id as string
  const employeeName = searchParams.get('name') || 'Employee'

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  // Get holidays from database
  const [holidays, setHolidays] = useState<Holiday[]>([])

  // Fetch holidays from database
  const fetchHolidays = useCallback(async () => {
    try {
      const response = await fetch(`/api/holidays?year=${selectedYear}`)

      if (response.ok) {
        const result = await response.json()
        console.log('🎉 Holidays loaded:', result)

        if (result.success && result.data) {
          const formattedHolidays = result.data.map((holiday: any) => {
            // Timezone-safe date formatting
            const holidayDate = new Date(holiday.holiday_date)
            const year = holidayDate.getFullYear()
            const month = String(holidayDate.getMonth() + 1).padStart(2, '0')
            const day = String(holidayDate.getDate()).padStart(2, '0')
            return {
              date: `${year}-${month}-${day}`,
              name: holiday.holiday_name,
              type: holiday.holiday_type
            }
          })
          setHolidays(formattedHolidays)
        }
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      // Fallback to default holidays
      setHolidays([
        { date: '2025-01-01', name: 'New Year', type: 'national' },
        { date: '2025-08-14', name: 'Independence Day', type: 'national' },
        { date: '2025-09-10', name: 'Test Holiday', type: 'national' },
        { date: '2025-12-25', name: 'Christmas', type: 'national' }
      ])
    }
  }, [selectedYear])

  // Fetch real attendance data from API
  const fetchAttendanceData = useCallback(async () => {
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
      console.log('✅ API Response received')
      console.log('📊 Total records in response:', Array.isArray(apiData) ? apiData.length : (apiData.data ? apiData.data.length : 0))

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

      // Filter data for this specific employee using pin_auto (employeeId)
      const employeeAttendance = attendanceRecords.filter((record: any) =>
        record.user_id && record.user_id.toString() === employeeId.toString()
      )

      console.log('👤 Employee attendance records:', employeeAttendance.length)

      // Check specifically for October 1st
      const oct1 = employeeAttendance.filter((r: any) => {
        if (!r.punch_time) return false
        const d = new Date(r.punch_time).toISOString().split('T')[0]
        return d === '2025-10-01'
      })
      if (oct1.length > 0) {
        console.log('🎯 Oct 1st check-ins found:', oct1)
      } else {
        console.log('❌ No Oct 1st check-ins for this employee')
      }

      // Convert API data to our format
      const processedData: AttendanceData[] = []
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // Find attendance records for this date
        const dayRecords = employeeAttendance.filter((record: any) => {
          if (!record.punch_time) return false

          // Parse the punch_time string which is in format "2025-10-01 09:01:00 AM"
          const punchTimeStr = record.punch_time
          const recordDateStr = punchTimeStr.split(' ')[0] // Get "2025-10-01"

          const match = recordDateStr === date
          if (date === '2025-10-01' && match) {
            console.log('✅ Oct 1st record MATCHED!', record)
          }
          return match
        })

        if (date === '2025-10-01') {
          console.log(`🔍 Processing Oct 1st: dayRecords.length = ${dayRecords.length}`)
        }

        // Check if this is a future date
        const dayDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time for accurate comparison

        // Also reset dayDate to midnight for fair comparison
        dayDate.setHours(0, 0, 0, 0)

        const isFutureDate = dayDate > today

        if (date === '2025-10-01') {
          console.log('📅 Date comparison:', {
            dayDate: dayDate.toISOString(),
            today: today.toISOString(),
            isFuture: dayDate > today
          })
        }

        // Check if it's weekend (Saturday = 6, Sunday = 0)
        const dayOfWeek = new Date(date).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        // Check if it's a holiday
        const isHoliday = holidays.some(holiday => holiday.date === date)
        const holidayInfo = holidays.find(holiday => holiday.date === date)

        if (date === '2025-10-01') {
          console.log(`🔍 Oct 1st conditions:`, {
            isFutureDate,
            isWeekend,
            dayOfWeek,
            isHoliday,
            dayRecordsLength: dayRecords.length
          })
        }

        // Priority check: Future > Weekend > Holiday > Present/Absent
        if (isFutureDate) {
          // Future date - don't count in any stats
          if (date === '2025-10-01') console.log('❌ Oct 1st marked as FUTURE')
          processedData.push({
            date,
            status: 'Future' as any,
            timeIn: '-',
            timeOut: '-',
            totalTime: 'Upcoming'
          })
        } else if (isWeekend) {
          // Weekend - don't count in any stats
          if (date === '2025-10-01') console.log('❌ Oct 1st marked as WEEKEND')
          processedData.push({
            date,
            status: 'Weekend' as any,
            timeIn: 'Weekend',
            timeOut: 'Weekend',
            totalTime: 'Off Day'
          })
        } else if (isHoliday) {
          if (date === '2025-10-01') console.log('❌ Oct 1st marked as HOLIDAY')
          // Holiday - NEVER count in working days, even if employee was present
          const checkIn = dayRecords.find((r: any) => r.state === 'Check In')
          const checkOut = dayRecords.find((r: any) => r.state === 'Check Out')

          processedData.push({
            date,
            status: 'Holiday' as any,
            timeIn: checkIn ? new Date(checkIn.punch_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'Holiday',
            timeOut: checkOut ? new Date(checkOut.punch_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'Holiday',
            totalTime: holidayInfo?.name || 'Holiday'
          })
        } else if (dayRecords.length > 0) {
          // Employee was present on a working day - find check in and check out times
          if (date === '2025-10-01') console.log('✅ Oct 1st going to PRESENT logic')
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
          // Employee was absent on weekday
          if (date === '2025-10-01') console.log('❌ Oct 1st marked as ABSENT')
          processedData.push({
            date,
            status: 'Absent'
          })
        }
      }

      console.log('✅ Processed attendance data:', processedData.length, 'days')

      // Check Oct 1st specifically
      const oct1Data = processedData.find(d => d.date === '2025-10-01')
      if (oct1Data) {
        console.log('🎯 Oct 1st in calendar:', oct1Data)
      } else {
        console.log('❌ Oct 1st NOT in processed data!')
      }

      setAttendanceData(processedData)
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      // Fallback to empty data or show error message
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, employeeId, holidays])

  // Fetch weekly attendance data from API
  const fetchWeeklyData = useCallback(async () => {
    try {
      setWeeklyLoading(true)

      console.log('🔍 Fetching weekly data for:', { employeeId, year: selectedYear, month: selectedMonth })

      const response = await fetch('/api/attendance/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          year: selectedYear,
          month: selectedMonth
        })
      })

      console.log('📡 Weekly API Response Status:', response.status)

      if (!response.ok) {
        console.error('❌ Weekly API failed with status:', response.status)
        throw new Error('Failed to fetch weekly attendance data')
      }

      const result = await response.json()
      console.log('✅ Weekly API Response:', result)

      if (result.success && result.data) {
        setWeeklyData(result.data)
      } else {
        console.error('Failed to fetch weekly data:', result.error)
        setWeeklyData([])
      }

    } catch (error) {
      console.error('Error fetching weekly data:', error)
      setWeeklyData([])
    } finally {
      setWeeklyLoading(false)
    }
  }, [employeeId, selectedYear, selectedMonth])

  // Helper function to check if a date is a holiday
  const isHolidayDate = (dateStr: string) => {
    return holidays.some(holiday => holiday.date === dateStr)
  }

  // Helper function to get holiday name for a date
  const getHolidayName = (dateStr: string) => {
    const holiday = holidays.find(holiday => holiday.date === dateStr)
    return holiday ? holiday.name : 'Holiday'
  }

  // Helper function to calculate the date for a specific day in a week
  const calculateWeekDate = useCallback((weekNumber: number, dayOffset: number) => {
    const firstDay = new Date(selectedYear, selectedMonth, 1)
    const firstMonday = new Date(firstDay)
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1)
      if (firstMonday.getMonth() !== selectedMonth) {
        firstMonday.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7))
        break
      }
    }
    const targetDate = new Date(firstMonday)
    targetDate.setDate(targetDate.getDate() + ((weekNumber - 1) * 7) + dayOffset)
    return targetDate
  }, [selectedYear, selectedMonth])

  // Helper function to get day status and display info
  const getDayInfo = useCallback((dayData: DayData, weekNumber: number, dayOffset: number) => {
    const dayDate = calculateWeekDate(weekNumber, dayOffset)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isPast = dayDate < today
    const isFuture = dayDate > today
    const dateStr = dayDate.toISOString().split('T')[0]
    const isHoliday = isHolidayDate(dateStr)

    // Determine status
    let hourColor = 'text-green-800'
    let timeColor = 'text-green-600'
    let displayText = dayData.hours

    if (dayData.timeIn === 'Holiday' && dayData.timeOut === 'Holiday') {
      hourColor = 'text-blue-800'
      timeColor = 'text-blue-600'
      displayText = dayData.hours // Holiday name
    } else if (dayData.hours === '0h' && isPast && isHoliday) {
      hourColor = 'text-blue-800'
      timeColor = 'text-blue-600'
      displayText = getHolidayName(dateStr)
    } else if (dayData.hours === '0h' && isPast) {
      hourColor = 'text-red-800'
      timeColor = 'text-red-600'
      displayText = 'Absent'
    } else if (dayData.hours === '0h' && isFuture) {
      hourColor = 'text-orange-800'
      timeColor = 'text-orange-600'
    }

    return { hourColor, timeColor, displayText, timeIn: dayData.timeIn, timeOut: dayData.timeOut }
  }, [calculateWeekDate, isHolidayDate, getHolidayName])

  // Load holidays and attendance data together
  useEffect(() => {
    const loadData = async () => {
      await fetchHolidays()
      // Always fetch attendance, don't wait for holidays to have data
      fetchAttendanceData()
      fetchWeeklyData()
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  console.log('📊 Attendance Stats:', {
    totalRecords: attendanceData.length,
    absent: absentDays,
    present: presentDays,
    late: lateDays,
    holidaysCount: attendanceData.filter(d => d.status === 'Holiday').length,
    weekends: attendanceData.filter(d => d.status === 'Weekend').length,
    loading: loading
  })

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

  // Keep all days showing actual hours (including 0h) - no "Absent" text

  const getDateStyle = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-200 text-green-800 border border-green-300'
      case 'Late':
        return 'bg-green-100 text-green-700 border border-green-300'
      case 'Absent':
        return 'bg-red-200 text-red-800 border border-red-300'
      case 'Weekend':
        return 'bg-slate-200 text-slate-800 border border-slate-300'
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
      {/* Top Navigation */}
      <TopNavigation session={session} />

      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-200 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.close()}
                className="flex items-center gap-1 bg-black hover:bg-gray-700 text-white border border-black rounded-md text-xs px-3 h-7 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center shadow-sm">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-gray-800">
                  <h1 className="text-xl font-bold">{employeeName}</h1>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <span>ID: {employeeId}</span>
                    <span>•</span>
                    <span>{monthNames[selectedMonth]} {selectedYear}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="hidden md:flex items-center gap-3 text-gray-700">
              <div className="text-center bg-white/50 px-2 py-1 rounded backdrop-blur-sm">
                <div className="text-lg font-bold text-gray-800">{presentPercentage}%</div>
                <div className="text-gray-600 text-xs">Attendance</div>
              </div>
              <div className="text-center bg-white/50 px-2 py-1 rounded backdrop-blur-sm">
                <div className="text-lg font-bold text-gray-800">{workedDays}</div>
                <div className="text-gray-600 text-xs">Days</div>
              </div>
              <div className="text-center bg-white/50 px-2 py-1 rounded backdrop-blur-sm">
                <div className="text-lg font-bold text-gray-800">{totalHoursWorked.toFixed(0)}h</div>
                <div className="text-gray-600 text-xs">Hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-3 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm">Total Days</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{totalDays}</p>
                  <p className="text-blue-500 text-sm mt-1">Working Days</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium text-sm">Present</p>
                  <p className="text-3xl font-bold text-green-800 mt-2">{presentDays + lateDays}</p>
                  <p className="text-green-500 text-sm mt-1">{presentPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium text-sm">Total Hours</p>
                  <p className="text-3xl font-bold text-purple-800 mt-2">{totalHoursWorked.toFixed(0)}h</p>
                  <p className="text-purple-500 text-sm mt-1">{hoursStatus}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium text-sm">Absent</p>
                  <p className="text-3xl font-bold text-red-800 mt-2">{absentDays}</p>
                  <p className="text-red-500 text-sm mt-1">Missing Days</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex flex-wrap items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="year" className="text-sm font-medium text-gray-700">
                Year:
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border-0 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="month" className="text-sm font-medium text-gray-700">
                Month:
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border-0 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                const currentDate = new Date()
                setSelectedYear(currentDate.getFullYear())
                setSelectedMonth(currentDate.getMonth())
              }}
              variant="outline"
              size="sm"
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Current Month
            </Button>
          </div>
        </div>

        {/* Weekly Hours Summary */}
        <Card className="border-2 border-gray-300 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Weekly Hours Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-3 font-medium text-gray-800 bg-gray-50 text-sm">Employee</th>
                    <th className="text-center py-2 px-3 font-medium text-blue-800 bg-blue-50 text-sm">Monday</th>
                    <th className="text-center py-2 px-3 font-medium text-green-800 bg-green-50 text-sm">Tuesday</th>
                    <th className="text-center py-2 px-3 font-medium text-orange-800 bg-orange-50 text-sm">Wednesday</th>
                    <th className="text-center py-2 px-3 font-medium text-purple-800 bg-purple-50 text-sm">Thursday</th>
                    <th className="text-center py-2 px-3 font-medium text-indigo-800 bg-indigo-50 text-sm">Friday</th>
                    <th className="text-center py-2 px-3 font-medium text-rose-800 bg-rose-50 text-sm">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Loading weekly data...
                      </td>
                    </tr>
                  ) : weeklyData.length > 0 ? (
                    weeklyData.slice().reverse().map((week, weekIndex) => (
                      <tr key={weekIndex} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {employeeName}
                            <div className="text-xs text-gray-500">Week {week.weekNumber}</div>
                          </div>
                        </td>

                        {/* Monday */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const info = getDayInfo(week.monday, week.weekNumber, 0)
                            return (
                              <div className="text-xs">
                                <div className={`font-medium ${info.hourColor}`}>{info.displayText}</div>
                                <div className={info.timeColor}>{info.timeIn} - {info.timeOut}</div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Tuesday */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const info = getDayInfo(week.tuesday, week.weekNumber, 1)
                            return (
                              <div className="text-xs">
                                <div className={`font-medium ${info.hourColor}`}>{info.displayText}</div>
                                <div className={info.timeColor}>{info.timeIn} - {info.timeOut}</div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Wednesday */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const info = getDayInfo(week.wednesday, week.weekNumber, 2)
                            return (
                              <div className="text-xs">
                                <div className={`font-medium ${info.hourColor}`}>{info.displayText}</div>
                                <div className={info.timeColor}>{info.timeIn} - {info.timeOut}</div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Thursday */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const info = getDayInfo(week.thursday, week.weekNumber, 3)
                            return (
                              <div className="text-xs">
                                <div className={`font-medium ${info.hourColor}`}>{info.displayText}</div>
                                <div className={info.timeColor}>{info.timeIn} - {info.timeOut}</div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Friday */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            const info = getDayInfo(week.friday, week.weekNumber, 4)
                            return (
                              <div className="text-xs">
                                <div className={`font-medium ${info.hourColor}`}>{info.displayText}</div>
                                <div className={info.timeColor}>{info.timeIn} - {info.timeOut}</div>
                              </div>
                            )
                          })()}
                        </td>

                        {/* Total Hours */}
                        <td className="py-2 px-3 text-center">
                          {(() => {
                            // Parse total hours to determine color
                            const totalHoursText = week.totalHours || '0h'
                            const hoursMatch = totalHoursText.match(/(\d+)h\s*(\d+)?m?/)
                            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
                            const minutes = hoursMatch && hoursMatch[2] ? parseInt(hoursMatch[2]) : 0
                            const totalHoursDecimal = hours + (minutes / 60)

                            // Remove the absent logic - just show the hours

                            const isLowHours = totalHoursDecimal < 40

                            return (
                              <div className={`font-bold text-sm px-2 py-1 rounded ${
                                isLowHours
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-green-600 bg-green-50'
                              }`}>
                                {week.totalHours}
                              </div>
                            )
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No weekly data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">Holiday</span>
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