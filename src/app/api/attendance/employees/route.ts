import { NextRequest, NextResponse } from 'next/server'

// Disable SSL certificate verification for this API only
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

export async function GET(request: NextRequest) {
  try {
    // Fetch data from external API
    const response = await fetch('https://att.pakujala.com/APIUsers?ID=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-Portal/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch employees from external API' },
        { status: response.status }
      )
    }

    const data = await response.json()

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
    console.error('Error fetching external API:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching employees' },
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