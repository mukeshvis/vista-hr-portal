import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

// UPDATE leave application status (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log('Updating leave application:', id, data)

    await prisma.$executeRaw`
      UPDATE leave_application
      SET
        approval_status = ${data.approvalStatus},
        approved = ${data.approved},
        approval_status_lm = ${data.approvalStatusLm || data.approvalStatus}
      WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({
      success: true,
      message: 'Leave application updated successfully'
    })
  } catch (error) {
    console.error('Error updating leave application:', error)
    return NextResponse.json({ error: 'Failed to update leave application' }, { status: 500 })
  }
}

// DELETE leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete leave application data first
    await prisma.$executeRaw`
      DELETE FROM leave_application_data WHERE leave_application_id = ${parseInt(id)}
    `

    // Delete leave application
    await prisma.$executeRaw`
      DELETE FROM leave_application WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({
      success: true,
      message: 'Leave application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave application:', error)
    return NextResponse.json({ error: 'Failed to delete leave application' }, { status: 500 })
  }
}
