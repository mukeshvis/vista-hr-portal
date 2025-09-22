import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

interface ReportingManagerResult {
  id: number
  name: string
}

export async function GET() {
  try {
    // Fetch all employees for reporting manager dropdown
    const employees = await prisma.$queryRaw`
      SELECT
        e.id,
        e.emp_name as name
      FROM employee e
      WHERE e.status = 1
      ORDER BY e.emp_name ASC
    ` as ReportingManagerResult[]

    // Transform the data to match the expected format for SearchableSelect
    const formattedEmployees = employees.map(emp => ({
      value: emp.id.toString(),
      label: emp.name
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('Error fetching employees for reporting manager:', error)

    // Return empty array if database query fails
    return NextResponse.json([])
  }
}