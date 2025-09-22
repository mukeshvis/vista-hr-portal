import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'

interface CountResult {
  count: bigint | number
}

interface DepartmentResult {
  id: number
  department_name: string
}

export async function GET() {
  try {
    // Get total employee count
    const totalEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM employee
    ` as CountResult[]

    // Get active employees count (status = 1)
    const activeEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM employee WHERE status = 1
    ` as CountResult[]

    // Get today's attendance statistics (if attendance table exists)
    // For now, we'll calculate based on employee status
    const presentToday = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM employee WHERE status = 1
    ` as CountResult[]

    // Get departments count and list from department table (all departments)
    const departmentsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM department
    ` as CountResult[]

    // Get all department names (including inactive)
    const departmentsList = await prisma.$queryRaw`
      SELECT id, department_name FROM department ORDER BY department_name ASC
    ` as DepartmentResult[]

    // Calculate some basic stats
    const totalCount = Number(totalEmployees[0]?.count || 0)
    const activeCount = Number(activeEmployees[0]?.count || 0)
    const presentCount = Number(presentToday[0]?.count || 0)
    const deptCount = Number(departmentsCount[0]?.count || 0)

    // Calculate attendance percentage
    const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0.0'

    // Format departments list
    const formattedDepartments = departmentsList.map((dept: DepartmentResult) => ({
      id: dept.id,
      name: dept.department_name
    }))

    // Mock some additional stats for now (can be enhanced later)
    const stats = {
      totalEmployees: totalCount,
      activeEmployees: activeCount,
      presentToday: presentCount,
      attendancePercentage: `${attendancePercentage}%`,
      departments: deptCount,
      departmentsList: formattedDepartments,
      // Mock data for other metrics (can be calculated from actual tables later)
      absent: Math.max(0, totalCount - presentCount),
      lateToday: Math.floor(totalCount * 0.05), // 5% assumption
      onLeave: Math.floor(totalCount * 0.02), // 2% assumption
      pendingLeaves: Math.floor(totalCount * 0.02), // 2% assumption
      payrollAmount: totalCount * 50000 // Rough estimate
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    // Return fallback data if database query fails
    return NextResponse.json({
      totalEmployees: 0,
      activeEmployees: 0,
      presentToday: 0,
      attendancePercentage: '0.0%',
      departments: 0,
      departmentsList: [],
      absent: 0,
      lateToday: 0,
      onLeave: 0,
      pendingLeaves: 0,
      payrollAmount: 0
    })
  }
}