import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import type { UpdateProfileData } from '../types/profile.types';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { supabase } from '@/lib/supabase';

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
  departments: (organizationId: string) => [...profileKeys.all, 'departments', organizationId] as const,
  teams: (organizationId: string, departmentId?: string) => [...profileKeys.all, 'teams', organizationId, departmentId] as const,
};

// Add member keys
export const memberKeys = {
  all: ['organization-members'] as const,
  detail: (userId: string) => [...memberKeys.all, userId] as const,
};

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.detail(user?.id || ''),
    queryFn: () => profileService.getProfile(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => 
      profileService.updateProfile(user?.id || '', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id || '') });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (file: File) => 
      profileService.uploadAvatar(user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id || '') });
    },
  });
}

export function useDepartments() {
  const { organizationMember } = useOrganization();

  return useQuery({
    queryKey: profileKeys.departments(organizationMember?.organization_id || ''),
    queryFn: () => profileService.getDepartments(organizationMember?.organization_id || ''),
    enabled: !!organizationMember?.organization_id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeams(departmentId?: string | null) {
  const { organizationMember } = useOrganization();

  // Convert null to undefined for the query key
  const deptId = departmentId || undefined;

  return useQuery({
    queryKey: profileKeys.teams(organizationMember?.organization_id || '', deptId),
    queryFn: () => profileService.getTeams(organizationMember?.organization_id || '', deptId),
    enabled: !!organizationMember?.organization_id,
    staleTime: 5 * 60 * 1000,
  });
}

// Add this new hook for fetching organization member
export function useOrganizationMember(userId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.detail(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching organization member:', error);
        return null;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}