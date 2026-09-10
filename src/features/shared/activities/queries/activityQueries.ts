// src/features/shared/activities/queries/activityQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../services/activityService';
import type {
  CreateActivityData,
  UpdateActivityData,
  Activity,
  ActivityCategory,
} from '../types/activity.types';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (organizationId?: string) =>
    [...activityKeys.lists(), { organizationId }] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  featured: (organizationId?: string) =>
    [...activityKeys.all, 'featured', { organizationId }] as const,
  categories: () => [...activityKeys.all, 'categories'] as const,
  types: (categoryId?: string) =>
    [...activityKeys.all, 'types', { categoryId }] as const,
  user: (profileId: string) =>
    [...activityKeys.all, 'user', { profileId }] as const,
};

export function useActivities(organizationId?: string) {
  return useQuery({
    queryKey: activityKeys.list(organizationId),
    queryFn: () => activityService.getActivities(organizationId || undefined),
  });
}

export function useFeaturedActivities(organizationId?: string) {
  return useQuery({
    queryKey: activityKeys.featured(organizationId),
    queryFn: () =>
      activityService.getFeaturedActivities(organizationId || undefined),
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => activityService.getActivity(id),
    enabled: !!id,
  });
}

export function useActivityCategories(organizationId?: string) {
  return useQuery({
    queryKey: activityKeys.categories(),
    queryFn: () => activityService.getCategories(organizationId || undefined),
  });
}

export function useActivityTypes(categoryId?: string) {
  return useQuery({
    queryKey: activityKeys.types(categoryId),
    queryFn: () => activityService.getTypes(categoryId || undefined),
    enabled: !!categoryId,
  });
}

export function useUserActivities(profileId: string) {
  return useQuery({
    queryKey: activityKeys.user(profileId),
    queryFn: () => activityService.getUserActivities(profileId),
    enabled: !!profileId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityData) =>
      activityService.createActivity(data),
    onSuccess: (_, variables) => {
      // ✅ FIX: null → undefined
      queryClient.invalidateQueries({
        queryKey: activityKeys.list(variables.organization_id ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateActivityData;
    }) => activityService.updateActivity(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityService.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useFeatureActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityService.featureActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.featured() });
    },
  });
}

export function useUnfeatureActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activityService.unfeatureActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.featured() });
    },
  });
}

export function useChangeActivityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      activityService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useJoinActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      profileId,
    }: {
      activityId: string;
      profileId: string;
    }) => activityService.joinActivity(activityId, profileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: activityKeys.user(variables.profileId),
      });
    },
  });
}

export function useLeaveActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      profileId,
    }: {
      activityId: string;
      profileId: string;
    }) => activityService.leaveActivity(activityId, profileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: activityKeys.user(variables.profileId),
      });
    },
  });
}

export function useActivityParticipants(activityId: string) {
  return useQuery({
    queryKey: [...activityKeys.detail(activityId), 'participants'],
    queryFn: () => activityService.getParticipants(activityId),
    enabled: !!activityId,
  });
}