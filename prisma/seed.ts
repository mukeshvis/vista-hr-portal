import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting password migration...')

  try {
    // Get all users with plain text passwords (assuming they don't start with $2)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { password: { not: { startsWith: '$2' } } },
          { status: 1 }
        ]
      }
    })

    console.log(`📊 Found ${users.length} users with plain text passwords`)

    for (const user of users) {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 12)

        // Update the user
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })

        console.log(`✅ Updated password for user: ${user.username}`)
      } catch (error) {
        console.error(`❌ Failed to update password for user ${user.username}:`, error)
      }
    }

    // Create a default admin user if none exists
    const adminExists = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin@company.com' }
        ]
      }
    })

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12)

      await prisma.user.create({
        data: {
          emp_id: 'EMP001',
          acc_type: 'admin',
          name: 'System Administrator',
          username: 'admin',
          email: 'admin@company.com',
          password: hashedPassword,
          status: 1,
          remember_token: '',
          company_id: 1,
          dbName: 'hr_system',
          role_no: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log('✅ Created default admin user (username: admin, password: admin123)')
    }

    console.log('🎉 Password migration completed successfully!')

  } catch (error) {
    console.error('❌ Password migration failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })