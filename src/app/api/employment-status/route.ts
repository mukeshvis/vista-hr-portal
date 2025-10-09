import { NextResponse } from "next/server"
import { prisma, executeWithRetry } from "@/lib/database/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forSelect = searchParams.get('forSelect')

    // Fetch all employment statuses excluding deleted ones (status != -1) with auto-retry
    const employmentStatuses = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT id, job_type_name, status
        FROM emp_empstatus
        WHERE status != -1
        ORDER BY job_type_name ASC
      ` as any[]
    })

    if (forSelect === 'true') {
      // Format for SearchableSelect component
      const formattedStatuses = employmentStatuses.map(status => ({
        value: status.id.toString(),
        label: status.job_type_name
      }))
      return NextResponse.json(formattedStatuses)
    } else {
      // Return full employment status data for table
      return NextResponse.json(employmentStatuses)
    }

  } catch (error) {
    console.error("Error fetching employment statuses:", error)
    return NextResponse.json(
      { error: "Failed to fetch employment statuses" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job_type_name } = body

    // Validate required fields
    if (!job_type_name || job_type_name.trim() === '') {
      return NextResponse.json(
        { error: "Job type name is required" },
        { status: 400 }
      )
    }

    // Check if employment status already exists
    const existingStatus = await prisma.emp_empstatus.findFirst({
      where: {
        job_type_name: job_type_name.trim(),
        status: { not: -1 }
      }
    })

    if (existingStatus) {
      return NextResponse.json(
        { error: "This job type already exists" },
        { status: 409 }
      )
    }

    // Create new employment status
    const newStatus = await prisma.emp_empstatus.create({
      data: {
        job_type_name: job_type_name.trim(),
        status: 1,
        username: "system",
        date: new Date(),
        time: new Date().toTimeString().slice(0, 8),
        company_id: 1
      }
    })

    console.log('✅ New employment status created:', {
      id: newStatus.id,
      name: newStatus.job_type_name
    })

    return NextResponse.json({
      success: true,
      employmentStatus: newStatus,
      message: "Employment status added successfully"
    })

  } catch (error) {
    console.error("Error creating employment status:", error)
    return NextResponse.json(
      { error: "Failed to create employment status" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, job_type_name } = body

    if (!id) {
      return NextResponse.json(
        { error: "Employment status ID is required" },
        { status: 400 }
      )
    }

    if (!job_type_name || job_type_name.trim() === '') {
      return NextResponse.json(
        { error: "Job type name is required" },
        { status: 400 }
      )
    }

    // Check if another employment status with the same name exists
    const existingStatus = await prisma.emp_empstatus.findFirst({
      where: {
        job_type_name: job_type_name.trim(),
        status: { not: -1 },
        id: { not: parseInt(id) }
      }
    })

    if (existingStatus) {
      return NextResponse.json(
        { error: "This job type name already exists" },
        { status: 409 }
      )
    }

    // Update employment status
    const updatedStatus = await prisma.emp_empstatus.update({
      where: { id: parseInt(id) },
      data: {
        job_type_name: job_type_name.trim(),
        time: new Date().toTimeString().slice(0, 8)
      }
    })

    return NextResponse.json({
      success: true,
      employmentStatus: updatedStatus,
      message: "Employment status updated successfully"
    })

  } catch (error) {
    console.error("Error updating employment status:", error)
    return NextResponse.json(
      { error: "Failed to update employment status" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Employment status ID is required" },
        { status: 400 }
      )
    }

    // Check if employment status is being used by any employees
    const employeesCount = await prisma.employee.count({
      where: {
        emp_employementstatus_id: parseInt(id)
      }
    })

    if (employeesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete employment status. It is being used by ${employeesCount} employee(s).` },
        { status: 409 }
      )
    }

    // Soft delete by setting status to -1 (completely deleted)
    await prisma.emp_empstatus.update({
      where: { id: parseInt(id) },
      data: { status: -1 }
    })

    return NextResponse.json({
      success: true,
      message: "Employment status deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting employment status:", error)
    return NextResponse.json(
      { error: "Failed to delete employment status" },
      { status: 500 }
    )
  }
}