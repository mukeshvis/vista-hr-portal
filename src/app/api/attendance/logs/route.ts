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
    const { start_date, end_date, force_refresh } = body

    console.log('📊 Fetching attendance logs:', { start_date, end_date, force_refresh })

    const startDate = parseDate(start_date)
    const endDate = parseDate(end_date)
    endDate.setHours(23, 59, 59, 999) // End of day

    // STEP 1: ALWAYS fetch from database first (FAST ⚡)
    const dbLogs = await prisma.user_attendance.findMany({
      where: {
        punch_time: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        punch_time: 'asc'
      }
    })

    console.log(`💾 Found ${dbLogs.length} logs in database`)

    // If force_refresh requested, fetch from API and update database
    if (force_refresh) {
      console.log('🔄 Force refresh requested - fetching from API...')

      try {
        const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HR-Portal/1.0',
          },
          body: JSON.stringify({ start_date, end_date }),
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          const responseText = await response.text()

          if (!responseText.includes('java.sql.') && !responseText.includes('Exception')) {
            const apiData = JSON.parse(responseText)
            const logs = Array.isArray(apiData) ? apiData : (apiData.data || [])

            console.log(`✅ Got ${logs.length} records from API`)

            // Update database with new records
            if (logs.length > 0) {
              console.log(`💾 Updating database...`)

              for (const log of logs) {
                try {
                  const existing = await prisma.user_attendance.findFirst({
                    where: {
                      user_id: log.user_id,
                      state: log.state,
                      punch_time: new Date(log.punch_time)
                    }
                  })

                  if (!existing) {
                    await prisma.user_attendance.create({
                      data: {
                        user_id: log.user_id,
                        state: log.state,
                        punch_time: new Date(log.punch_time),
                        verify_mode: log.verify_mode || null,
                        source: 'external_api'
                      }
                    })
                  }
                } catch (error) {
                  // Skip duplicates
                }
              }

              console.log('✅ Database updated')
            }

            // Return fresh API data
            return NextResponse.json({
              data: logs,
              source: 'external_api_fresh',
              count: logs.length
            }, {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Data-Source': 'external-api-fresh'
              }
            })
          }
        }
      } catch (apiError) {
        console.error('❌ API failed during force refresh:', apiError)
        // Fall through to return database data
      }
    }

    // Return database data (fast response)
    if (dbLogs.length > 0) {
      const transformedData = dbLogs.map(log => {
        // Format date in local timezone (not UTC)
        const date = new Date(log.punch_time)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

        return {
          user_id: log.user_id,
          state: log.state,
          punch_time: formattedTime,
          verify_mode: log.verify_mode,
          source: log.source
        }
      })

      return NextResponse.json({
        data: transformedData,
        source: 'database',
        count: transformedData.length
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'database'
        }
      })
    }

    // If no data in database, try external API
    console.log('⚠️ No data in database, trying external API...')

    try {
      const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Portal/1.0',
        },
        body: JSON.stringify({ start_date, end_date }),
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const responseText = await response.text()

        if (!responseText.includes('java.sql.') && !responseText.includes('Exception')) {
          try {
            const apiData = JSON.parse(responseText)
            const logs = Array.isArray(apiData) ? apiData : (apiData.data || [])

            // Save to database for future use
            if (logs.length > 0) {
              console.log(`💾 Saving ${logs.length} logs to database...`)

              for (const log of logs) {
                try {
                  await prisma.user_attendance.create({
                    data: {
                      user_id: log.user_id,
                      state: log.state,
                      punch_time: new Date(log.punch_time),
                      verify_mode: log.verify_mode || null,
                      source: 'external_api'
                    }
                  })
                } catch (error) {
                  // Skip duplicates
                }
              }

              console.log('✅ Data saved to database')
            }

            return NextResponse.json({
              data: logs,
              source: 'external_api',
              count: logs.length
            }, {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Data-Source': 'external-api'
              }
            })
          } catch (parseError) {
            console.error('Failed to parse external API response')
          }
        }
      }
    } catch (apiError) {
      console.error('External API failed:', apiError)
    }

    // Return empty if both sources failed
    console.log('❌ No data available from any source')
    return NextResponse.json({
      data: [],
      source: 'none',
      count: 0
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Data-Source': 'none'
      }
    })

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
