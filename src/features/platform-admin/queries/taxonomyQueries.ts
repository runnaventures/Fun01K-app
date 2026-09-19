// src/features/platform-admin/queries/taxonomyQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  taxonomyService,
  type CreateInterestData,
  type CreateSubInterestData,
} from '../services/taxonomyService';

export const taxonomyKeys = {
  all: ['taxonomy'] as const,
  interests: () => [...taxonomyKeys.all, 'interests'] as const,
  interestsWithSubs: () => [...taxonomyKeys.all, 'interests-with-subs'] as const,
  subInterests: (interestId: string) =>
    [...taxonomyKeys.all, 'sub-interests', interestId] as const,
};

/* ═══════════════════════════════════════════════════════════════════════
   INTERESTS
   ═══════════════════════════════════════════════════════════════════════ */

export function useInterests() {
  return useQuery({
    queryKey: taxonomyKeys.interests(),
    queryFn: () => taxonomyService.getInterests(),
  });
}

export function useInterestsWithSubs() {
  return useQuery({
    queryKey: taxonomyKeys.interestsWithSubs(),
    queryFn: () => taxonomyService.getInterestsWithSubs(),
  });
}

export function useCreateInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterestData) =>
      taxonomyService.createInterest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}

export function useUpdateInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateInterestData>;
    }) => taxonomyService.updateInterest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}

export function useDeleteInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxonomyService.deleteInterest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-INTERESTS
   ═══════════════════════════════════════════════════════════════════════ */

export function useSubInterests(interestId: string) {
  return useQuery({
    queryKey: taxonomyKeys.subInterests(interestId),
    queryFn: () => taxonomyService.getSubInterests(interestId),
    enabled: !!interestId,
  });
}

export function useCreateSubInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubInterestData) =>
      taxonomyService.createSubInterest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}

export function useUpdateSubInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSubInterestData>;
    }) => taxonomyService.updateSubInterest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}

export function useDeleteSubInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxonomyService.deleteSubInterest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxonomyKeys.all });
    },
  });
}