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
        e.active as status,
        e.emp_gender as gender,
        e.residential_address as address,
        e.permanent_address as permanentAddress,
        e.emp_marital_status as maritalStatusId,
        COALESCE(ms.marital_status_name, 'Unknown') as maritalStatus,
        e.emp_employementstatus_id as employmentStatusId,
        COALESCE(es.job_type_name, 'Unknown') as employmentStatus,
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
        e.username,
        e.working_hours_policy_id,
        e.leaves_policy_id,
        COALESCE(lp.leaves_policy_name, 'N/A') as leave_policy_name
      FROM employee e
      LEFT JOIN designation d ON e.designation_id = d.id
      LEFT JOIN department dept ON e.emp_department_id = dept.id
      LEFT JOIN employee rm ON e.reporting_manager = rm.id
      LEFT JOIN grades g ON e.emp_grade_id = g.id
      LEFT JOIN leaves_policy lp ON e.leaves_policy_id = lp.id
      LEFT JOIN marital_status ms ON e.emp_marital_status = ms.id
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
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
    console.log('Status value from DB:', employeeData.status, 'Type:', typeof employeeData.status)
    console.log('Status === 1?', employeeData.status === 1)
    console.log('Status == 1?', employeeData.status == 1)

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
      status: (employeeData.status === 1 || employeeData.status === '1') ? 'Active' : 'Inactive',
      gender: Number(employeeData.gender) === 1 ? 'Male' : Number(employeeData.gender) === 2 ? 'Female' : `N/A (${employeeData.gender})`,
      address: employeeData.address || 'N/A',
      permanentAddress: employeeData.permanentAddress || 'N/A',
      maritalStatus: employeeData.maritalStatus,
      maritalStatusId: employeeData.maritalStatusId,
      employmentStatus: employeeData.employmentStatus || 'N/A',
      employmentStatusId: employeeData.employmentStatusId,
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
      username: employeeData.username || 'N/A',
      workingHoursPolicy: employeeData.working_hours_policy_id ? employeeData.working_hours_policy_id.toString() : 'N/A',
      leavePolicy: employeeData.leave_policy_name || 'N/A',
      grade: employeeData.grade_name || 'N/A'
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
      // Format dates for MySQL
      let formattedJoiningDate = null
      if (updateData.joiningDate) {
        const date = new Date(updateData.joiningDate)
        formattedJoiningDate = date.toISOString().split('T')[0]
      }

      let formattedDateOfBirth = null
      if (updateData.dateOfBirth) {
        const date = new Date(updateData.dateOfBirth)
        formattedDateOfBirth = date.toISOString().split('T')[0]
      }

      let formattedCnicExpiryDate = null
      if (updateData.cnicExpiryDate) {
        const date = new Date(updateData.cnicExpiryDate)
        formattedCnicExpiryDate = date.toISOString().split('T')[0]
      } else {
        // Provide default date if not provided (required by database)
        formattedCnicExpiryDate = '2030-12-31' // Default future date
      }

      let formattedProbationExpireDate = null
      if (updateData.probationExpireDate) {
        const date = new Date(updateData.probationExpireDate)
        formattedProbationExpireDate = date.toISOString().split('T')[0]
      }

      let formattedDateOfLeaving = null
      if (updateData.dateOfLeaving) {
        const date = new Date(updateData.dateOfLeaving)
        formattedDateOfLeaving = date.toISOString().split('T')[0]
      }

      // Handle department update
      let departmentId = updateData.departmentId
      if (updateData.department && !departmentId) {
        // Find or create department record
        const existingDepartment = await tx.$queryRaw`
          SELECT id FROM department WHERE department_name = ${updateData.department} LIMIT 1
        ` as any[]

        if (existingDepartment.length > 0) {
          departmentId = existingDepartment[0].id
        } else {
          // Create new department if it doesn't exist
          await tx.$executeRaw`
            INSERT INTO department (department_name, status, username, date, time, branch_id)
            VALUES (${updateData.department}, 1, 'system', ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]}, 1)
          `

          const newDepartment = await tx.$queryRaw`
            SELECT id FROM department WHERE department_name = ${updateData.department} ORDER BY id DESC LIMIT 1
          ` as any[]

          if (newDepartment.length > 0) {
            departmentId = newDepartment[0].id
          }
        }
      }

      // Handle grade update
      let gradeId = null
      if (updateData.grade && updateData.designationId) {
        // Create or update grade record
        const designationId = parseInt(updateData.designationId)

        await tx.$executeRaw`
          INSERT INTO grades (employee_grade_type, designation_id, status, date, time)
          VALUES (${updateData.grade}, ${designationId}, 1, ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]})
        `

        const newGrade = await tx.$queryRaw`
          SELECT id FROM grades WHERE employee_grade_type = ${updateData.grade} AND designation_id = ${designationId} ORDER BY id DESC LIMIT 1
        ` as any[]

        if (newGrade.length > 0) {
          gradeId = newGrade[0].id
        }
      }

      // Handle leave policy
      let leavePolicyId = null
      if (updateData.leavePolicy) {
        const existingLeavePolicy = await tx.$queryRaw`
          SELECT id FROM leaves_policy WHERE leaves_policy_name = ${updateData.leavePolicy} LIMIT 1
        ` as any[]

        if (existingLeavePolicy.length > 0) {
          leavePolicyId = existingLeavePolicy[0].id
        }
      }

      // If no leave policy found, set a default one (required by database)
      if (!leavePolicyId) {
        const defaultLeavePolicy = await tx.$queryRaw`
          SELECT id FROM leaves_policy ORDER BY id ASC LIMIT 1
        ` as any[]

        if (defaultLeavePolicy.length > 0) {
          leavePolicyId = defaultLeavePolicy[0].id
        } else {
          // Create a default leave policy if none exists
          await tx.$executeRaw`
            INSERT INTO leaves_policy (leaves_policy_name, status, username, date, time)
            VALUES ('Default Policy', 1, 'system', ${new Date().toISOString().split('T')[0]}, ${new Date().toTimeString().split(' ')[0]})
          `

          const newLeavePolicy = await tx.$queryRaw`
            SELECT id FROM leaves_policy ORDER BY id DESC LIMIT 1
          ` as any[]

          if (newLeavePolicy.length > 0) {
            leavePolicyId = newLeavePolicy[0].id
          }
        }
      }

      // Handle marital status
      let maritalStatusId = 7 // Default to Single (ID 7)
      if (updateData.maritalStatus) {
        // Find existing marital status by name
        const existingMaritalStatus = await tx.$queryRaw`
          SELECT id FROM marital_status WHERE marital_status_name = ${updateData.maritalStatus} AND status = 1 LIMIT 1
        ` as any[]

        if (existingMaritalStatus.length > 0) {
          maritalStatusId = existingMaritalStatus[0].id
        }
      } else if (updateData.maritalStatusId) {
        // Use provided marital status ID
        maritalStatusId = parseInt(updateData.maritalStatusId)
      }

      console.log('Executing SQL update...')

      // Update employee data using raw SQL with all fields
      const updateResult = await tx.$executeRaw`
        UPDATE employee
        SET
          emp_name = ${updateData.name},
          emp_email = ${updateData.email || 'N/A'},
          emp_contact_no = ${updateData.phone || 'N/A'},
          designation_id = ${Number(updateData.designationId) || null},
          emp_department_id = ${Number(departmentId) || null},
          reporting_manager = ${Number(updateData.reportingManagerId) || null},
          emp_grade_id = ${gradeId},
          working_hours_policy_id = ${updateData.workingHoursPolicy ? parseInt(updateData.workingHoursPolicy) : null},
          leaves_policy_id = ${leavePolicyId},
          emp_salary = ${Number(updateData.salary)},
          active = ${updateData.status === 'Active' ? 1 : 0},
          emp_gender = ${updateData.gender === 'Male' ? 1 : updateData.gender === 'Female' ? 2 : Number(updateData.gender) || 1},
          residential_address = ${updateData.address || 'N/A'},
          permanent_address = ${updateData.permanentAddress || 'N/A'},
          emp_marital_status = ${maritalStatusId},
          emp_employementstatus_id = ${updateData.employmentStatus ? parseInt(updateData.employmentStatus) : null},
          nationality = ${updateData.nationality || 'N/A'},
          emp_cnic = ${updateData.cnic || 'N/A'},
          emp_cnic_expiry_date = ${formattedCnicExpiryDate},
          bank_account = ${updateData.bankAccount || 'N/A'},
          account_title = ${updateData.accountTitle || 'N/A'},
          emp_joining_date = ${formattedJoiningDate},
          emp_father_name = ${updateData.fatherName || 'N/A'},
          emp_date_of_birth = ${formattedDateOfBirth},
          probation_expire_date = ${formattedProbationExpireDate},
          date_of_leaving = ${formattedDateOfLeaving},
          day_off = ${updateData.dayOff || 'Sunday'},
          professional_email = ${updateData.professionalEmail || 'N/A'},
          branch = ${updateData.branch || 'Main'},
          username = ${updateData.username || updateData.empId || 'N/A'}
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
          e.active as status,
          e.emp_gender as gender,
          e.residential_address as address,
          e.permanent_address as permanentAddress,
          e.emp_marital_status as maritalStatusId,
          COALESCE(ms.marital_status_name, 'Unknown') as maritalStatus,
          e.nationality,
          e.emp_cnic as cnic,
          e.bank_account as bankAccount,
          e.account_title as accountTitle,
          e.emp_father_name as fatherName,
          e.emp_date_of_birth as dateOfBirth,
          e.probation_expire_date as probationExpireDate,
          e.date_of_leaving as dateOfLeaving,
          e.emp_cnic_expiry_date as cnicExpiryDate,
          e.day_off as dayOff,
          e.professional_email as professionalEmail,
          e.branch,
          e.username,
          e.working_hours_policy_id,
          e.leaves_policy_id,
          COALESCE(lp.leaves_policy_name, 'N/A') as leave_policy_name
        FROM employee e
        LEFT JOIN designation d ON e.designation_id = d.id
        LEFT JOIN department dept ON e.emp_department_id = dept.id
        LEFT JOIN employee rm ON e.reporting_manager = rm.id
        LEFT JOIN grades g ON e.emp_grade_id = g.id
        LEFT JOIN leaves_policy lp ON e.leaves_policy_id = lp.id
        LEFT JOIN marital_status ms ON e.emp_marital_status = ms.id
        LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
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
      status: (employeeData.status === 1 || employeeData.status === '1') ? 'Active' : 'Inactive',
      gender: Number(employeeData.gender) === 1 ? 'Male' : Number(employeeData.gender) === 2 ? 'Female' : `N/A (${employeeData.gender})`,
      address: employeeData.address || 'N/A',
      permanentAddress: employeeData.permanentAddress || 'N/A',
      maritalStatus: employeeData.maritalStatus,
      maritalStatusId: employeeData.maritalStatusId,
      employmentStatus: employeeData.employmentStatus || 'N/A',
      employmentStatusId: employeeData.employmentStatusId,
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
      username: employeeData.username || 'N/A',
      workingHoursPolicy: employeeData.working_hours_policy_id ? employeeData.working_hours_policy_id.toString() : 'N/A',
      leavePolicy: employeeData.leave_policy_name || 'N/A',
      grade: employeeData.grade_name || 'N/A'
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
