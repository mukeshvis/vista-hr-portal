import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Disable SSL certificate verification
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

// Helper to parse DD/MM/YYYY to Date
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date } = body

    console.log('📊 Fetching attendance logs directly from external API:', { start_date, end_date })

    // ALWAYS fetch directly from external API (as per user requirement)
    // Do NOT store in database for now - will implement later
    try {
      const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Portal/1.0',
        },
        body: JSON.stringify({ start_date, end_date }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        const responseText = await response.text()

        if (!responseText.includes('java.sql.') && !responseText.includes('Exception')) {
          try {
            const apiData = JSON.parse(responseText)
            const logs = Array.isArray(apiData) ? apiData : (apiData.data || [])

            console.log(`✅ Got ${logs.length} records from API`)
            console.log(`📊 Sample log:`, logs[0])

            // Log verify_mode statistics
            const faceModeCount = logs.filter((log: any) => log.verify_mode === 'FACE').length
            const formModeCount = logs.filter((log: any) => log.verify_mode === 'FORM').length
            const otherModeCount = logs.length - faceModeCount - formModeCount

            console.log(`🔍 Verify Mode Stats:`)
            console.log(`   - FACE (Machine): ${faceModeCount}`)
            console.log(`   - FORM (Manual): ${formModeCount}`)
            console.log(`   - Other: ${otherModeCount}`)

            // Log check-in/check-out statistics
            const checkInCount = logs.filter((log: any) => log.state === 'Check In').length
            const checkOutCount = logs.filter((log: any) => log.state === 'Check Out').length

            console.log(`📍 State Stats:`)
            console.log(`   - Check In: ${checkInCount}`)
            console.log(`   - Check Out: ${checkOutCount}`)

            // Return API data with verify_mode
            return NextResponse.json({
              data: logs,
              source: 'external_api',
              count: logs.length,
              stats: {
                check_in: checkInCount,
                check_out: checkOutCount,
                verify_mode: {
                  face: faceModeCount,
                  form: formModeCount,
                  other: otherModeCount
                }
              }
            }, {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Data-Source': 'external-api',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            })
          } catch (parseError) {
            console.error('❌ Failed to parse external API response:', parseError)
            return NextResponse.json({
              error: 'Failed to parse API response',
              details: 'Invalid JSON response from external API'
            }, { status: 500 })
          }
        } else {
          console.error('❌ API returned error response:', responseText.substring(0, 200))
          return NextResponse.json({
            error: 'External API error',
            details: 'API returned error response'
          }, { status: 500 })
        }
      } else {
        console.error('❌ API request failed with status:', response.status, response.statusText)
        return NextResponse.json({
          error: 'External API request failed',
          details: `Status: ${response.status} ${response.statusText}`
        }, { status: 500 })
      }
    } catch (apiError: any) {
      console.error('❌ External API failed:', apiError.message)
      return NextResponse.json({
        error: 'Failed to fetch from external API',
        details: apiError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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
