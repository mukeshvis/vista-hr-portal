import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ==================== TYPES ====================

interface EmployeeManagerInfo {
  emp_id: string
  emp_name: string
  reporting_manager: number | null
  manager_name: string | null
  manager_emp_id: string | null
}

export interface LeaveType {
  id: number
  leave_type_name: string
  status: number
}

export interface LeaveApplication {
  id: number
  emp_id: string
  employee_name: string
  leave_type_name: string
  leave_type_id: number
  leave_day_type: number
  reason: string
  from_date: string
  to_date: string
  no_of_days: number
  approval_status: number
  approval_status_lm: number
  approved: number
  application_date: string
  designation_name: string
  department_name: string
  first_second_half: string
  reporting_manager: number
  reporting_manager_name: string
}

export interface EmployeeLeaveBalance {
  emp_id: string
  employee_name: string
  department_name: string
  designation_name: string
  manager_name: string
  total_allocated: number
  total_used: number
  total_remaining: number
  total_applications: number
  annual_used: number
  sick_used: number
  emergency_used: number
}

export interface EmployeeRemoteBalance {
  emp_id: string
  emp_name: string
  designation_name: string
  manager_name: string
  sixMonths: {
    used: number
    limit: number
    remaining: number
    applications: any[]
  }
  oneMonth: {
    used: number
    limit: number
    remaining: number
    applications: any[]
  }
}

export interface RemoteApplication {
  id: number
  emp_id: string
  employee_name: string
  from_date: string
  to_date: string
  number_of_days: number
  date?: string
  reason: string
  application_date: string
  approval_status: number
  approved: number
  approved_by?: string
  approved_date?: string
  rejection_reason?: string
  manager_id?: number
  manager_name?: string
  status: number
}

export interface RemoteValidation {
  canApply: boolean
  reason: string
  isPermanent?: boolean
  hasExistingApplication?: boolean
  existingApplication?: any
  usage?: {
    sixMonths: {
      used: number
      limit: number
      remaining: number
      applications: any[]
    }
    oneMonth: {
      used: number
      limit: number
      remaining: number
      applications: any[]
    }
  }
}

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
  return useQuery<LeaveType[]>({
    queryKey: leavesKeys.types(),
    queryFn: () => fetcher<LeaveType[]>('/api/leaves/types'),
  })
}

/**
 * Fetch applications for a specific employee and year
 */
export function useApplications(empId?: string, year?: number) {
  return useQuery<LeaveApplication[]>({
    queryKey: leavesKeys.applications(empId, year),
    queryFn: () => {
      const url = empId
        ? `/api/leaves/applications?empId=${empId}&year=${year}`
        : `/api/leaves/applications?year=${year}`
      return fetcher<LeaveApplication[]>(url)
    },
    enabled: !!empId || !!year, // Only fetch if we have an empId or year
  })
}

/**
 * Fetch all applications for a specific year
 */
export function useAllApplications(year?: number) {
  return useQuery<LeaveApplication[]>({
    queryKey: leavesKeys.allApplications(year),
    queryFn: () => fetcher<LeaveApplication[]>(`/api/leaves/applications?year=${year}`),
    enabled: !!year,
  })
}

/**
 * Fetch pending applications (status = 0)
 */
export function usePendingApplications() {
  return useQuery<LeaveApplication[]>({
    queryKey: leavesKeys.pendingApplications(),
    queryFn: () => fetcher<LeaveApplication[]>('/api/leaves/applications?status=0'),
  })
}

/**
 * Fetch manager approval applications
 */
export function useManagerApplications(managerId?: string) {
  return useQuery<LeaveApplication[]>({
    queryKey: leavesKeys.managerApplications(managerId),
    queryFn: () => {
      const url = managerId
        ? `/api/leaves/manager-approvals?managerId=${managerId}`
        : `/api/leaves/manager-approvals`
      return fetcher<LeaveApplication[]>(url)
    },
  })
}

/**
 * Fetch employee leave balances for a specific year
 */
export function useEmployeeBalances(year?: number) {
  return useQuery<EmployeeLeaveBalance[]>({
    queryKey: leavesKeys.employeeBalances(year),
    queryFn: () => fetcher<EmployeeLeaveBalance[]>(`/api/leaves/employees-balance?year=${year}`),
    enabled: !!year,
  })
}

/**
 * Fetch employee remote work balances for a specific month
 */
export function useEmployeeRemoteBalances(month?: string) {
  return useQuery<EmployeeRemoteBalance[]>({
    queryKey: leavesKeys.employeeRemoteBalances(month),
    queryFn: () => fetcher<EmployeeRemoteBalance[]>(`/api/remote-work/employee-balances?month=${month}`),
    enabled: !!month,
  })
}

/**
 * Fetch remote work applications by type
 */
export function useRemoteApplications(type: 'my' | 'all' | 'pending', empId?: string) {
  return useQuery<RemoteApplication[]>({
    queryKey: leavesKeys.remoteApplications(type, empId),
    queryFn: () => {
      let url = `/api/remote-work/applications?type=${type}`
      if (type === 'my' && empId) {
        url += `&empId=${empId}`
      }
      return fetcher<RemoteApplication[]>(url)
    },
  })
}

/**
 * Fetch manager remote work applications
 */
export function useManagerRemoteApplications(managerId?: string) {
  return useQuery<RemoteApplication[]>({
    queryKey: leavesKeys.managerRemoteApplications(managerId),
    queryFn: () => {
      const url = managerId
        ? `/api/remote-work/manager-approvals?managerId=${managerId}`
        : `/api/remote-work/manager-approvals`
      return fetcher<RemoteApplication[]>(url)
    },
  })
}

/**
 * Fetch remote work validation for an employee
 */
export function useRemoteValidation(empId?: string) {
  return useQuery<RemoteValidation>({
    queryKey: leavesKeys.remoteValidation(empId),
    queryFn: () => {
      const url = empId
        ? `/api/remote-work/validate?empId=${empId}`
        : `/api/remote-work/validate`
      return fetcher<RemoteValidation>(url)
    },
    enabled: !!empId,
  })
}

/**
 * Fetch employee manager information
 */
export function useEmployeeManager(empId?: string) {
  return useQuery<EmployeeManagerInfo>({
    queryKey: leavesKeys.employeeManager(empId),
    queryFn: () => fetcher<EmployeeManagerInfo>(`/api/leaves/employee-info?empId=${empId}`),
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
