const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const designations = [
  'Sr Web Developer',
  'Jr Developer',
  'Intern Developer',
  'Graphic Designer',
  'President & CEO',
  'Deputy CEO',
  'Advisors / Consultants',
  'Executive Directors / Directors',
  'Senior Manager',
  'Manager',
  'Assistant Manager',
  'Junior Manager',
  'Internee',
  'Officers',
  'Executive Secretary/ Assistant',
  'Receptionist / Operator',
  'Office Boy',
  'Driver',
  'Janitorial',
  'Watchman',
  'Group Head',
  'IT Assistant',
  'Software Developer',
  'Senior Assistant Manager',
  'Accounts Officer',
  'Data Entry Operator',
  'Network Assistant',
  'Financial Analyst',
  'Manager Software Development',
  'Assistant Data Entry & Scanning',
  'Data Operator',
  'Assistant',
  'Group Manager',
  'Maintenance Support',
  'Group Head- CB/DFIs',
  'Database Assistant',
  'Group Head Research & Development',
  'Manager Analytics',
  'Director Analytics',
  'Data Analyst'
]

async function seedDesignations() {
  try {
    console.log('🌱 Starting to seed designations...')

    // Clear existing designations (optional)
    await prisma.designation.deleteMany()

    // Insert new designations
    for (const designation_name of designations) {
      await prisma.designation.create({
        data: {
          designation_name,
          status: 1,
          username: 'system',
          date: new Date(),
          time: new Date().toTimeString().split(' ')[0]
        }
      })
    }

    console.log(`✅ Successfully seeded ${designations.length} designations`)
  } catch (error) {
    console.error('❌ Error seeding designations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDesignations()