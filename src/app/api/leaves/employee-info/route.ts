import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empId = searchParams.get('empId')

    if (!empId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Get employee info with manager name
    const employeeInfo = await prisma.$queryRaw`
      SELECT
        e.emp_id,
        e.emp_name,
        e.reporting_manager,
        (SELECT emp_name FROM employee WHERE id = e.reporting_manager LIMIT 1) as manager_name
      FROM employee e
      WHERE e.emp_id = ${empId}
      LIMIT 1
    ` as any[]

    if (employeeInfo.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employeeInfo[0])
  } catch (error) {
    console.error('Error fetching employee info:', error)
    return NextResponse.json({ error: 'Failed to fetch employee info' }, { status: 500 })
  }
}
