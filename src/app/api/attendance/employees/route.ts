import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

// Disable SSL certificate verification for this API only
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

export async function GET(request: NextRequest) {
  try {
    // Try fetching from external API with timeout and retry
    let data = null
    let apiError = null

    try {
      console.log('🔄 Attempting to fetch employees from external API...')

      const response = await fetch('https://att.pakujala.com/APIUsers?ID=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Portal/1.0',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (response.ok) {
        data = await response.json()
        console.log('✅ External API success - fetched employees:', data?.length || 0)
      } else {
        throw new Error(`API returned status ${response.status}`)
      }
    } catch (externalError: any) {
      apiError = externalError
      console.error('❌ External API failed:', externalError.message)

      // Fallback to local database
      console.log('🔄 Falling back to local database...')

      try {
        const employees = await executeWithRetry(async () =>
          await prisma.external_employees.findMany({
            select: {
              id: true,
              pin_auto: true,
              user_name: true,
            },
            orderBy: {
              user_name: 'asc'
            }
          })
        )

        // Transform to match external API format
        data = employees.map(emp => ({
          user_id: emp.id,
          emp_code: emp.pin_auto,
          name: emp.user_name,
          dept: '',
          designation: '',
        }))

        console.log('✅ Database fallback success - fetched employees:', data.length)
      } catch (dbError) {
        console.error('❌ Database fallback also failed:', dbError)
        throw new Error('Both external API and database failed')
      }
    }

    // Return the data with proper CORS headers
    return NextResponse.json(data || [], {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Data-Source': apiError ? 'database' : 'external-api',
      },
    })

  } catch (error) {
    console.error('❌ Final error in attendance employees route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees - both external API and database unavailable' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}