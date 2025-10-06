import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Disable SSL certificate verification for this API only
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

// Helper function to parse DD/MM/YYYY format to Date
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

// Fallback function to fetch from local database
async function fetchFromLocalDatabase(start_date: string, end_date: string) {
  console.log('📊 Fetching from local database as fallback...')

  try {
    const startDate = parseDate(start_date)
    const endDate = parseDate(end_date)

    // Fetch attendance records from local database
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        attendance_date: {
          gte: startDate,
          lte: endDate
        },
        status: 1
      },
      orderBy: {
        attendance_date: 'asc'
      }
    })

    console.log(`✅ Found ${attendanceRecords.length} attendance records from local database`)

    // Transform local data to match external API format
    // Need to create separate check-in and check-out records
    const transformedData: any[] = []

    attendanceRecords.forEach(record => {
      // Create check-in record if clock_in exists
      if (record.clock_in && record.attendance_date) {
        const dateStr = new Date(record.attendance_date).toISOString().split('T')[0]
        transformedData.push({
          user_id: record.emp_id,
          state: 'Check In',
          punch_time: `${dateStr} ${record.clock_in}`,
          verify_mode: 'local_db',
          source: 'local_database'
        })
      }

      // Create check-out record if clock_out exists
      if (record.clock_out && record.attendance_date) {
        const dateStr = new Date(record.attendance_date).toISOString().split('T')[0]
        transformedData.push({
          user_id: record.emp_id,
          state: 'Check Out',
          punch_time: `${dateStr} ${record.clock_out}`,
          verify_mode: 'local_db',
          source: 'local_database'
        })
      }
    })

    return { data: transformedData }
  } catch (dbError) {
    console.error('❌ Error fetching from local database:', dbError)
    throw dbError
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date } = body

    console.log('Request body received:', body)

    let data
    let useLocalFallback = false

    // Check environment variable to decide which source to use
    const USE_LOCAL_DB = process.env.USE_LOCAL_ATTENDANCE_DB === 'true'

    if (USE_LOCAL_DB) {
      console.log('📊 Using local database (configured via env variable)')
      useLocalFallback = true
    } else {
      console.log('Trying external API first...')
      // Try external API first
      try {
        const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HR-Portal/1.0',
          },
          body: JSON.stringify({
            start_date,
            end_date
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (!response.ok) {
          console.warn('⚠️ External API returned non-OK status:', response.status)
          useLocalFallback = true
        } else {
          // Check if the response is actually JSON
          const contentType = response.headers.get('content-type')
          const responseText = await response.text()

          console.log('Response content-type:', contentType)
          console.log('Response text preview:', responseText.substring(0, 200))

          // If the response starts with Java exception text, it's an error
          if (responseText.includes('java.sql.') || responseText.includes('Exception')) {
            console.error('External API returned Java exception:', responseText)

            if (responseText.includes('GROUP BY') || responseText.includes('only_full_group_by')) {
              console.warn('⚠️ External API has GROUP BY error, falling back to local database')
            }

            useLocalFallback = true
          } else {
            // Try to parse as JSON
            try {
              data = JSON.parse(responseText)
              console.log('✅ Successfully fetched from external API')
            } catch (parseError) {
              console.error('Failed to parse response as JSON:', parseError)
              useLocalFallback = true
            }
          }
        }
      } catch (fetchError: any) {
        console.error('Error fetching from external API:', fetchError.message)
        useLocalFallback = true
      }
    }

    // If external API failed or configured to use local, use local database
    if (useLocalFallback) {
      console.log('🔄 Using local database...')
      const localData = await fetchFromLocalDatabase(start_date, end_date)
      data = localData // This already has { data: [...] } format
    } else {
      // Wrap external API data in consistent format if needed
      if (!data.data && Array.isArray(data)) {
        data = { data: data }
      }
    }

    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Data-Source': useLocalFallback ? 'local-database' : 'external-api', // Header to indicate source
      },
    })

  } catch (error) {
    console.error('Error fetching attendance logs:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching attendance logs' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}