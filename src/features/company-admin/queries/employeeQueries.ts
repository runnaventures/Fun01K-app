import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import type { EmployeeInvite, BulkEmployeeImport } from '../types/employee.types';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: any) => [...employeeKeys.lists(), organizationId, filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

export function useEmployees(organizationId: string, filters?: { status?: string; department_id?: string; search?: string }) {
  return useQuery({
    queryKey: employeeKeys.list(organizationId, filters),
    queryFn: () => employeeService.getEmployees(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getEmployee(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, data }: { organizationId: string; data: any }) =>
      employeeService.addEmployee(organizationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list(variables.organizationId) });
    },
  });
}

export function useBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, employees }: { organizationId: string; employees: BulkEmployeeImport[] }) =>
      employeeService.bulkImport(organizationId, employees),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list(variables.organizationId) });
    },
  });
}

export function useInviteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, invite }: { organizationId: string; invite: EmployeeInvite }) =>
      employeeService.inviteEmployee(organizationId, invite),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list(variables.organizationId) });
    },
  });
}

export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: string }) =>
      employeeService.updateStatus(memberId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useRemoveEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      employeeService.removeEmployee(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, roles }: { memberId: string; roles: string[] }) =>
      employeeService.updateRole(memberId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function usePendingInvites(organizationId: string) {
  return useQuery({
    queryKey: [...employeeKeys.lists(), organizationId, 'pending'],
    queryFn: () => employeeService.getPendingInvites(organizationId),
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000,
  });
}