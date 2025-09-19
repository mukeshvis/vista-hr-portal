import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    // Fetch employee details with designation information using raw SQL
    const employee = await prisma.$queryRaw`
      SELECT
        e.id,
        e.emp_id,
        e.emp_name as name,
        e.emp_email as email,
        e.emp_contact_no as phone,
        e.designation_id,
        COALESCE(d.designation_name, 'Unknown') as designation,
        e.emp_department_id,
        COALESCE(dept.department_name, 'Unknown') as department,
        e.reporting_manager,
        COALESCE(rm.emp_name, 'N/A') as reporting_manager_name,
        e.emp_grade_id,
        COALESCE(g.employee_grade_type, 'N/A') as grade_name,
        CASE
          WHEN e.emp_joining_date IS NULL OR YEAR(e.emp_joining_date) < 1000 THEN NULL
          ELSE e.emp_joining_date
        END as joiningDate,
        e.emp_salary as salary,
        e.status,
        e.emp_gender as gender,
        e.residential_address as address,
        e.permanent_address as permanentAddress,
        e.emp_marital_status as maritalStatus,
        e.nationality,
        e.emp_cnic as cnic,
        e.bank_account as bankAccount,
        e.account_title as accountTitle,
        e.emp_father_name as fatherName,
        CASE
          WHEN e.emp_date_of_birth IS NULL OR YEAR(e.emp_date_of_birth) < 1000 THEN NULL
          ELSE e.emp_date_of_birth
        END as dateOfBirth,
        CASE
          WHEN e.date_of_leaving IS NULL OR YEAR(e.date_of_leaving) < 1000 THEN NULL
          ELSE e.date_of_leaving
        END as dateOfLeaving,
        CASE
          WHEN e.probation_expire_date IS NULL OR YEAR(e.probation_expire_date) < 1000 THEN NULL
          ELSE e.probation_expire_date
        END as probationExpireDate,
        CASE
          WHEN e.emp_cnic_expiry_date IS NULL OR YEAR(e.emp_cnic_expiry_date) < 1000 THEN NULL
          ELSE e.emp_cnic_expiry_date
        END as cnicExpiryDate,
        e.day_off as dayOff,
        e.professional_email as professionalEmail,
        e.branch,
        e.username
      FROM employee e
      LEFT JOIN designation d ON e.designation_id = d.id
      LEFT JOIN department dept ON e.emp_department_id = dept.id
      LEFT JOIN employee rm ON e.reporting_manager = rm.id
      LEFT JOIN grades g ON e.emp_grade_id = g.id
      WHERE e.id = ${employeeId}
      LIMIT 1
    ` as any[]

    if (employee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const employeeData = employee[0]

    console.log('Raw employee data from database:', employeeData)
    console.log('Gender value from DB:', employeeData.gender, 'Type:', typeof employeeData.gender)

    // Format the response
    const formattedEmployee = {
      id: employeeData.id.toString(),
      empId: employeeData.emp_id,
      name: employeeData.name,
      email: employeeData.email || 'N/A',
      phone: employeeData.phone || 'N/A',
      designation: employeeData.designation,
      designationId: employeeData.designation_id || null,
      department: employeeData.department,
      departmentId: employeeData.emp_department_id || null,
      reportingManager: employeeData.reporting_manager_name,
      reportingManagerId: employeeData.reporting_manager,
      gradeId: employeeData.emp_grade_id || null,
      gradeName: employeeData.grade_name || 'N/A',
      joiningDate: employeeData.joiningDate,
      salary: Number(employeeData.salary),
      status: employeeData.status === 1 ? 'Active' : 'Inactive',
      gender: Number(employeeData.gender) === 1 ? 'Male' : Number(employeeData.gender) === 2 ? 'Female' : `N/A (${employeeData.gender})`,
      address: employeeData.address || 'N/A',
      permanentAddress: employeeData.permanentAddress || 'N/A',
      maritalStatus: employeeData.maritalStatus === 1 ? 'Married' : 'Single',
      nationality: employeeData.nationality || 'N/A',
      cnic: employeeData.cnic || 'N/A',
      bankAccount: employeeData.bankAccount || 'N/A',
      accountTitle: employeeData.accountTitle || 'N/A',
      fatherName: employeeData.fatherName || 'N/A',
      dateOfBirth: employeeData.dateOfBirth,
      dateOfLeaving: employeeData.dateOfLeaving,
      probationExpireDate: employeeData.probationExpireDate,
      cnicExpiryDate: employeeData.cnicExpiryDate,
      dayOff: employeeData.dayOff || 'N/A',
      professionalEmail: employeeData.professionalEmail || 'N/A',
      branch: employeeData.branch || 'N/A',
      username: employeeData.username || 'N/A'
    }

    return NextResponse.json(formattedEmployee)
  } catch (error: any) {
    console.error('❌ Error fetching employee details:', error)

    // Handle specific Prisma errors
    if (error?.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch employee details' },
      { status: 500 }
    )
  } finally {
    // Ensure connections are properly cleaned up
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employeeId = parseInt(id)
    const updateData = await request.json()

    console.log('Received update data:', updateData)
    console.log('Employee ID:', employeeId)

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure proper connection handling
    const result = await prisma.$transaction(async (tx) => {
      // Format joining date for MySQL
      let formattedJoiningDate = null
      if (updateData.joiningDate) {
        const date = new Date(updateData.joiningDate)
        formattedJoiningDate = date.toISOString().split('T')[0]
      }

      console.log('Executing SQL update...')

      // Update employee data using raw SQL
      const updateResult = await tx.$executeRaw`
        UPDATE employee
        SET
          emp_name = ${updateData.name},
          emp_email = ${updateData.email || 'N/A'},
          emp_contact_no = ${updateData.phone || 'N/A'},
          designation_id = ${Number(updateData.designationId) || null},
          emp_department_id = ${Number(updateData.departmentId) || null},
          reporting_manager = ${Number(updateData.reportingManagerId) || null},
          emp_salary = ${Number(updateData.salary)},
          status = ${updateData.status === 'Active' ? 1 : 0},
          emp_gender = ${Number(updateData.gender) || 1},
          residential_address = ${updateData.address || 'N/A'},
          permanent_address = ${updateData.permanentAddress || 'N/A'},
          emp_marital_status = ${updateData.maritalStatus === 'Married' ? 1 : 0},
          nationality = ${updateData.nationality || 'N/A'},
          emp_cnic = ${updateData.cnic || 'N/A'},
          bank_account = ${updateData.bankAccount || 'N/A'},
          account_title = ${updateData.accountTitle || 'N/A'},
          emp_joining_date = ${formattedJoiningDate}
        WHERE id = ${employeeId}
      `

      console.log('Update result:', updateResult)

      // Fetch the updated employee to return the latest data
      const employee = await tx.$queryRaw`
        SELECT
          e.id,
          e.emp_id,
          e.emp_name as name,
          e.emp_email as email,
          e.emp_contact_no as phone,
          e.designation_id,
          COALESCE(d.designation_name, 'Unknown') as designation,
          e.emp_department_id,
          COALESCE(dept.department_name, 'Unknown') as department,
          e.reporting_manager,
          COALESCE(rm.emp_name, 'N/A') as reporting_manager_name,
          e.emp_grade_id,
          COALESCE(g.employee_grade_type, 'N/A') as grade_name,
          e.emp_joining_date as joiningDate,
          e.emp_salary as salary,
          e.status,
          e.emp_gender as gender,
          e.residential_address as address,
          e.permanent_address as permanentAddress,
          e.emp_marital_status as maritalStatus,
          e.nationality,
          e.emp_cnic as cnic,
          e.bank_account as bankAccount,
          e.account_title as accountTitle
        FROM employee e
        LEFT JOIN designation d ON e.designation_id = d.id
        LEFT JOIN department dept ON e.emp_department_id = dept.id
        LEFT JOIN employee rm ON e.reporting_manager = rm.id
        LEFT JOIN grades g ON e.emp_grade_id = g.id
        WHERE e.id = ${employeeId}
        LIMIT 1
      ` as any[]

      return employee
    })

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found after update' },
        { status: 404 }
      )
    }

    const employeeData = result[0]

    // Format the response
    const formattedEmployee = {
      id: employeeData.id.toString(),
      empId: employeeData.emp_id,
      name: employeeData.name,
      email: employeeData.email || 'N/A',
      phone: employeeData.phone || 'N/A',
      designation: employeeData.designation,
      designationId: employeeData.designation_id || null,
      department: employeeData.department,
      departmentId: employeeData.emp_department_id || null,
      reportingManager: employeeData.reporting_manager_name,
      reportingManagerId: employeeData.reporting_manager,
      gradeId: employeeData.emp_grade_id || null,
      gradeName: employeeData.grade_name || 'N/A',
      joiningDate: employeeData.joiningDate,
      salary: Number(employeeData.salary),
      status: employeeData.status === 1 ? 'Active' : 'Inactive',
      gender: Number(employeeData.gender) === 1 ? 'Male' : Number(employeeData.gender) === 2 ? 'Female' : `N/A (${employeeData.gender})`,
      address: employeeData.address || 'N/A',
      permanentAddress: employeeData.permanentAddress || 'N/A',
      maritalStatus: employeeData.maritalStatus === 1 ? 'Married' : 'Single',
      nationality: employeeData.nationality || 'N/A',
      cnic: employeeData.cnic || 'N/A',
      bankAccount: employeeData.bankAccount || 'N/A',
      accountTitle: employeeData.accountTitle || 'N/A'
    }

    console.log('✅ Employee update successful')
    return NextResponse.json(formattedEmployee)
  } catch (error: any) {
    console.error('❌ Error updating employee:', error)

    // Handle specific Prisma errors
    if (error?.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  } finally {
    // Ensure connections are properly cleaned up
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}
