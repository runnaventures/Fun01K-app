import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organizationService';
import type { CreateOrganizationData, UpdateOrganizationData } from '../types/organization.types';

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: () => [...organizationKeys.lists()] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  members: (organizationId: string) => [...organizationKeys.all, 'members', organizationId] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: () => organizationService.getOrganizations(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationService.getOrganization(id),
    enabled: !!id && id !== 'super-admin',
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationData) => 
      organizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationData }) =>
      organizationService.updateOrganization(id, data),
    onSuccess: (result, variables) => {
      if (result) {
        // Update the cache with the new data
        queryClient.setQueryData(
          organizationKeys.detail(variables.id),
          result
        );
      }
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      organizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, file }: { organizationId: string; file: File }) =>
      organizationService.uploadLogo(organizationId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

export function useRemoveOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      organizationService.removeLogo(organizationId),
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(organizationId) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

export function useOrganizationMembers(organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.members(organizationId),
    queryFn: () => organizationService.getOrganizationMembers(organizationId),
    enabled: !!organizationId && organizationId !== 'super-admin',
    staleTime: 2 * 60 * 1000,
  });
}