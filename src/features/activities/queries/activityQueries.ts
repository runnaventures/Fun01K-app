import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../services/activityService';
import type { CreateActivityData, UpdateActivityData, Activity, ActivityCategory } from '../types/activity.types';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: any) => [...activityKeys.lists(), organizationId, filters] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  categories: (organizationId: string) => [...activityKeys.all, 'categories', organizationId] as const,
  participations: (profileId: string) => [...activityKeys.all, 'participations', profileId] as const,
};

// Categories
export function useActivityCategories(organizationId: string) {
  return useQuery({
    queryKey: activityKeys.categories(organizationId),
    queryFn: () => activityService.getCategories(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, name, description }: { organizationId: string; name: string; description?: string }) =>
      activityService.createCategory(organizationId, name, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.categories(variables.organizationId) });
    },
  });
}

// Activities
export function useActivities(organizationId: string, filters?: { status?: string; category_id?: string }) {
  return useQuery({
    queryKey: activityKeys.list(organizationId, filters),
    queryFn: () => activityService.getActivities(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => activityService.getActivity(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityData) =>
      activityService.createActivity(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.list(variables.organization_id) });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityData }) =>
      activityService.updateActivity(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      activityService.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useChangeActivityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      activityService.changeActivityStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

// Participation
export function useJoinActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, profileId }: { activityId: string; profileId: string }) =>
      activityService.joinActivity(activityId, profileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.participations(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.activityId) });
    },
  });
}

export function useActivityParticipation(activityId: string, profileId: string) {
  return useQuery({
    queryKey: [...activityKeys.detail(activityId), 'participation', profileId],
    queryFn: () => activityService.getActivityParticipation(activityId, profileId),
    enabled: !!activityId && !!profileId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useParticipations(profileId: string) {
  return useQuery({
    queryKey: activityKeys.participations(profileId),
    queryFn: () => activityService.getParticipations(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
  });
}
