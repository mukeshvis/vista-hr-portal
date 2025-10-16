import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateEmployeeTiming() {
  try {
    console.log('🔄 Starting employee timing update...')

    // Employee pin_auto IDs that need 8 AM to 6 PM timing
    const targetPinAutos = ['13', '14', '45', '1691479623873', '1691479623595']

    // Step 1: Find or create the 8 AM to 6 PM working hours policy
    let policy = await prisma.working_hours_policy.findFirst({
      where: {
        start_working_hours_time: '08:00',
        end_working_hours_time: '18:00',
        status: 1
      }
    })

    if (!policy) {
      console.log('📝 Creating new 8 AM to 6 PM working hours policy...')
      policy = await prisma.working_hours_policy.create({
        data: {
          company_id: 1,
          working_hours_policy: '8 AM to 6 PM (10 hours)',
          repoting_time: '08:00',
          start_working_hours_time: '08:00',
          end_working_hours_time: '18:00',
          working_hours_grace_time: 15, // 15 minutes grace time
          half_day_time: '13:00',
          username: 'system',
          date: new Date(),
          time: new Date().toTimeString().split(' ')[0],
          status: 1
        }
      })
      console.log(`✅ Created policy with ID: ${policy.id}`)
    } else {
      console.log(`✅ Found existing policy with ID: ${policy.id}`)
    }

    // Step 2: Find employees with the given pin_auto IDs
    console.log('\n🔍 Finding employees with specified pin_auto IDs...')

    const externalEmployees = await prisma.external_employees.findMany({
      where: {
        pin_auto: {
          in: targetPinAutos
        }
      }
    })

    console.log(`Found ${externalEmployees.length} external employee records`)

    if (externalEmployees.length === 0) {
      console.log('⚠️ No external employees found with the given pin_auto IDs')
      return
    }

    // Step 3: Get the pin_manual IDs (which are emp_id in employee table)
    const pinManualIds = externalEmployees.map(ext => ext.pin_manual).filter(id => id)

    console.log(`\n📋 pin_manual IDs to update:`, pinManualIds)

    // Step 4: Find and update employees
    const employees = await prisma.employee.findMany({
      where: {
        emp_id: {
          in: pinManualIds as string[]
        }
      },
      select: {
        id: true,
        emp_id: true,
        emp_name: true,
        working_hours_policy_id: true
      }
    })

    console.log(`\n👥 Found ${employees.length} employees to update:`)
    employees.forEach(emp => {
      console.log(`   - ${emp.emp_name} (${emp.emp_id}) - Current Policy: ${emp.working_hours_policy_id || 'None'}`)
    })

    // Step 5: Update the working_hours_policy_id
    console.log(`\n🔄 Updating employees to use policy ID: ${policy.id}...`)

    const updateResult = await prisma.employee.updateMany({
      where: {
        emp_id: {
          in: pinManualIds as string[]
        }
      },
      data: {
        working_hours_policy_id: policy.id
      }
    })

    console.log(`✅ Updated ${updateResult.count} employees`)

    // Step 6: Verify the update
    console.log('\n✅ Verification - Updated employees:')
    const updatedEmployees = await prisma.$queryRaw`
      SELECT
        e.id,
        e.emp_id,
        e.emp_name,
        ext.pin_auto,
        e.working_hours_policy_id,
        whp.working_hours_policy,
        whp.start_working_hours_time,
        whp.end_working_hours_time
      FROM employee e
      JOIN external_employees ext ON e.emp_id = ext.pin_manual
      LEFT JOIN working_hours_policy whp ON e.working_hours_policy_id = whp.id
      WHERE ext.pin_auto IN ('13', '14', '45', '1691479623873', '1691479623595')
    ` as any[]

    console.table(updatedEmployees)

    console.log('\n✅ Employee timing update completed successfully!')

  } catch (error) {
    console.error('❌ Error updating employee timing:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateEmployeeTiming()
  .then(() => {
    console.log('\n🎉 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
