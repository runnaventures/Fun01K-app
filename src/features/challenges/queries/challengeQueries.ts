import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengeService } from '../services/challengeService';
import type { CreateChallengeData, UpdateChallengeData } from '../types/challenge.types';
import { useAuth } from '@/app/providers/AuthProvider';

export const challengeKeys = {
    all: ['challenges'] as const,
    lists: () => [...challengeKeys.all, 'list'] as const,
    list: (organizationId: string, filters?: any) => [...challengeKeys.lists(), organizationId, filters] as const,
    details: () => [...challengeKeys.all, 'detail'] as const,
    detail: (id: string) => [...challengeKeys.details(), id] as const,
    members: (challengeId: string) => [...challengeKeys.all, 'members', challengeId] as const,
    user: (profileId: string) => [...challengeKeys.all, 'user', profileId] as const,
    progress: (challengeId: string, profileId: string) => [...challengeKeys.all, 'progress', challengeId, profileId] as const,
};

// Get all challenges for an organization
export function useChallenges(organizationId: string, filters?: { status?: string; type?: string }) {
    return useQuery({
        queryKey: challengeKeys.list(organizationId, filters),
        queryFn: () => challengeService.getChallenges(organizationId, filters),
        enabled: !!organizationId,
        staleTime: 2 * 60 * 1000,
    });
}

// Get a single challenge
export function useChallenge(id: string) {
    return useQuery({
        queryKey: challengeKeys.detail(id),
        queryFn: () => challengeService.getChallenge(id),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
}

// Create a challenge
export function useCreateChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateChallengeData) =>
            challengeService.createChallenge(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: challengeKeys.list(variables.organization_id) });
        },
    });
}

// Update a challenge
export function useUpdateChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateChallengeData }) =>
            challengeService.updateChallenge(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
        },
    });
}

// Delete a challenge
export function useDeleteChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            challengeService.deleteChallenge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
        },
    });
}

// Join a challenge
export function useJoinChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ challengeId, profileId }: { challengeId: string; profileId: string }) =>
            challengeService.joinChallenge(challengeId, profileId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: challengeKeys.members(variables.challengeId) });
            queryClient.invalidateQueries({ queryKey: challengeKeys.user(variables.profileId) });
        },
    });
}

// Get challenge members
export function useChallengeMembers(challengeId: string) {
    return useQuery({
        queryKey: challengeKeys.members(challengeId),
        queryFn: () => challengeService.getChallengeMembers(challengeId),
        enabled: !!challengeId,
        staleTime: 2 * 60 * 1000,
    });
}

// Get user's challenges
export function useUserChallenges() {
    const { user } = useAuth();
    const profileId = user?.id || '';

    return useQuery({
        queryKey: challengeKeys.user(profileId),
        queryFn: () => challengeService.getUserChallenges(profileId),
        enabled: !!profileId,
        staleTime: 2 * 60 * 1000,
    });
}

// Get challenge progress for a user
export function useChallengeProgress(challengeId: string) {
    const { user } = useAuth();
    const profileId = user?.id || '';

    return useQuery({
        queryKey: challengeKeys.progress(challengeId, profileId),
        queryFn: () => challengeService.getChallengeProgress(challengeId, profileId),
        enabled: !!challengeId && !!profileId,
        staleTime: 1 * 60 * 1000,
    });
}

// Complete a challenge
export function useCompleteChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ challengeId, profileId }: { challengeId: string; profileId: string }) =>
            challengeService.completeChallenge(challengeId, profileId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: challengeKeys.members(variables.challengeId) });
            queryClient.invalidateQueries({ queryKey: challengeKeys.user(variables.profileId) });
            queryClient.invalidateQueries({ queryKey: challengeKeys.progress(variables.challengeId, variables.profileId) });
        },
    });
}