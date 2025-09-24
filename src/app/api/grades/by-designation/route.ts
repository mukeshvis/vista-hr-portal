import { NextResponse } from "next/server"
import { prisma } from "@/lib/database/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const designationId = searchParams.get('designationId')

    if (!designationId) {
      return NextResponse.json({ error: "Designation ID is required" }, { status: 400 })
    }

    // Find all grades for this designation_id
    const grades = await prisma.grades.findMany({
      where: {
        designation_id: parseInt(designationId),
        status: 1,
        employee_grade_type: {
          not: null
        }
      },
      select: {
        id: true,
        employee_grade_type: true,
        category: true
      },
      orderBy: {
        id: 'asc' // Get consistent ordering
      }
    })

    if (grades.length === 0) {
      return NextResponse.json({
        grade: null,
        message: "No grade found for this designation"
      })
    }

    // If multiple grades exist, get unique grades and select the best one
    const uniqueGrades = [...new Set(grades.map(g => g.employee_grade_type).filter(Boolean))]

    console.log(`📊 Designation ID ${designationId}: Found ${grades.length} grades, ${uniqueGrades.length} unique grades`)
    console.log(`🎯 Unique grades:`, uniqueGrades)

    // Grade priority order (higher priority first)
    const gradePriority = ['G7', 'G6', 'G5', 'G4', 'G3', 'G2', 'G1', 'EX-V', 'EX-IV', 'EX-III', 'EX-II', 'EX-I', 'ENG-V', 'ENG-IV', 'ENG-III', 'ENG-II', 'ENG-I', 'ENG 3', 'ENG 2', 'ENG 1']

    // Select the highest priority grade if multiple unique grades exist
    let selectedGrade = uniqueGrades[0] // Default to first
    if (uniqueGrades.length > 1) {
      // Find the highest priority grade
      for (const priorityGrade of gradePriority) {
        if (uniqueGrades.includes(priorityGrade)) {
          selectedGrade = priorityGrade
          break
        }
      }
      console.log(`🏆 Selected highest priority grade: ${selectedGrade} from ${uniqueGrades.join(', ')}`)
    }

    const selectedGradeRecord = grades.find(g => g.employee_grade_type === selectedGrade)

    return NextResponse.json({
      grade: selectedGrade,
      gradeId: selectedGradeRecord?.id,
      category: selectedGradeRecord?.category,
      totalGrades: grades.length,
      uniqueGrades: uniqueGrades.length,
      message: grades.length > 1 ?
        `Selected unique grade from ${grades.length} available options` :
        "Grade found successfully"
    })

  } catch (error) {
    console.error("Error fetching grade by designation:", error)
    return NextResponse.json({ error: "Failed to fetch grade" }, { status: 500 })
  }
}