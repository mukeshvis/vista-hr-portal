import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Disable SSL certificate verification
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

// Sync external API data to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date } = body

    console.log('🔄 Starting attendance sync from external API...')
    console.log('Date range:', { start_date, end_date })

    // Fetch from external API
    const response = await fetch('https://att.vis.com.pk/APILogs?ID=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-Portal/1.0',
      },
      body: JSON.stringify({ start_date, end_date }),
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`External API returned status ${response.status}`)
    }

    const responseText = await response.text()

    // Check for errors
    if (responseText.includes('java.sql.') || responseText.includes('Exception')) {
      console.error('❌ External API error:', responseText.substring(0, 200))
      return NextResponse.json(
        { error: 'External API returned an error', details: responseText.substring(0, 500) },
        { status: 502 }
      )
    }

    // Parse JSON
    let apiData
    try {
      apiData = JSON.parse(responseText)
    } catch {
      throw new Error('Invalid JSON response from external API')
    }

    const logs = Array.isArray(apiData) ? apiData : (apiData.data || [])

    if (logs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No attendance data to sync',
        synced: 0
      })
    }

    console.log(`📊 Found ${logs.length} logs from external API`)

    // Save to database
    let syncedCount = 0
    let skippedCount = 0

    for (const log of logs) {
      try {
        // Check if already exists
        const existing = await prisma.user_attendance.findFirst({
          where: {
            user_id: log.user_id,
            state: log.state,
            punch_time: new Date(log.punch_time)
          }
        })

        if (existing) {
          skippedCount++
          continue
        }

        // Insert new record
        await prisma.user_attendance.create({
          data: {
            user_id: log.user_id,
            state: log.state,
            punch_time: new Date(log.punch_time),
            verify_mode: log.verify_mode || null,
            source: 'external_api'
          }
        })

        syncedCount++
      } catch (error: any) {
        console.error('Error saving log:', error.message)
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} new, ${skippedCount} skipped`)

    return NextResponse.json({
      success: true,
      message: 'Attendance data synced successfully',
      synced: syncedCount,
      skipped: skippedCount,
      total: logs.length
    })

  } catch (error: any) {
    console.error('❌ Sync error:', error.message)
    return NextResponse.json(
      { error: 'Failed to sync attendance data', details: error.message },
      { status: 500 }
    )
  }
}

// Sync employees from external API
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Syncing employees from external API...')

    const response = await fetch('https://att.vis.com.pk/APIUsers?ID=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-Portal/1.0',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`External API returned status ${response.status}`)
    }

    const apiData = await response.json()
    const employees = apiData.data || []

    console.log(`📊 Found ${employees.length} employees from external API`)

    let syncedCount = 0
    let updatedCount = 0

    for (const emp of employees) {
      try {
        const existing = await prisma.external_employees.findUnique({
          where: { pin_auto: emp.pin_auto }
        })

        if (existing) {
          // Update
          await prisma.external_employees.update({
            where: { pin_auto: emp.pin_auto },
            data: {
              pin_manual: emp.pin_manual,
              user_name: emp.user_name,
              password: emp.password,
              privilege: emp.privilege
            }
          })
          updatedCount++
        } else {
          // Create
          await prisma.external_employees.create({
            data: {
              pin_manual: emp.pin_manual,
              pin_auto: emp.pin_auto,
              user_name: emp.user_name,
              password: emp.password,
              privilege: emp.privilege
            }
          })
          syncedCount++
        }
      } catch (error: any) {
        console.error('Error saving employee:', error.message)
      }
    }

    console.log(`✅ Employee sync complete: ${syncedCount} new, ${updatedCount} updated`)

    return NextResponse.json({
      success: true,
      message: 'Employees synced successfully',
      synced: syncedCount,
      updated: updatedCount,
      total: employees.length
    })

  } catch (error: any) {
    console.error('❌ Employee sync error:', error.message)
    return NextResponse.json(
      { error: 'Failed to sync employees', details: error.message },
      { status: 500 }
    )
  }
}
