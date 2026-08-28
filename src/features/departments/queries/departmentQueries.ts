import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import type { CreateDepartmentData, UpdateDepartmentData } from '../types/department.types';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (organizationId: string) => [...departmentKeys.lists(), organizationId] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

export function useDepartments(organizationId: string) {
  return useQuery({
    queryKey: departmentKeys.list(organizationId),
    queryFn: () => departmentService.getDepartments(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentService.getDepartment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentData) =>
      departmentService.createDepartment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.list(variables.organization_id) });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentData }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) });
      // Also invalidate all lists
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}