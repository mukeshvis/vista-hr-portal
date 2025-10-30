const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testQuery() {
  try {
    console.log('🔍 Testing employee query...\n')

    // Test 1: Total active employees
    const totalEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM employee
      WHERE status = 1
      AND emp_id IS NOT NULL
      AND emp_id != ''
    `
    console.log('1️⃣ Total active employees:', totalEmployees[0].total)

    // Test 2: Employees with employment status
    const withEmploymentStatus = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM employee e
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      AND es.id IS NOT NULL
    `
    console.log('2️⃣ Employees with employment status:', withEmploymentStatus[0].total)

    // Test 3: Check job_type_name values
    const jobTypes = await prisma.$queryRaw`
      SELECT DISTINCT es.job_type_name, COUNT(*) as count
      FROM employee e
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      GROUP BY es.job_type_name
    `
    console.log('3️⃣ Job types in database:')
    jobTypes.forEach(jt => {
      console.log(`   - "${jt.job_type_name}" : ${jt.count} employees`)
    })

    // Test 4: Permanent employees (case-insensitive)
    const permanentEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM employee e
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      AND LOWER(es.job_type_name) = 'permanent'
    `
    console.log('4️⃣ Permanent employees (LOWER match):', permanentEmployees[0].total)

    // Test 5: Sample of employees with their status
    const sampleEmployees = await prisma.$queryRaw`
      SELECT
        e.emp_id,
        e.emp_name,
        es.job_type_name,
        e.emp_employementstatus_id,
        es.id as status_table_id
      FROM employee e
      LEFT JOIN emp_empstatus es ON e.emp_employementstatus_id = es.id
      WHERE e.status = 1
      AND e.emp_id IS NOT NULL
      AND e.emp_id != ''
      LIMIT 10
    `
    console.log('\n5️⃣ Sample employees:')
    sampleEmployees.forEach(emp => {
      console.log(`   - ${emp.emp_id} | ${emp.emp_name} | Status: "${emp.job_type_name}" | Status ID: ${emp.emp_employementstatus_id} -> ${emp.status_table_id}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testQuery()
