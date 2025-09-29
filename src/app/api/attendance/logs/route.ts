import { NextRequest, NextResponse } from 'next/server'

// Disable SSL certificate verification for this API only
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date } = body

    console.log('Request body received:', body)
    console.log('Sending to external API with dates:', { start_date, end_date })

    // Fetch data from external API with POST method
    const response = await fetch('https://att.pakujala.com/APILogs?ID=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-Portal/1.0',
      },
      body: JSON.stringify({
        start_date,
        end_date
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance logs from external API' },
        { status: response.status }
      )
    }

    // Check if the response is actually JSON
    const contentType = response.headers.get('content-type')
    const responseText = await response.text()

    console.log('Response content-type:', contentType)
    console.log('Response text preview:', responseText.substring(0, 200))

    // If the response starts with Java exception text, it's an error
    if (responseText.includes('java.sql.') || responseText.includes('Exception')) {
      console.error('External API returned Java exception:', responseText)
      return NextResponse.json(
        { error: 'External API encountered a database error' },
        { status: 502 }
      )
    }

    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json(
        { error: 'Invalid JSON response from external API' },
        { status: 502 }
      )
    }

    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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