import { NextResponse } from "next/server"
import { prisma } from "@/lib/database/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { designation_id, employee_grade_type, category, status = 1, company_id = 1 } = body

    // Validate required fields
    if (!designation_id || !employee_grade_type) {
      return NextResponse.json(
        { error: "Designation ID and grade type are required" },
        { status: 400 }
      )
    }

    // Check if this grade already exists for this designation
    const existingGrade = await prisma.grades.findFirst({
      where: {
        designation_id: parseInt(designation_id),
        employee_grade_type: employee_grade_type,
        status: 1
      }
    })

    if (existingGrade) {
      return NextResponse.json(
        { error: "This grade already exists for the selected designation" },
        { status: 409 }
      )
    }

    // Create new grade
    const newGrade = await prisma.grades.create({
      data: {
        designation_id: parseInt(designation_id),
        employee_grade_type: employee_grade_type,
        category: category || null,
        company_id: parseInt(company_id),
        status: parseInt(status),
        username: "system", // You can make this dynamic based on logged user
        date: new Date(),
        time: new Date().toTimeString().slice(0, 8)
      }
    })

    console.log('✅ New grade created:', {
      id: newGrade.id,
      designation_id: newGrade.designation_id,
      grade: newGrade.employee_grade_type
    })

    return NextResponse.json({
      success: true,
      grade: newGrade,
      message: "Grade added successfully"
    })

  } catch (error) {
    console.error("Error creating grade:", error)
    return NextResponse.json(
      { error: "Failed to create grade" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Fetch grades with designation names using raw SQL - include both status 0 and status 1
    const grades = await prisma.$queryRaw`
      SELECT
        g.id,
        g.designation_id,
        g.employee_grade_type,
        g.category,
        g.status,
        COALESCE(d.designation_name, 'Unknown') as designation_name
      FROM grades g
      LEFT JOIN designation d ON g.designation_id = d.id
      WHERE g.designation_id IS NOT NULL AND (g.status = 0 OR g.status = 1)
      ORDER BY g.id ASC
    ` as any[]

    // Transform the data to match expected format
    const formattedGrades = grades.map(grade => ({
      id: grade.id,
      designation_id: grade.designation_id,
      designation_name: grade.designation_name,
      employee_grade_type: grade.employee_grade_type,
      category: grade.category,
      status: grade.status
    }))

    return NextResponse.json(formattedGrades)

  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json(
      { error: "Failed to fetch grades" },
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
        { error: "Grade ID is required" },
        { status: 400 }
      )
    }

    // Soft delete by setting status to -1 (completely deleted)
    await prisma.grades.update({
      where: { id: parseInt(id) },
      data: { status: -1 }
    })

    return NextResponse.json({
      success: true,
      message: "Grade deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting grade:", error)
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, designation_id, employee_grade_type, category } = body

    if (!id) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 }
      )
    }

    // Update grade
    const updatedGrade = await prisma.grades.update({
      where: { id: parseInt(id) },
      data: {
        designation_id: parseInt(designation_id),
        employee_grade_type: employee_grade_type,
        category: category || null,
        time: new Date().toTimeString().slice(0, 8)
      }
    })

    return NextResponse.json({
      success: true,
      grade: updatedGrade,
      message: "Grade updated successfully"
    })

  } catch (error) {
    console.error("Error updating grade:", error)
    return NextResponse.json(
      { error: "Failed to update grade" },
      { status: 500 }
    )
  }
}