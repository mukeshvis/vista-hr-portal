import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ==================== QUERY KEYS ====================
// Centralized query keys for easy cache management
export const leavesKeys = {
  all: ['leaves'] as const,
  types: () => [...leavesKeys.all, 'types'] as const,
  applications: (empId?: string, year?: number) =>
    [...leavesKeys.all, 'applications', empId, year] as const,
  allApplications: (year?: number) =>
    [...leavesKeys.all, 'all-applications', year] as const,
  pendingApplications: () =>
    [...leavesKeys.all, 'pending-applications'] as const,
  managerApplications: (managerId?: string) =>
    [...leavesKeys.all, 'manager-applications', managerId] as const,
  employeeBalances: (year?: number) =>
    [...leavesKeys.all, 'employee-balances', year] as const,
  employeeRemoteBalances: (month?: string) =>
    [...leavesKeys.all, 'employee-remote-balances', month] as const,
  remoteApplications: (type: 'my' | 'all' | 'pending', empId?: string) =>
    [...leavesKeys.all, 'remote-applications', type, empId] as const,
  managerRemoteApplications: (managerId?: string) =>
    [...leavesKeys.all, 'manager-remote-applications', managerId] as const,
  remoteValidation: (empId?: string) =>
    [...leavesKeys.all, 'remote-validation', empId] as const,
  employeeManager: (empId?: string) =>
    [...leavesKeys.all, 'employee-manager', empId] as const,
}

// ==================== FETCHER FUNCTIONS ====================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`)
  }
  return res.json()
}

// ==================== HOOKS ====================

/**
 * Fetch leave types
 */
export function useLeaveTypes() {
  return useQuery({
    queryKey: leavesKeys.types(),
    queryFn: () => fetcher('/api/leaves/types'),
  })
}

/**
 * Fetch applications for a specific employee and year
 */
export function useApplications(empId?: string, year?: number) {
  return useQuery({
    queryKey: leavesKeys.applications(empId, year),
    queryFn: () => {
      const url = empId
        ? `/api/leaves/applications?empId=${empId}&year=${year}`
        : `/api/leaves/applications?year=${year}`
      return fetcher(url)
    },
    enabled: !!empId || !!year, // Only fetch if we have an empId or year
  })
}

/**
 * Fetch all applications for a specific year
 */
export function useAllApplications(year?: number) {
  return useQuery({
    queryKey: leavesKeys.allApplications(year),
    queryFn: () => fetcher(`/api/leaves/applications?year=${year}`),
    enabled: !!year,
  })
}

/**
 * Fetch pending applications (status = 0)
 */
export function usePendingApplications() {
  return useQuery({
    queryKey: leavesKeys.pendingApplications(),
    queryFn: () => fetcher('/api/leaves/applications?status=0'),
  })
}

/**
 * Fetch manager approval applications
 */
export function useManagerApplications(managerId?: string) {
  return useQuery({
    queryKey: leavesKeys.managerApplications(managerId),
    queryFn: () => {
      const url = managerId
        ? `/api/leaves/manager-approvals?managerId=${managerId}`
        : `/api/leaves/manager-approvals`
      return fetcher(url)
    },
  })
}

/**
 * Fetch employee leave balances for a specific year
 */
export function useEmployeeBalances(year?: number) {
  return useQuery({
    queryKey: leavesKeys.employeeBalances(year),
    queryFn: () => fetcher(`/api/leaves/employees-balance?year=${year}`),
    enabled: !!year,
  })
}

/**
 * Fetch employee remote work balances for a specific month
 */
export function useEmployeeRemoteBalances(month?: string) {
  return useQuery({
    queryKey: leavesKeys.employeeRemoteBalances(month),
    queryFn: () => fetcher(`/api/remote-work/employee-balances?month=${month}`),
    enabled: !!month,
  })
}

/**
 * Fetch remote work applications by type
 */
export function useRemoteApplications(type: 'my' | 'all' | 'pending', empId?: string) {
  return useQuery({
    queryKey: leavesKeys.remoteApplications(type, empId),
    queryFn: () => {
      let url = `/api/remote-work/applications?type=${type}`
      if (type === 'my' && empId) {
        url += `&empId=${empId}`
      }
      return fetcher(url)
    },
  })
}

/**
 * Fetch manager remote work applications
 */
export function useManagerRemoteApplications(managerId?: string) {
  return useQuery({
    queryKey: leavesKeys.managerRemoteApplications(managerId),
    queryFn: () => {
      const url = managerId
        ? `/api/remote-work/manager-approvals?managerId=${managerId}`
        : `/api/remote-work/manager-approvals`
      return fetcher(url)
    },
  })
}

/**
 * Fetch remote work validation for an employee
 */
export function useRemoteValidation(empId?: string) {
  return useQuery({
    queryKey: leavesKeys.remoteValidation(empId),
    queryFn: () => {
      const url = empId
        ? `/api/remote-work/validate?empId=${empId}`
        : `/api/remote-work/validate`
      return fetcher(url)
    },
    enabled: !!empId,
  })
}

/**
 * Fetch employee manager information
 */
export function useEmployeeManager(empId?: string) {
  return useQuery({
    queryKey: leavesKeys.employeeManager(empId),
    queryFn: () => fetcher(`/api/leaves/employee-info?empId=${empId}`),
    enabled: !!empId,
  })
}

// ==================== MUTATIONS ====================
// You can add mutation hooks here for creating/updating/deleting leaves
// Example:
// export function useCreateLeaveApplication() {
//   const queryClient = useQueryClient()
//   return useMutation({
//     mutationFn: (data: CreateLeaveData) =>
//       fetch('/api/leaves/applications', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       }).then(res => res.json()),
//     onSuccess: () => {
//       // Invalidate and refetch relevant queries
//       queryClient.invalidateQueries({ queryKey: leavesKeys.all })
//     },
//   })
// }
