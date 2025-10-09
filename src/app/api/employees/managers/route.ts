import { NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

interface ManagerResult {
  id: number
  name: string
  designation: string
}

export async function GET() {
  try {
    // Fetch all employees who can be managers with auto-retry
    const employees = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT
          e.id,
          e.emp_name as name,
          COALESCE(d.designation_name, 'Unknown') as designation
        FROM employee e
        LEFT JOIN designation d ON e.designation_id = d.id
        WHERE e.status = 1
        ORDER BY e.emp_name ASC
      ` as ManagerResult[]
    })

    // Transform the data to match the expected format for dropdown
    const formattedManagers = employees.map(emp => ({
      value: emp.id.toString(),
      label: emp.name
    }))

    return NextResponse.json(formattedManagers)
  } catch (error) {
    console.error('Error fetching managers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch managers' },
      { status: 500 }
    )
  }
}