import { NextResponse } from "next/server"
import { prisma, executeWithRetry } from "@/lib/database/prisma"

export async function GET() {
  try {
    console.log('🔍 Fetching working hours policies...')
    const workingHours = await executeWithRetry(async () => {
      return await prisma.working_hours_policy.findMany({
        orderBy: { id: 'asc' }
      })
    })
    console.log('✅ Found', workingHours.length, 'policies')

    return NextResponse.json({
      success: true,
      data: workingHours
    })
  } catch (error) {
    console.error("❌ Error fetching working hours:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: "Failed to fetch working hours", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { working_hours_policy } = body

    if (!working_hours_policy || working_hours_policy.trim() === '') {
      return NextResponse.json(
        { error: "Policy name is required" },
        { status: 400 }
      )
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

    const newPolicy = await prisma.working_hours_policy.create({
      data: {
        working_hours_policy: working_hours_policy.trim(),
        start_working_hours_time: "09:00",
        end_working_hours_time: "18:00",
        working_hours_grace_time: 0,
        half_day_time: "00:00:00",
        username: "admin",
        status: 1,
        date: now,
        time: timeString
      }
    })

    return NextResponse.json({
      success: true,
      data: newPolicy,
      message: "Working hours policy added successfully"
    })
  } catch (error) {
    console.error("Error creating working hours:", error)
    return NextResponse.json(
      { error: "Failed to create working hours policy" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, working_hours_policy } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    if (!working_hours_policy || working_hours_policy.trim() === '') {
      return NextResponse.json(
        { error: "Policy name is required" },
        { status: 400 }
      )
    }

    const updatedPolicy = await prisma.working_hours_policy.update({
      where: { id: parseInt(id) },
      data: {
        working_hours_policy: working_hours_policy.trim()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
      message: "Working hours policy updated successfully"
    })
  } catch (error) {
    console.error("Error updating working hours:", error)
    return NextResponse.json(
      { error: "Failed to update working hours policy" },
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
        { error: "ID is required" },
        { status: 400 }
      )
    }

    await prisma.working_hours_policy.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: "Working hours policy deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting working hours:", error)
    return NextResponse.json(
      { error: "Failed to delete working hours policy" },
      { status: 500 }
    )
  }
}
