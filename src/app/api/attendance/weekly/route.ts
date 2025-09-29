import { NextRequest, NextResponse } from 'next/server'

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
  totalHours: string
}

export async function POST(request: NextRequest) {
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

    // Calculate weekly summary
    const weeklyData = calculateWeeklyData(employeeData, year, month)

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
  }
}

function calculateWeeklyData(attendanceData: any[], year: number, month: number): WeekData[] {
  const weeks: WeekData[] = []

  // Get the first day of the month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the first Monday that's either in the month or the Monday of the week containing the first day
  let currentDate = new Date(firstDay)

  // If the first day is not Monday, go to the first Monday of the month
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1)
    // If we go beyond the month while looking for Monday, go back to previous Monday
    if (currentDate.getMonth() !== month) {
      currentDate = new Date(firstDay)
      const daysFromMonday = (currentDate.getDay() + 6) % 7
      currentDate.setDate(currentDate.getDate() - daysFromMonday)
      break
    }
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

    let weeklyTotalMinutes = 0
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    // Check Monday to Friday (weekdays only)
    console.log(`Week ${weekIndex}: currentDate is ${currentDate.toDateString()} (day ${currentDate.getDay()})`)

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
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
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })

        const timeOut = sortedRecords.length > 1 ?
          new Date(lastRecord.punch_time).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }) :
          // If only one record, assume 8-hour day
          new Date(new Date(firstRecord.punch_time).getTime() + 8 * 60 * 60 * 1000)
            .toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            })

        // Calculate hours worked
        const timeInMs = new Date(firstRecord.punch_time).getTime()
        const timeOutMs = sortedRecords.length > 1 ?
          new Date(lastRecord.punch_time).getTime() :
          timeInMs + (8 * 60 * 60 * 1000) // 8 hours default

        const hoursWorked = Math.max(0, (timeOutMs - timeInMs) / (1000 * 60 * 60))
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
      }
      // If no records and not a future date, keep default absent status (already set in weekData initialization)
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