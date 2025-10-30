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
      console.log('🔄 Attempting to connect to external attendance API...')
      const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Portal/1.0',
        },
        body: JSON.stringify({ start_date, end_date }),
        signal: AbortSignal.timeout(15000) // 15 second timeout (increased from 10s)
      })
      console.log('✅ External API responded with status:', response.status)

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
      console.warn('⚠️ Returning empty data set - External attendance API is unavailable')

      // Return empty data instead of error to allow dashboard to continue
      return NextResponse.json({
        data: [],
        source: 'external_api_unavailable',
        count: 0,
        error: 'External attendance API is currently unavailable',
        details: apiError.message,
        stats: {
          check_in: 0,
          check_out: 0,
          verify_mode: {
            face: 0,
            form: 0,
            other: 0
          }
        }
      }, {
        status: 200, // Return 200 with empty data instead of 500
        headers: {
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'unavailable',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET handler for employee-specific attendance records by month/year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empId = searchParams.get('empId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!empId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: empId, month, year' },
        { status: 400 }
      )
    }

    console.log(`📊 Fetching attendance for employee ${empId} for ${month}/${year}`)

    // Calculate start and end dates for the month
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum, 0) // Last day of the month

    const startDateStr = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`
    const endDateStr = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`

    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`)

    // Fetch from external API
    try {
      const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Portal/1.0',
        },
        body: JSON.stringify({
          start_date: startDateStr,
          end_date: endDateStr
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const responseText = await response.text()

        if (!responseText.includes('java.sql.') && !responseText.includes('Exception')) {
          try {
            const apiData = JSON.parse(responseText)
            const allLogs = Array.isArray(apiData) ? apiData : (apiData.data || [])

            // Filter logs by employee ID (API uses user_id field)
            // Try both with and without leading zeros (e.g., "072" and "72")
            const empIdNum = parseInt(empId)
            const employeeLogs = allLogs.filter((log: any) => {
              const logUserId = log.user_id
              // Check if user_id matches as string or number (with/without leading zeros)
              return logUserId === empId ||
                     logUserId === empIdNum ||
                     parseInt(logUserId) === empIdNum ||
                     String(logUserId).padStart(3, '0') === empId
            })

            console.log(`✅ Found ${employeeLogs.length} records for employee ${empId} (numeric: ${empIdNum})`)
            console.log(`📊 Total logs fetched from API:`, allLogs.length)
            if (allLogs.length > 0) {
              console.log(`📊 Sample API log:`, allLogs[0])
              console.log(`📊 Unique user_ids in API response:`, [...new Set(allLogs.map((l: any) => l.user_id))])
            }
            if (employeeLogs.length > 0) {
              console.log(`📊 Sample employee record:`, employeeLogs[0])
            }

            // Transform the data to match expected format
            const transformedLogs = employeeLogs.map((log: any, index: number) => {
              // Extract date and time from punch_time (format: "YYYY-MM-DD HH:MM:SS")
              const punchDateTime = log.punch_time ? new Date(log.punch_time) : null
              const dateStr = punchDateTime ? punchDateTime.toISOString().split('T')[0] : null
              const timeStr = punchDateTime ? punchDateTime.toLocaleTimeString('en-US', { hour12: false }) : null

              return {
                id: index + 1,
                emp_id: log.user_id,
                date: dateStr,
                check_in: log.state === 'Check In' ? timeStr : null,
                check_out: log.state === 'Check Out' ? timeStr : null,
                status: log.status || 'Present',
                late_arrival: log.late_arrival || null,
                work_from_home: log.verify_mode === 'FORM' ? 'Yes' : 'No',
                state: log.state
              }
            })

            // Group by date to combine check-in and check-out
            const groupedByDate = transformedLogs.reduce((acc: any, log: any) => {
              const dateKey = log.date
              if (!dateKey) return acc // Skip records without valid date

              if (!acc[dateKey]) {
                acc[dateKey] = {
                  id: log.id,
                  emp_id: log.emp_id,
                  date: log.date,
                  check_in: null,
                  check_out: null,
                  status: log.status,
                  late_arrival: log.late_arrival,
                  work_from_home: log.work_from_home
                }
              }

              // Update check-in/check-out times
              if (log.check_in) acc[dateKey].check_in = log.check_in
              if (log.check_out) acc[dateKey].check_out = log.check_out

              // Keep the WFH status (FORM mode indicates manual entry/WFH)
              if (log.work_from_home === 'Yes') {
                acc[dateKey].work_from_home = 'Yes'
              }

              return acc
            }, {})

            const finalLogs = Object.values(groupedByDate)

            console.log(`📋 Final grouped logs: ${finalLogs.length} days`)
            console.log(`📊 Sample grouped log:`, finalLogs[0])

            return NextResponse.json({
              logs: finalLogs,
              count: finalLogs.length,
              empId,
              month,
              year
            })

          } catch (parseError) {
            console.error('❌ Failed to parse API response:', parseError)
            return NextResponse.json({
              error: 'Failed to parse API response',
              logs: []
            }, { status: 500 })
          }
        } else {
          console.error('❌ API returned error response')
          return NextResponse.json({
            error: 'External API error',
            logs: []
          }, { status: 500 })
        }
      } else {
        console.error('❌ API request failed:', response.status)
        return NextResponse.json({
          error: 'External API request failed',
          logs: []
        }, { status: 500 })
      }
    } catch (apiError: any) {
      console.error('❌ External API failed:', apiError.message)
      console.warn('⚠️ Returning empty logs - External attendance API is unavailable')

      // Return empty logs instead of error to allow dashboard to continue
      return NextResponse.json({
        logs: [],
        count: 0,
        empId,
        month,
        year,
        error: 'External attendance API is currently unavailable',
        details: apiError.message
      }, { status: 200 }) // Return 200 with empty data instead of 500
    }

  } catch (error: any) {
    console.error('❌ Error in GET handler:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', logs: [] },
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
