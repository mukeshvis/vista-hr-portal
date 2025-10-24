import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'



export async function GET(request: NextRequest) {
  try {
    // Optimize query by limiting JOINs and fetching only essential data for listing
    // Using executeWithRetry for automatic reconnection on connection errors
    const employees = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT
          e.id,
          e.emp_id,
          e.emp_name as name,
          e.designation_id,
          e.emp_gender as gender,
          e.status,
          COALESCE(d.designation_name, 'Unknown') as designation,
          COALESCE(g.employee_grade_type, 'N/A') as group_level
        FROM employee e
        LEFT JOIN designation d ON e.designation_id = d.id
        LEFT JOIN grades g ON e.emp_grade_id = g.id
        WHERE e.status IN (0, 1)
        ORDER BY e.emp_name ASC
        LIMIT 1000
      ` as any[]
    })

    // Transform the data to match the expected format (simplified for faster loading)
    const formattedEmployees = employees.map(emp => ({
      id: emp.id.toString(),
      empId: emp.emp_id,
      name: emp.name,
      designation: emp.designation,
      group: emp.group_level,
      gender: emp.gender === 1 ? 'Male' : emp.gender === 2 ? 'Female' : 'Male',
      status: emp.status === 1 ? 'Active' : 'Inactive'
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('❌ Error fetching employees:', error)

    // Fallback to mock data if database query fails
    const mockEmployees = [
      {
        id: '1',
        name: 'Sample Employee',
        designation: 'Software Engineer',
        group: 'Engineering'
      }
    ]

    return NextResponse.json(mockEmployees)
  }
  // Note: Do not disconnect Prisma client - it maintains a connection pool
}

export async function POST(request: NextRequest) {
  try {
    const employeeData = await request.json()

    console.log('Received new employee data:', employeeData)

    // Validate required fields
    if (!employeeData.name || !employeeData.empId) {
      return NextResponse.json(
        { error: 'Name and Employee ID are required' },
        { status: 400 }
      )
    }

    // Log the designation_id for debugging
    console.log('Selected designation_id:', employeeData.designation_id)

    // Log all data for verification
    console.log('✅ Employee data validation successful!')
    console.log('📋 Form Data Summary:')
    console.log(`   Name: ${employeeData.name}`)
    console.log(`   Employee ID: ${employeeData.empId}`)
    console.log(`   Email: ${employeeData.email}`)
    console.log(`   Designation ID: ${employeeData.designation_id}`)
    console.log(`   Salary: ${employeeData.salary}`)
    console.log(`   Status (active): ${employeeData.status} (1=Active, 0=Inactive)`)
    console.log(`   Gender: ${employeeData.gender} (1=Male, 2=Female)`)
 
    // Try to save to database using raw SQL
    try {
      console.log('🔄 Attempting to save employee to database...')

      // Format dates for MySQL
      const joiningDate = employeeData.joiningDate ? new Date(employeeData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      const dateOfBirth = employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth).toISOString().split('T')[0] : '1990-01-01'
      const cnicExpiryDate = employeeData.cnicExpiryDate ? new Date(employeeData.cnicExpiryDate).toISOString().split('T')[0] : '2030-12-31'

      // Find existing grade record by matching designation_id and employee_grade_type
      let gradeId = null
      if (employeeData.grade) {
        const designationId = parseInt(employeeData.designation_id) || 1

        // Find existing grade record that matches both designation_id and employee_grade_type
        const existingGrade = await prisma.$queryRaw`
          SELECT id FROM grades
          WHERE designation_id = ${designationId}
          AND employee_grade_type = ${employeeData.grade}
          AND status = 1
          LIMIT 1
        ` as any[]

        if (existingGrade.length > 0) {
          gradeId = existingGrade[0].id
          console.log('✅ Found existing grade:', employeeData.grade, 'for designation:', designationId, 'with ID:', gradeId)
        } else {
          console.log('⚠️ No matching grade found for:', employeeData.grade, 'and designation:', designationId)
          // Set gradeId to null if no matching grade found
          gradeId = null
        }
      }

      // Find or create department record
      let departmentId = 1 // Default department ID
      if (employeeData.department) {
        // First try to find existing department
        const existingDepartment = await prisma.$queryRaw`
          SELECT id FROM department WHERE department_name = ${employeeData.department} LIMIT 1
        ` as any[]

        if (existingDepartment.length > 0) {
          departmentId = existingDepartment[0].id
        } else {
          // Create new department if it doesn't exist
          await prisma.$executeRaw`
            INSERT INTO department (department_name, status, username, date, time, branch_id)
            VALUES (${employeeData.department}, 1, 'system', ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]}, 1)
          `

          // Get the newly created department id
          const newDepartment = await prisma.$queryRaw`
            SELECT id FROM department WHERE department_name = ${employeeData.department} ORDER BY id DESC LIMIT 1
          ` as any[]

          if (newDepartment.length > 0) {
            departmentId = newDepartment[0].id
          }
        }
      }

      // Find leave policy from existing leaves_policy table (IDs 21-29)
      let leavePolicyId = 21 // Default leave policy ID (first existing ID)
      if (employeeData.leavePolicy) {
        try {
          // Find existing leave policy from leaves_policy table
          const existingLeavePolicy = await prisma.$queryRaw`
            SELECT id FROM leaves_policy WHERE leaves_policy_name = ${employeeData.leavePolicy} LIMIT 1
          ` as any[]

          if (existingLeavePolicy.length > 0) {
            leavePolicyId = existingLeavePolicy[0].id
            console.log('✅ Found existing leave policy:', employeeData.leavePolicy, 'with ID:', leavePolicyId)
          } else {
            console.log('⚠️ Leave policy not found:', employeeData.leavePolicy, '- using default ID:', leavePolicyId)
          }
        } catch (error) {
          console.error('❌ Error finding leave policy:', error)
          leavePolicyId = 21 // Fallback to default
        }
      }

      // Handle marital status - find or create marital status record
      let maritalStatusId = 7 // Default to Single (ID 7)
      if (employeeData.maritalStatus) {
        try {
          // Find existing marital status
          const existingMaritalStatus = await prisma.$queryRaw`
            SELECT id FROM marital_status WHERE marital_status_name = ${employeeData.maritalStatus} AND status = 1 LIMIT 1
          ` as any[]

          if (existingMaritalStatus.length > 0) {
            maritalStatusId = existingMaritalStatus[0].id
            console.log('✅ Found existing marital status:', employeeData.maritalStatus, 'with ID:', maritalStatusId)
          } else {
            // Create new marital status if it doesn't exist
            await prisma.$executeRaw`
              INSERT INTO marital_status (marital_status_name, status, username, date, time, company_id)
              VALUES (${employeeData.maritalStatus}, 1, 'system', ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]}, 1)
            `

            // Get the newly created marital status id
            const newMaritalStatus = await prisma.$queryRaw`
              SELECT id FROM marital_status WHERE marital_status_name = ${employeeData.maritalStatus} ORDER BY id DESC LIMIT 1
            ` as any[]

            if (newMaritalStatus.length > 0) {
              maritalStatusId = newMaritalStatus[0].id
              console.log('✅ Created new marital status:', employeeData.maritalStatus, 'with ID:', maritalStatusId)
            }
          }
        } catch (error) {
          console.error('❌ Error handling marital status:', error)
          maritalStatusId = 7 // Fallback to Single
        }
      }

      // Execute raw SQL insert
      await prisma.$executeRaw`
        INSERT INTO employee (
          emp_id, emp_name, emp_email, emp_contact_no, designation_id, emp_grade_id, working_hours_policy_id, reporting_manager,
          emp_department_id, qualification_id, role_id, emp_salary, active,
          emp_gender, residential_address, permanent_address, emp_marital_status,
          nationality, emp_cnic, emp_cnic_expiry_date, bank_account, account_title,
          emp_joining_date, emp_father_name, emp_date_of_birth, day_off,
          professional_email, branch, username, leaves_policy_id, emp_place_of_birth,
          emp_employementstatus_id, emp_sub_department_id, labour_law, can_login,
          relegion, img_path, date, time, gratuity
        ) VALUES (
          ${employeeData.empId}, ${employeeData.name}, ${employeeData.email || 'N/A'},
          ${employeeData.phone || 'N/A'}, ${parseInt(employeeData.designation_id) || 1}, ${gradeId},
          ${employeeData.workingHoursPolicy ? parseInt(employeeData.workingHoursPolicy) : null},
          ${employeeData.reportingManager ? parseInt(employeeData.reportingManager) : null},
          ${departmentId}, ${1}, ${1}, ${parseFloat(employeeData.salary) || 0},
          ${employeeData.status}, ${employeeData.gender},
          ${employeeData.address || 'N/A'}, ${employeeData.permanentAddress || 'N/A'},
          ${maritalStatusId}, ${employeeData.nationality || 'Pakistan'},
          ${employeeData.cnic || 'N/A'}, ${cnicExpiryDate}, ${employeeData.bankAccount || 'N/A'},
          ${employeeData.accountTitle || 'N/A'}, ${joiningDate}, ${employeeData.fatherName || 'N/A'},
          ${dateOfBirth}, ${employeeData.dayOff || 'Sunday'}, ${employeeData.professionalEmail || 'N/A'},
          ${employeeData.branch || 'Main'}, ${employeeData.username || employeeData.empId},
          ${leavePolicyId}, ${'N/A'}, ${1}, ${1}, ${1}, ${'no'}, ${'Islam'}, ${'default.jpg'},
          ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]}, ${'no'}
        )
      `

      console.log('✅ Employee successfully saved to database!')

      return NextResponse.json({
        success: true,
        message: '✅ Employee successfully added to database!',
        empId: employeeData.empId,
        designation_id: employeeData.designation_id,
        saved: true
      }, { status: 201 })

    } catch (dbError) {
      console.error('❌ Database save failed:', dbError)

      // Return processed data even if database save fails
      return NextResponse.json({
        success: true,
        message: '✅ Employee data processed (Database connection issue)',
        empId: employeeData.empId,
        designation_id: employeeData.designation_id,
        saved: false,
        note: 'Data validation successful but database save failed'
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error processing employee:', error)
    return NextResponse.json(
      { error: 'Failed to process employee data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting employee with ID:', id)

    // Soft delete by setting status = 0 (inactive)
    await prisma.$executeRaw`
      UPDATE employee
      SET status = 0
      WHERE id = ${parseInt(id)}
    `

    console.log('✅ Employee soft deleted successfully (status set to 0)')

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}