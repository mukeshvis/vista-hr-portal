"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface NotificationHandlerProps {
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onRefresh: () => void
  currentEmpId: string | null
  fetchApplications: (empId: string) => void
  fetchAllApplications: () => void
  fetchPendingApplications: () => void
  fetchManagerApplications: (empId: string) => void
}

export function NotificationHandler({
  onSuccess,
  onError,
  onRefresh,
  currentEmpId,
  fetchApplications,
  fetchAllApplications,
  fetchPendingApplications,
  fetchManagerApplications,
}: NotificationHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const notification = searchParams.get('notification')
    const action = searchParams.get('action')
    const role = searchParams.get('role')
    const employee = searchParams.get('employee')
    const message = searchParams.get('message')

    console.log('🔍 Email Approval Debug:', {
      notification,
      action,
      role,
      employee,
      message,
      allParams: Object.fromEntries(searchParams.entries())
    })

    if (notification === 'success' && action && role) {
      console.log('✅ Success notification detected!')
      const roleText = role === 'manager' ? 'Manager' : 'HR'
      const actionText = action === 'approved' ? 'approved' : 'rejected'
      const employeeName = employee ? decodeURIComponent(employee) : 'Employee'

      const popupMessage = `Leave application ${actionText} successfully by ${roleText} for ${employeeName}`
      console.log('📝 Setting popup message:', popupMessage)
      onSuccess(popupMessage)

      // Refresh data
      if (currentEmpId) {
        fetchApplications(currentEmpId)
        fetchAllApplications()
        fetchPendingApplications()
        if (role === 'manager') {
          fetchManagerApplications(currentEmpId)
        }
      }

      // Clear URL parameters after a delay to ensure popup shows
      setTimeout(() => {
        console.log('🧹 Clearing URL parameters')
        router.replace('/leaves', { scroll: false })
      }, 100)
    } else if (notification === 'error' && message) {
      console.log('❌ Error notification detected!')
      onError(decodeURIComponent(message))

      // Clear URL parameters
      setTimeout(() => {
        router.replace('/leaves', { scroll: false })
      }, 100)
    }
  }, [searchParams, currentEmpId, router, onSuccess, onError, fetchApplications, fetchAllApplications, fetchPendingApplications, fetchManagerApplications])

  return null // This component doesn't render anything
}
