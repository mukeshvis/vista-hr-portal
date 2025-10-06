import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    const leaveTypes = await prisma.$queryRaw`
      SELECT id, leave_type_name, status
      FROM leave_type
      WHERE status = 1
      ORDER BY leave_type_name ASC
    ` as any[]

    return NextResponse.json(leaveTypes)
  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json({ error: 'Failed to fetch leave types' }, { status: 500 })
  }
}
