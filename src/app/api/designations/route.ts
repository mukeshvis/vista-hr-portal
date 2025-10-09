import { NextResponse } from "next/server"
import { prisma, executeWithRetry } from "@/lib/database/prisma"

export async function GET(request: Request) {
  try {
    console.log('🔄 Fetching designations...')
    const { searchParams } = new URL(request.url)
    const forSelect = searchParams.get('forSelect')

    // Fetch all designations excluding deleted ones (status != 0)
    // Using executeWithRetry for automatic reconnection on connection errors
    const designations = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT id, designation_name, status
        FROM designation
        WHERE status != 0
        ORDER BY id ASC
      ` as any[]
    })

    console.log(`✅ Fetched ${designations.length} designations`)

    if (forSelect === 'true') {
      // Format for SearchableSelect component
      const formattedDesignations = designations.map(designation => ({
        value: designation.id.toString(),
        label: designation.designation_name
      }))
      console.log(`✅ Returning ${formattedDesignations.length} formatted designations for select`)
      return NextResponse.json(formattedDesignations)
    } else {
      // Return full designation data for table
      return NextResponse.json(designations)
    }

  } catch (error: any) {
    console.error("❌ Error fetching designations:", error)
    console.error("❌ Error message:", error.message)
    console.error("❌ Error stack:", error.stack)
    return NextResponse.json(
      { error: "Failed to fetch designations", details: error.message },
      { status: 500 }
    )
  }
  // Note: Do not disconnect Prisma client - it maintains a connection pool
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { designation_name } = body

    // Validate required fields
    if (!designation_name || designation_name.trim() === '') {
      return NextResponse.json(
        { error: "Designation name is required" },
        { status: 400 }
      )
    }

    // Check if designation already exists
    const existingDesignation = await prisma.designation.findFirst({
      where: {
        designation_name: designation_name.trim(),
        status: { not: 0 }
      }
    })

    if (existingDesignation) {
      return NextResponse.json(
        { error: "This designation already exists" },
        { status: 409 }
      )
    }

    // Create new designation
    const newDesignation = await prisma.designation.create({
      data: {
        designation_name: designation_name.trim(),
        status: 1,
        username: "system",
        date: new Date(),
        time: new Date().toTimeString().slice(0, 8)
      }
    })

    console.log('✅ New designation created:', {
      id: newDesignation.id,
      name: newDesignation.designation_name
    })

    return NextResponse.json({
      success: true,
      designation: newDesignation,
      message: "Designation added successfully"
    })

  } catch (error) {
    console.error("Error creating designation:", error)
    return NextResponse.json(
      { error: "Failed to create designation" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, designation_name } = body

    if (!id) {
      return NextResponse.json(
        { error: "Designation ID is required" },
        { status: 400 }
      )
    }

    if (!designation_name || designation_name.trim() === '') {
      return NextResponse.json(
        { error: "Designation name is required" },
        { status: 400 }
      )
    }

    // Check if another designation with the same name exists
    const existingDesignation = await prisma.designation.findFirst({
      where: {
        designation_name: designation_name.trim(),
        status: { not: 0 },
        id: { not: parseInt(id) }
      }
    })

    if (existingDesignation) {
      return NextResponse.json(
        { error: "This designation name already exists" },
        { status: 409 }
      )
    }

    // Update designation
    const updatedDesignation = await prisma.designation.update({
      where: { id: parseInt(id) },
      data: {
        designation_name: designation_name.trim(),
        time: new Date().toTimeString().slice(0, 8)
      }
    })

    return NextResponse.json({
      success: true,
      designation: updatedDesignation,
      message: "Designation updated successfully"
    })

  } catch (error) {
    console.error("Error updating designation:", error)
    return NextResponse.json(
      { error: "Failed to update designation" },
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
        { error: "Designation ID is required" },
        { status: 400 }
      )
    }

    // Check if designation is being used by any grades (exclude deleted grades)
    const gradesCount = await prisma.grades.count({
      where: {
        designation_id: parseInt(id),
        status: { not: -1 }
      }
    })

    if (gradesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete designation. It is being used by ${gradesCount} grade(s).` },
        { status: 409 }
      )
    }

    // Soft delete by setting status to -1 (completely deleted)
    await prisma.designation.update({
      where: { id: parseInt(id) },
      data: { status: -1 }
    })

    return NextResponse.json({
      success: true,
      message: "Designation deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting designation:", error)
    return NextResponse.json(
      { error: "Failed to delete designation" },
      { status: 500 }
    )
  }
}