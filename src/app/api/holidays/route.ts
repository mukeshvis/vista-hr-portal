import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all holidays
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const type = searchParams.get('type')

    const whereClause: any = {
      status: 1
    }

    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1)
      const endOfYear = new Date(parseInt(year), 11, 31)
      whereClause.holiday_date = {
        gte: startOfYear,
        lte: endOfYear
      }
    }

    // Filter by month if provided (and year)
    if (year && month) {
      const startOfMonth = new Date(parseInt(year), parseInt(month), 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month) + 1, 0)
      whereClause.holiday_date = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    // Filter by type if provided
    if (type) {
      whereClause.holiday_type = type
    }

    const holidays = await prisma.holidays.findMany({
      where: whereClause,
      orderBy: {
        holiday_date: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: holidays
    })

  } catch (error) {
    console.error('Error fetching holidays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      holiday_name,
      holiday_date,
      holiday_type,
      description,
      is_recurring,
      created_by,
      company_id
    } = body

    // Validate required fields
    if (!holiday_name || !holiday_date || !holiday_type) {
      return NextResponse.json(
        { error: 'Holiday name, date, and type are required' },
        { status: 400 }
      )
    }

    // Check if holiday already exists on this date
    const existingHoliday = await prisma.holidays.findFirst({
      where: {
        holiday_date: new Date(holiday_date),
        status: 1
      }
    })

    if (existingHoliday) {
      return NextResponse.json(
        { error: 'A holiday already exists on this date' },
        { status: 409 }
      )
    }

    const newHoliday = await prisma.holidays.create({
      data: {
        holiday_name,
        holiday_date: new Date(holiday_date),
        holiday_type,
        description: description || null,
        is_recurring: is_recurring || false,
        created_by: created_by || 'system',
        company_id: company_id || null,
        status: 1
      }
    })

    return NextResponse.json({
      success: true,
      data: newHoliday,
      message: 'Holiday created successfully'
    })

  } catch (error) {
    console.error('Error creating holiday:', error)
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete holiday
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Holiday ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting status to 0
    await prisma.holidays.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Holiday deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting holiday:', error)
    return NextResponse.json(
      { error: 'Failed to delete holiday' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update holiday
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      holiday_name,
      holiday_date,
      holiday_type,
      description,
      is_recurring
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Holiday ID is required' },
        { status: 400 }
      )
    }

    const updatedHoliday = await prisma.holidays.update({
      where: {
        id: parseInt(id)
      },
      data: {
        holiday_name,
        holiday_date: holiday_date ? new Date(holiday_date) : undefined,
        holiday_type,
        description,
        is_recurring
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedHoliday,
      message: 'Holiday updated successfully'
    })

  } catch (error) {
    console.error('Error updating holiday:', error)
    return NextResponse.json(
      { error: 'Failed to update holiday' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}