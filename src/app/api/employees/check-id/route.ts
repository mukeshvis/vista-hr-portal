import { NextResponse } from "next/server"
import { prisma } from "@/lib/database/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const empId = searchParams.get('empId')

    if (!empId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        emp_id: empId,
        active: 1
      }
    })

    return NextResponse.json({
      exists: !!existingEmployee,
      message: existingEmployee ? "Employee ID already exists" : "Employee ID is available"
    })

  } catch (error) {
    console.error("Error checking employee ID:", error)
    return NextResponse.json({ error: "Failed to check employee ID" }, { status: 500 })
  }
}