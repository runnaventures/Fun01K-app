// src/features/profiles/queries/profileQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import type { UpdateProfileData } from '../services/profileService';

export const profileKeys = {
  all: ['profiles'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  departments: (organizationId: string) => [...profileKeys.all, 'departments', organizationId] as const,
  teams: (organizationId: string, departmentId?: string) => [...profileKeys.all, 'teams', organizationId, departmentId] as const,
};

export function useProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateProfileData }) =>
      profileService.updateProfile(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      profileService.uploadAvatar(userId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
    },
  });
}

export function useDepartments(organizationId: string) {
  return useQuery({
    queryKey: profileKeys.departments(organizationId),
    queryFn: () => profileService.getDepartments(organizationId),
    enabled: !!organizationId,
  });
}

export function useTeams(organizationId: string, departmentId?: string) {
  return useQuery({
    queryKey: profileKeys.teams(organizationId, departmentId),
    queryFn: () => profileService.getTeams(organizationId, departmentId),
    enabled: !!organizationId,
  });
}