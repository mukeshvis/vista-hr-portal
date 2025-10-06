import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET() {
  try {
    // Check latest leave applications in database
    const applications = await prisma.$queryRaw`
      SELECT
        la.id,
        la.emp_id,
        la.leave_type,
        la.reason,
        la.date as application_date,
        lad.from_date,
        lad.to_date,
        lad.no_of_days
      FROM leave_application la
      LEFT JOIN leave_application_data lad ON la.id = lad.leave_application_id
      ORDER BY la.id DESC
      LIMIT 10
    ` as any[]

    // Count total applications
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM leave_application
    ` as any[]

    return NextResponse.json({
      totalApplications: Number(count[0].total),
      latestApplications: applications.map(app => ({
        ...app,
        id: Number(app.id)
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
