import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardService } from '../services/rewardService';
import type { CreateRewardData, UpdateRewardData } from '../types/reward.types';

export const rewardKeys = {
  all: ['rewards'] as const,
  lists: () => [...rewardKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: any) => [...rewardKeys.lists(), organizationId, filters] as const,
  details: () => [...rewardKeys.all, 'detail'] as const,
  detail: (id: string) => [...rewardKeys.details(), id] as const,
};

// Get all rewards
export function useRewards(organizationId: string, filters?: { status?: string; category?: string }) {
  return useQuery({
    queryKey: rewardKeys.list(organizationId, filters),
    queryFn: () => rewardService.getRewards(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

// Get a single reward
export function useReward(id: string) {
  return useQuery({
    queryKey: rewardKeys.detail(id),
    queryFn: () => rewardService.getReward(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// Create a reward
export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRewardData) =>
      rewardService.createReward(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.list(variables.organization_id) });
    },
  });
}

// Update a reward
export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRewardData }) =>
      rewardService.updateReward(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: rewardKeys.lists() });
    },
  });
}

// Delete a reward
export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      rewardService.deleteReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.lists() });
    },
  });
}

// Update reward stock
export function useUpdateRewardStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      rewardService.updateStock(id, stock),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: rewardKeys.lists() });
    },
  });
}

// Upload reward image
export function useUploadRewardImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rewardId, file }: { rewardId: string; file: File }) =>
      rewardService.uploadImage(rewardId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(variables.rewardId) });
    },
  });
}

// Remove reward image
export function useRemoveRewardImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) =>
      rewardService.removeImage(rewardId),
    onSuccess: (_, rewardId) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(rewardId) });
    },
  });
}