import { NextResponse } from "next/server"
import { prisma } from "@/lib/database/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  try {
    // Fetch all users excluding completely deleted ones (status != -1)
    const users = await prisma.users.findMany({
      where: {
        status: { not: -1 }
      },
      select: {
        id: true,
        emp_id: true,
        name: true,
        username: true,
        email: true,
        password: true,
        acc_type: true,
        status: true
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json(users)

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { emp_id, acc_type, name, username, email, password, status } = body

    // Validate required fields
    if (!emp_id || !acc_type || !name || !username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findFirst({
      where: {
        username: username.trim(),
        status: { not: -1 }
      }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.users.findFirst({
      where: {
        email: email.trim(),
        status: { not: -1 }
      }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        emp_id: emp_id.trim(),
        acc_type: acc_type,
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password: hashedPassword,
        status: status || 1,
        remember_token: '',
        updated_at: new Date(),
        created_at: new Date(),
        company_id: 12, // Default company ID
        dbName: '', // You can make this dynamic
        role_no: acc_type === 'admin' ? '1' : '2'
      }
    })

    console.log('✅ New user created:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      },
      message: "User added successfully"
    })

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, emp_id, acc_type, name, username, email, password, status } = body

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!emp_id || !acc_type || !name || !username || !email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if username already exists (excluding current user)
    const existingUsername = await prisma.users.findFirst({
      where: {
        username: username.trim(),
        status: { not: -1 },
        id: { not: parseInt(id) }
      }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Check if email already exists (excluding current user)
    const existingEmail = await prisma.users.findFirst({
      where: {
        email: email.trim(),
        status: { not: -1 },
        id: { not: parseInt(id) }
      }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      )
    }

    // Prepare update data
    const updateData: any = {
      emp_id: emp_id.trim(),
      acc_type: acc_type,
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      status: status || 1,
      updated_at: new Date(),
      role_no: acc_type === 'admin' ? '1' : '2'
    }

    // Only update password if a new one is provided (not empty)
    if (password && password.trim() !== '') {
      // Hash the new password with bcrypt
      updateData.password = await bcrypt.hash(password, 10)
    }
    // If password is empty or undefined, don't update it (keep existing password in database)

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    console.log('✅ User updated:', {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email
      },
      message: "User updated successfully"
    })

  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Soft delete by setting status to -1 (deleted)
    const deletedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        status: -1,
        updated_at: new Date()
      }
    })

    console.log('✅ User deleted (soft delete):', {
      id: deletedUser.id,
      username: deletedUser.username
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
