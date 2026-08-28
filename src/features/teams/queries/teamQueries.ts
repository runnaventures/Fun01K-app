import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import type { CreateTeamData, UpdateTeamData } from '../types/team.types';

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (organizationId: string, departmentId?: string) => [...teamKeys.lists(), organizationId, departmentId] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

export function useTeams(organizationId: string, departmentId?: string) {
  return useQuery({
    queryKey: teamKeys.list(organizationId, departmentId),
    queryFn: () => teamService.getTeams(organizationId, departmentId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamService.getTeam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamData) =>
      teamService.createTeam(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.list(variables.organization_id) });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamData }) =>
      teamService.updateTeam(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      teamService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}