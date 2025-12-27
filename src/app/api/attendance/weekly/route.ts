import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DayData {
  timeIn: string
  timeOut: string
  hours: string
  status: string
}

interface WeekData {
  weekNumber: number
  monday: DayData
  tuesday: DayData
  wednesday: DayData
  thursday: DayData
  friday: DayData
  saturday?: DayData  // Optional for weekend workers
  sunday?: DayData    // Optional for weekend workers
  totalHours: string
}

// Specific employees with 10-hour requirement (8 AM to 6 PM)
const TEN_HOUR_EMPLOYEES = ['13', '14', '45', '1691479623873', '1691479623595']

// Specific employees with 9-hour requirement that work weekends (9 AM to 6 PM)
const NINE_HOUR_EMPLOYEES = ['16', '3819']

// Get office window based on employee type
function getOfficeWindow(employeeId: string) {
  const requires10Hours = TEN_HOUR_EMPLOYEES.includes(employeeId)
  const requires9Hours = NINE_HOUR_EMPLOYEES.includes(employeeId)

  if (requires10Hours) {
    // 10-hour employees: 8:00 AM to 6:00 PM
    return { startHour: 8, startMinute: 0, endHour: 18, endMinute: 0 }
  } else if (requires9Hours) {
    // 9-hour employees: 9:00 AM to 6:00 PM
    return { startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 }
  } else {
    // Regular 8-hour employees: 9:00 AM to 5:30 PM
    return { startHour: 9, startMinute: 0, endHour: 17, endMinute: 30 }
  }
}

// Calculate hours worked within office window
function calculateOfficeHours(checkInTime: Date, checkOutTime: Date, employeeId: string): number {
  const window = getOfficeWindow(employeeId)

  // Create office start and end times for the same day as check-in
  const officeStart = new Date(checkInTime)
  officeStart.setHours(window.startHour, window.startMinute, 0, 0)

  const officeEnd = new Date(checkInTime)
  officeEnd.setHours(window.endHour, window.endMinute, 0, 0)

  // Cap check-in time to office start (if came early, count from office start)
  const effectiveStart = checkInTime < officeStart ? officeStart : checkInTime

  // Cap check-out time to office end (if left late, count until office end)
  const effectiveEnd = checkOutTime > officeEnd ? officeEnd : checkOutTime

  // If employee came after office end or left before office start, no valid hours
  if (effectiveStart >= officeEnd || effectiveEnd <= officeStart) {
    return 0
  }

  // Calculate hours worked within window
  const hoursWorked = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60)
  return Math.max(0, hoursWorked)
}

export async function POST(request: NextRequest) {
  let prismaConnected = false
  try {
    const { employeeId, year, month } = await request.json()

    console.log('Fetching weekly attendance for employee:', employeeId, 'year:', year, 'month:', month)

    // Calculate date range for the month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    // Format dates for external API (DD/MM/YYYY)
    const formatDateForAPI = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    const start_date = formatDateForAPI(startDate)
    const end_date = formatDateForAPI(endDate)

    // Use the existing working attendance logs API internally
    // Get the correct port from the request URL if running in development
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

    console.log('Making internal API call to:', `${baseUrl}/api/attendance/logs`)

    const response = await fetch(`${baseUrl}/api/attendance/logs`, {
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
      throw new Error('Failed to fetch from internal attendance logs API')
    }

    const apiData = await response.json()

    // Check if apiData has a 'data' property, otherwise use it directly
    const dataArray = Array.isArray(apiData) ? apiData : (apiData.data || [])

    console.log('API data structure:', { isArray: Array.isArray(apiData), hasData: !!apiData.data, length: dataArray.length })

    if (!Array.isArray(dataArray)) {
      console.error('Data is not an array after processing:', typeof dataArray, dataArray)
      throw new Error('Invalid data format received from attendance logs API')
    }

    // Filter data for the specific employee
    const employeeData = dataArray.filter((record: any) =>
      record.user_id === employeeId || record.user_id === parseInt(employeeId)
    )

    // Calculate weekly summary (this will use Prisma)
    prismaConnected = true
    const weeklyData = await calculateWeeklyData(employeeData, year, month, employeeId)

    return NextResponse.json({
      success: true,
      data: weeklyData
    })

  } catch (error) {
    console.error('Error in weekly attendance API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly attendance data' },
      { status: 500 }
    )
  } finally {
    if (prismaConnected) {
      await prisma.$disconnect()
    }
  }
}

async function calculateWeeklyData(attendanceData: any[], year: number, month: number, employeeId: string): Promise<WeekData[]> {
  // Check if this employee works weekends
  const worksWeekends = NINE_HOUR_EMPLOYEES.includes(employeeId)
  // Fetch holidays for the year
  const holidays = await prisma.holidays.findMany({
    where: {
      status: 1,
      holiday_date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31)
      }
    }
  })

  // Helper function to check if a date is a holiday (timezone-safe)
  const isHolidayDate = (dateStr: string) => {
    console.log(`🔍 Checking if ${dateStr} is a holiday`)
    const isHol = holidays.some(holiday => {
      const holidayDate = new Date(holiday.holiday_date)
      const year = holidayDate.getFullYear()
      const month = String(holidayDate.getMonth() + 1).padStart(2, '0')
      const day = String(holidayDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      console.log(`📅 Comparing ${dateStr} with holiday ${formattedDate} (${holiday.holiday_name})`)
      return formattedDate === dateStr
    })
    console.log(`✅ ${dateStr} is holiday: ${isHol}`)
    return isHol
  }

  // Helper function to get holiday name (timezone-safe)
  const getHolidayName = (dateStr: string) => {
    console.log(`🎯 Getting holiday name for ${dateStr}`)
    const holiday = holidays.find(holiday => {
      const holidayDate = new Date(holiday.holiday_date)
      const year = holidayDate.getFullYear()
      const month = String(holidayDate.getMonth() + 1).padStart(2, '0')
      const day = String(holidayDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      return formattedDate === dateStr
    })
    const name = holiday ? holiday.holiday_name : 'Holiday'
    console.log(`🏷️ Holiday name for ${dateStr}: ${name}`)
    return name
  }
  const weeks: WeekData[] = []

  // Get the first day of the month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday of the week that contains the first day of the month
  // This ensures we capture partial weeks at the start of the month
  let currentDate = new Date(firstDay)
  const firstDayOfWeek = currentDate.getDay()

  // If first day is not Monday (1), go back to the Monday of that week
  if (firstDayOfWeek !== 1) {
    const daysToGoBack = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Sunday = 0, so go back 6 days
    currentDate.setDate(currentDate.getDate() - daysToGoBack)
  }

  console.log(`Month ${month + 1}/${year}: First day is ${firstDay.toDateString()}, starting from Monday: ${currentDate.toDateString()}`)

  // Generate weeks that include any part of the selected month
  let weekIndex = 1
  while (currentDate <= lastDay) {
    const weekData: WeekData = {
      weekNumber: weekIndex,
      monday: { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' },
      tuesday: { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' },
      wednesday: { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' },
      thursday: { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' },
      friday: { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' },
      totalHours: '0h'
    }

    // Add Saturday and Sunday if employee works weekends
    if (worksWeekends) {
      weekData.saturday = { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' }
      weekData.sunday = { timeIn: '--', timeOut: '--', hours: '0h', status: 'Absent' }
    }

    let weeklyTotalMinutes = 0
    const weekdays = worksWeekends
      ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    // Check Monday to Friday (and weekend if applicable)
    console.log(`Week ${weekIndex}: currentDate is ${currentDate.toDateString()} (day ${currentDate.getDay()})`)

    const daysToCheck = worksWeekends ? 7 : 5
    for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + dayOffset)

      // Use local date string instead of ISO to avoid timezone issues
      const year = dayDate.getFullYear()
      const month = String(dayDate.getMonth() + 1).padStart(2, '0')
      const day = String(dayDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const dayName = weekdays[dayOffset] as keyof WeekData

      console.log(`Processing ${dayName} ${dateStr} for week ${weekIndex} (currentDate: ${currentDate.toDateString()}, offset: ${dayOffset})`)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time for accurate comparison

      // Check if this date is in the future
      const isFutureDate = dayDate > today

      // Find attendance records for this date
      const dayRecords = attendanceData.filter((record: any) => {
        if (!record.punch_time) return false
        try {
          const recordDate = new Date(record.punch_time).toISOString().split('T')[0]
          return recordDate === dateStr
        } catch {
          console.error('Error parsing punch_time:', record.punch_time)
          return false
        }
      })

      // If it's a future date, mark as absent regardless of records
      if (isFutureDate) {
        const dayName = weekdays[dayOffset] as keyof WeekData
        if (dayName in weekData && typeof weekData[dayName] === 'object' && dayName !== 'weekNumber' && dayName !== 'totalHours') {
          (weekData[dayName] as DayData).timeIn = '--';
          (weekData[dayName] as DayData).timeOut = '--';
          (weekData[dayName] as DayData).hours = '0h';
          (weekData[dayName] as DayData).status = 'Absent';
        }
      } else if (dayRecords.length > 0) {
        // Sort records by time to get first check-in and last check-out
        const sortedRecords = dayRecords.sort((a: any, b: any) =>
          new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
        )

        const firstRecord = sortedRecords[0]
        const lastRecord = sortedRecords[sortedRecords.length - 1]

        const timeIn = new Date(firstRecord.punch_time).toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit'
        })

        let timeOut = '--'
        let hoursWorked = 0

        if (sortedRecords.length > 1) {
          // Has check-out record
          timeOut = new Date(lastRecord.punch_time).toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
          })
          // Calculate hours within office window (not actual hours)
          const checkInTime = new Date(firstRecord.punch_time)
          const checkOutTime = new Date(lastRecord.punch_time)
          hoursWorked = calculateOfficeHours(checkInTime, checkOutTime, employeeId)
        } else {
          // Only check-in, no check-out - mark as incomplete
          timeOut = 'N/A'
          hoursWorked = 0
        }

        const hours = Math.floor(hoursWorked)
        const minutes = Math.round((hoursWorked - hours) * 60)

        const dayName = weekdays[dayOffset] as keyof WeekData
        if (dayName in weekData && typeof weekData[dayName] === 'object' && dayName !== 'weekNumber' && dayName !== 'totalHours') {
          (weekData[dayName] as DayData).timeIn = timeIn;
          (weekData[dayName] as DayData).timeOut = timeOut;
          (weekData[dayName] as DayData).hours = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
          (weekData[dayName] as DayData).status = 'Present';
        }

        weeklyTotalMinutes += Math.round(hoursWorked * 60)
      } else {
        // No attendance records for this day - check if it's a holiday
        console.log(`🗓️ Processing ${weekdays[dayOffset]} ${dateStr} - No attendance records`)
        if (isHolidayDate(dateStr)) {
          // It's a holiday
          console.log(`🎉 ${dateStr} is a holiday - setting holiday data`)
          const dayName = weekdays[dayOffset] as keyof WeekData
          if (dayName in weekData && typeof weekData[dayName] === 'object' && dayName !== 'weekNumber' && dayName !== 'totalHours') {
            (weekData[dayName] as DayData).timeIn = 'Holiday';
            (weekData[dayName] as DayData).timeOut = 'Holiday';
            (weekData[dayName] as DayData).hours = getHolidayName(dateStr);
            (weekData[dayName] as DayData).status = 'Holiday';
          }
        } else {
          console.log(`❌ ${dateStr} is NOT a holiday - keeping as absent`)
        }
        // If no records and not a future date and not a holiday, keep default absent status (already set in weekData initialization)
      }
    }

    // Convert total minutes to hours
    const totalHours = Math.floor(weeklyTotalMinutes / 60)
    const remainingMinutes = weeklyTotalMinutes % 60
    weekData.totalHours = remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`

    weeks.push(weekData)

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7)
    weekIndex++

    // Stop if the current Monday is more than a week beyond the last day of the month
    // This ensures we capture weeks that start in the previous month but contain days from target month
    const nextWeekEnd = new Date(currentDate)
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)
    if (currentDate > lastDay && nextWeekEnd.getMonth() !== month) break
  }

  return weeks
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}