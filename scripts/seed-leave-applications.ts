import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Seeding leave applications...')

  // Get ALL active employees using raw query to avoid date issues
  const employees = await prisma.$queryRaw`
    SELECT emp_id, emp_name
    FROM employee
    WHERE status = 1 AND emp_id IS NOT NULL AND emp_id != ''
  ` as Array<{ emp_id: string; emp_name: string }>

  if (employees.length === 0) {
    console.log('⚠️  No employees found in database')
    return
  }

  // Get leave types
  const leaveTypes = await prisma.leave_type.findMany({
    where: { status: 1 }
  })

  if (leaveTypes.length === 0) {
    console.log('⚠️  No leave types found in database')
    return
  }

  console.log(`📊 Found ${employees.length} employees and ${leaveTypes.length} leave types`)

  // Create sample leave applications for ALL employees (1-2 applications per employee)
  let createdCount = 0
  let pendingCount = 0
  let approvedCount = 0

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const leaveType = leaveTypes[i % leaveTypes.length]

    // Mix of pending and approved (every 3rd application is pending)
    const isPending = i % 3 === 0

    const application = await prisma.leave_application.create({
      data: {
        emp_id: emp.emp_id,
        leave_type: leaveType.id,
        leave_day_type: 'Full Day',
        reason: `${leaveType.leave_type_name} - Personal reason`,
        leave_address: 'Home',
        approval_status: isPending ? 0 : 1,
        approval_status_lm: isPending ? 0 : 1,
        approved: isPending ? 0 : 1,
        status: 1,
        username: emp.emp_id,
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        company_id: 1
      }
    })

    // Add leave dates
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() + i + 1)
    const toDate = new Date(fromDate)
    toDate.setDate(toDate.getDate() + 2)

    await prisma.leave_application_data.create({
      data: {
        leave_application_id: application.id,
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0],
        no_of_days: 3,
        first_second_half: null,
        first_second_half_date: null
      }
    })

    createdCount++
    if (isPending) {
      pendingCount++
    } else {
      approvedCount++
    }
  }

  console.log(`✅ Created ${createdCount} leave applications`)
  console.log(`   - Pending: ${pendingCount}`)
  console.log(`   - Approved: ${approvedCount}`)

  console.log('🎉 Leave applications seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
