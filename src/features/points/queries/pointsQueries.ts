import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pointsService } from '../services/pointsService';
import type { AwardPointsData, RedeemPointsData } from '../types/points.types';

export const pointsKeys = {
  all: ['points'] as const,
  account: (profileId: string) => [...pointsKeys.all, 'account', profileId] as const,
  transactions: (profileId: string) => [...pointsKeys.all, 'transactions', profileId] as const,
  balance: (profileId: string) => [...pointsKeys.all, 'balance', profileId] as const,
};

export function usePointsAccount(profileId: string) {
  return useQuery({
    queryKey: pointsKeys.account(profileId),
    queryFn: () => pointsService.getAccount(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePointsTransactions(profileId: string, limit: number = 50) {
  return useQuery({
    queryKey: [...pointsKeys.transactions(profileId), limit],
    queryFn: () => pointsService.getTransactions(profileId, limit),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePointsBalance(profileId: string) {
  return useQuery({
    queryKey: pointsKeys.balance(profileId),
    queryFn: () => pointsService.getBalance(profileId),
    enabled: !!profileId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAwardPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AwardPointsData) => pointsService.awardPoints(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.account(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: pointsKeys.balance(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: pointsKeys.transactions(variables.profileId) });
    },
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RedeemPointsData) => pointsService.redeemPoints(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.account(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: pointsKeys.balance(variables.profileId) });
      queryClient.invalidateQueries({ queryKey: pointsKeys.transactions(variables.profileId) });
    },
  });
}