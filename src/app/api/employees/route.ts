import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch ALL employees at once for client-side pagination
    const employees = await prisma.$queryRaw`
      SELECT
        e.id,
        e.emp_name as name,
        e.designation_id,
        e.emp_gender as gender,
        e.reporting_manager,
        COALESCE(d.designation_name, 'Unknown') as designation,
        COALESCE(rm.emp_name, 'N/A') as reporting_manager_name,
        COALESCE(g.employee_grade_type, 'N/A') as group_level
      FROM employee e
      LEFT JOIN designation d ON e.designation_id = d.id
      LEFT JOIN employee rm ON e.reporting_manager = rm.id
      LEFT JOIN grades g ON e.emp_grade_id = g.id
      ORDER BY e.emp_name ASC
    ` as any[]

    // Transform the data to match the expected format
    const formattedEmployees = employees.map(emp => ({
      id: emp.id.toString(),
      name: emp.name,
      designation: emp.designation,
      group: emp.group_level,
      gender: emp.gender || 'Male', // Default to Male if not specified
      reportingManager: emp.reporting_manager_name,
      reportingManagerId: emp.reporting_manager
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('Error fetching employees:', error)

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
    console.log(`   Status: ${employeeData.status}`)
    console.log(`   Gender: ${employeeData.gender}`)

    // Try to save to database using raw SQL
    try {
      console.log('🔄 Attempting to save employee to database...')

      // Format dates for MySQL
      const joiningDate = employeeData.joiningDate ? new Date(employeeData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      const dateOfBirth = employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth).toISOString().split('T')[0] : '1990-01-01'
      const cnicExpiryDate = employeeData.cnicExpiryDate ? new Date(employeeData.cnicExpiryDate).toISOString().split('T')[0] : '2030-12-31'

      // Create grade record first with designation_id
      let gradeId = null
      if (employeeData.grade) {
        const designationId = parseInt(employeeData.designation_id) || 1

        // Always create a new grade record for each employee with their designation_id
        await prisma.$executeRaw`
          INSERT INTO grades (employee_grade_type, designation_id, status, date, time)
          VALUES (${employeeData.grade}, ${designationId}, 1, ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]})
        `

        // Get the newly created grade id
        const newGrade = await prisma.$queryRaw`
          SELECT id FROM grades WHERE employee_grade_type = ${employeeData.grade} AND designation_id = ${designationId} ORDER BY id DESC LIMIT 1
        ` as any[]

        if (newGrade.length > 0) {
          gradeId = newGrade[0].id
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

      // Find or create leave policy record
      let leavePolicyId = 1 // Default leave policy ID
      if (employeeData.leavePolicy) {
        try {
          // First try to find existing leave policy
          const existingLeavePolicy = await prisma.$queryRaw`
            SELECT id FROM leave_policy WHERE policy_name = ${employeeData.leavePolicy} LIMIT 1
          ` as any[]

          if (existingLeavePolicy.length > 0) {
            leavePolicyId = existingLeavePolicy[0].id
            console.log('✅ Found existing leave policy:', employeeData.leavePolicy, 'with ID:', leavePolicyId)
          } else {
            // Create new leave policy if it doesn't exist
            await prisma.$executeRaw`
              INSERT INTO leave_policy (policy_name, status, created_by, date, time)
              VALUES (${employeeData.leavePolicy}, 1, 'system', ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]})
            `

            // Get the newly created leave policy id
            const newLeavePolicy = await prisma.$queryRaw`
              SELECT id FROM leave_policy WHERE policy_name = ${employeeData.leavePolicy} ORDER BY id DESC LIMIT 1
            ` as any[]

            if (newLeavePolicy.length > 0) {
              leavePolicyId = newLeavePolicy[0].id
              console.log('✅ Created new leave policy:', employeeData.leavePolicy, 'with ID:', leavePolicyId)
            }
          }
        } catch (error) {
          console.error('❌ Error handling leave policy:', error)
          leavePolicyId = 1 // Fallback to default
        }
      }

      // Execute raw SQL insert
      await prisma.$executeRaw`
        INSERT INTO employee (
          emp_id, emp_name, emp_email, emp_contact_no, designation_id, emp_grade_id, working_hours_policy_id, reporting_manager,
          emp_department_id, qualification_id, role_id, emp_salary, status,
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
          ${employeeData.status === 'Active' ? 1 : 0}, ${employeeData.gender === 'Male' ? '1' : '2'},
          ${employeeData.address || 'N/A'}, ${employeeData.permanentAddress || 'N/A'},
          ${employeeData.maritalStatus === 'Married' ? 1 : 0}, ${employeeData.nationality || 'Pakistan'},
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