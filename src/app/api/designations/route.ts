import { NextResponse } from 'next/server'

// Type definition for designation
interface DesignationType {
  id: number
  designation_name: string
}

// Mock data as fallback
const MOCK_DESIGNATIONS: DesignationType[] = [
  { id: 1, designation_name: "Sr Web Developer" },
  { id: 2, designation_name: "Jr Developer" },
  { id: 3, designation_name: "Intern Developer" },
  { id: 4, designation_name: "Graphic Designer" },
  { id: 5, designation_name: "President & CEO" },
  { id: 6, designation_name: "Deputy CEO" },
  { id: 7, designation_name: "Advisors / Consultants" },
  { id: 8, designation_name: "Executive Directors / Directors" },
  { id: 9, designation_name: "Senior Manager" },
  { id: 10, designation_name: "Manager" },
  { id: 11, designation_name: "Assistant Manager" },
  { id: 12, designation_name: "Junior Manager" },
  { id: 13, designation_name: "Internee" },
  { id: 14, designation_name: "Officers" },
  { id: 15, designation_name: "Executive Secretary/ Assistant" },
  { id: 16, designation_name: "Receptionist / Operator" },
  { id: 17, designation_name: "Office Boy" },
  { id: 18, designation_name: "Driver" },
  { id: 19, designation_name: "Janitorial" },
  { id: 20, designation_name: "Watchman" },
  { id: 21, designation_name: "Group Head" },
  { id: 22, designation_name: "IT Assistant" },
  { id: 23, designation_name: "Software Developer" },
  { id: 24, designation_name: "Senior Assistant Manager" },
  { id: 25, designation_name: "Accounts Officer" },
  { id: 26, designation_name: "Data Entry Operator" },
  { id: 27, designation_name: "Network Assistant" },
  { id: 28, designation_name: "Financial Analyst" },
  { id: 29, designation_name: "Manager Software Development" },
  { id: 30, designation_name: "Assistant Data Entry & Scanning" },
  { id: 31, designation_name: "Data Operator" },
  { id: 32, designation_name: "Assistant" },
  { id: 33, designation_name: "Group Manager" },
  { id: 34, designation_name: "Maintenance Support" },
  { id: 35, designation_name: "Group Head- CB/DFIs" },
  { id: 36, designation_name: "Database Assistant" },
  { id: 37, designation_name: "Group Head Research & Development" },
  { id: 38, designation_name: "Manager Analytics" },
  { id: 39, designation_name: "Director Analytics" },
  { id: 40, designation_name: "Data Analyst" }
]

export async function GET() {
  try {
    // Use mock data for designations
    console.log('✅ Fetching designations from mock data')

    const formattedDesignations = MOCK_DESIGNATIONS.map((designation: DesignationType) => ({
      value: designation.id.toString(),
      label: designation.designation_name
    }))

    return NextResponse.json(formattedDesignations)
  } catch (error) {
    console.error('Error processing designations:', error)

    // Fallback response
    return NextResponse.json(
      { error: 'Failed to fetch designations' },
      { status: 500 }
    )
  }
}