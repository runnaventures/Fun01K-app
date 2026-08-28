import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '../services/verificationService';
import type { VerificationRequest } from '../types/verification.types';

export const verificationKeys = {
  all: ['verifications'] as const,
  activity: (activityId: string) => [...verificationKeys.all, 'activity', activityId] as const,
  pending: (hostId: string) => [...verificationKeys.all, 'pending', hostId] as const,
};

export function useVerifications(activityId: string) {
  return useQuery({
    queryKey: verificationKeys.activity(activityId),
    queryFn: () => verificationService.getVerifications(activityId),
    enabled: !!activityId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingApprovals(hostId: string) {
  return useQuery({
    queryKey: verificationKeys.pending(hostId),
    queryFn: () => verificationService.getPendingApprovals(hostId),
    enabled: !!hostId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useVerifyLocation() {
  return useMutation({
    mutationFn: ({ activityId, profileId, latitude, longitude, accuracy }: {
      activityId: string;
      profileId: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
    }) => verificationService.verifyLocation(activityId, profileId, latitude, longitude, accuracy),
  });
}

export function useVerifyQR() {
  return useMutation({
    mutationFn: ({ activityId, profileId, qrCode }: {
      activityId: string;
      profileId: string;
      qrCode: string;
    }) => verificationService.verifyQR(activityId, profileId, qrCode),
  });
}

export function useRequestHostApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, profileId, hostId, notes }: {
      activityId: string;
      profileId: string;
      hostId: string;
      notes?: string;
    }) => verificationService.requestHostApproval(activityId, profileId, hostId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.pending(variables.hostId) });
    },
  });
}

export function useApproveHostRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ approvalId, hostId }: { approvalId: string; hostId: string }) =>
      verificationService.approveHostRequest(approvalId, hostId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.pending(variables.hostId) });
      queryClient.invalidateQueries({ queryKey: verificationKeys.all });
    },
  });
}

export function useRejectHostRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ approvalId, hostId, reason }: { approvalId: string; hostId: string; reason?: string }) =>
      verificationService.rejectHostRequest(approvalId, hostId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.pending(variables.hostId) });
    },
  });
}

export function useGenerateQRCode() {
  return useMutation({
    mutationFn: ({ activityId, expiresInMinutes }: { activityId: string; expiresInMinutes?: number }) =>
      verificationService.generateQRCode(activityId, expiresInMinutes),
  });
}