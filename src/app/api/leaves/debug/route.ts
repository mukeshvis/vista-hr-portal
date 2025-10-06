import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    // Get sample employee with leave policy
    const employees = await prisma.$queryRaw`
      SELECT emp_id, emp_name, leaves_policy_id
      FROM employee
      LIMIT 5
    ` as any[]

    // Get leave policies
    const policies = await prisma.$queryRaw`
      SELECT * FROM leaves_policy LIMIT 5
    ` as any[]

    // Get leaves_data
    const leavesData = await prisma.$queryRaw`
      SELECT * FROM leaves_data LIMIT 10
    ` as any[]

    return NextResponse.json({
      employees,
      policies,
      leavesData
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
