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
    // Get total employee count from external_employees (attendance system)
    const totalEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM external_employees
    ` as CountResult[]

    // Get total employees from external_employees (attendance system)
    const activeEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM external_employees
    ` as CountResult[]

    // Get today's attendance statistics from user_attendance table
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    // Get distinct employees who checked in today
    const presentToday = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_attendance
      WHERE state = 'Check In'
      AND punch_time >= ${todayStart}
      AND punch_time <= ${todayEnd}
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

    // Calculate absent count (active employees - present today)
    const absentCount = Math.max(0, activeCount - presentCount)

    // Calculate attendance percentage based on active employees
    const attendancePercentage = activeCount > 0 ? ((presentCount / activeCount) * 100).toFixed(1) : '0.0'

    // Format departments list
    const formattedDepartments = departmentsList.map((dept: DepartmentResult) => ({
      id: dept.id,
      name: dept.department_name
    }))

    // Dashboard stats
    const stats = {
      totalEmployees: totalCount,
      activeEmployees: activeCount,
      presentToday: presentCount,
      attendancePercentage: `${attendancePercentage}%`,
      departments: deptCount,
      departmentsList: formattedDepartments,
      absent: absentCount, // Real absent count (active employees - present today)
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