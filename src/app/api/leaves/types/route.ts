import { NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

export async function GET() {
  try {
    const leaveTypes = await executeWithRetry(async () => {
      return await prisma.leave_type.findMany({
        where: {
          status: 1
        },
        select: {
          id: true,
          leave_type_name: true,
          status: true
        },
        orderBy: {
          leave_type_name: 'asc'
        }
      })
    })

    return NextResponse.json(leaveTypes)
  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json({ error: 'Failed to fetch leave types' }, { status: 500 })
  }
}
