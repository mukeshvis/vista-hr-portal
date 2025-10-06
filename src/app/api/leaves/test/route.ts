import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    // Check table structures
    const leaveApp = await prisma.$queryRaw`DESCRIBE leave_application` as any[]
    const leaveAppData = await prisma.$queryRaw`DESCRIBE leave_application_data` as any[]
    const leaveType = await prisma.$queryRaw`DESCRIBE leave_type` as any[]
    const leavesData = await prisma.$queryRaw`DESCRIBE leaves_data` as any[]
    const leavesPolicy = await prisma.$queryRaw`DESCRIBE leaves_policy` as any[]

    return NextResponse.json({
      leave_application: leaveApp,
      leave_application_data: leaveAppData,
      leave_type: leaveType,
      leaves_data: leavesData,
      leaves_policy: leavesPolicy
    })
  } catch (error) {
    console.error('Error checking tables:', error)
    return NextResponse.json({ error: 'Failed to check tables' }, { status: 500 })
  }
}
