import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch all active marital status options
    const maritalStatusList = await prisma.$queryRaw`
      SELECT
        id,
        marital_status_name as name
      FROM marital_status
      WHERE status = 1
      ORDER BY marital_status_name ASC
    ` as any[]

    return NextResponse.json(maritalStatusList)
  } catch (error) {
    console.error('Error fetching marital status options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marital status options' },
      { status: 500 }
    )
  }
}