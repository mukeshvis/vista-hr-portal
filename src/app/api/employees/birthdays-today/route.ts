import { NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

export async function GET() {
  try {
    // Get current date (day and month only)
    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth() + 1 // JavaScript months are 0-indexed

    console.log('🎂 Checking birthdays for:', { day: todayDay, month: todayMonth })

    // Fetch all employees whose birthday is today (matching day and month only, ignore year)
    const employeesWithBirthdaysToday = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT
          e.emp_id,
          e.emp_name as name,
          e.emp_date_of_birth as dateOfBirth,
          DAY(e.emp_date_of_birth) as birthDay,
          MONTH(e.emp_date_of_birth) as birthMonth
        FROM employee e
        WHERE e.emp_date_of_birth IS NOT NULL
          AND e.status = 1
          AND DAY(e.emp_date_of_birth) = ${todayDay}
          AND MONTH(e.emp_date_of_birth) = ${todayMonth}
        ORDER BY e.emp_name ASC
      ` as any[]
    })

    console.log('🎂 Found birthdays:', employeesWithBirthdaysToday.length, 'employees')

    // Convert BigInt to regular numbers for JSON serialization
    const serializedEmployees = employeesWithBirthdaysToday.map(emp => ({
      emp_id: emp.emp_id,
      name: emp.name,
      dateOfBirth: emp.dateOfBirth instanceof Date
        ? emp.dateOfBirth.toISOString().split('T')[0]
        : emp.dateOfBirth,
      birthDay: Number(emp.birthDay),
      birthMonth: Number(emp.birthMonth)
    }))

    return NextResponse.json({
      success: true,
      count: employeesWithBirthdaysToday.length,
      employees: serializedEmployees
    })

  } catch (error) {
    console.error('❌ Error fetching birthday employees:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch birthday employees',
        count: 0,
        employees: []
      },
      { status: 500 }
    )
  }
}
