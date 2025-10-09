import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Seeding leave types...')

  const leaveTypes = [
    { leave_type_name: 'Annual Leave', status: 1 },
    { leave_type_name: 'Sick Leave', status: 1 },
    { leave_type_name: 'Emergency Leave', status: 1 },
    { leave_type_name: 'Casual Leave', status: 1 },
    { leave_type_name: 'Medical Leave', status: 1 },
  ]

  for (const leaveType of leaveTypes) {
    const exists = await prisma.leave_type.findFirst({
      where: { leave_type_name: leaveType.leave_type_name }
    })

    if (!exists) {
      await prisma.leave_type.create({
        data: {
          ...leaveType,
          username: 'admin',
          date: new Date(),
          time: new Date().toLocaleTimeString(),
          company_id: 1
        }
      })
      console.log(`✅ Created leave type: ${leaveType.leave_type_name}`)
    } else {
      console.log(`⏭️  Leave type already exists: ${leaveType.leave_type_name}`)
    }
  }

  console.log('🎉 Leave types seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
