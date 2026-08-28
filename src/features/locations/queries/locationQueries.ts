import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '../services/locationService';
import type { CreateLocationData, UpdateLocationData } from '../types/location.types';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (organizationId: string) => [...locationKeys.lists(), organizationId] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

export function useLocations(organizationId: string) {
  return useQuery({
    queryKey: locationKeys.list(organizationId),
    queryFn: () => locationService.getLocations(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => locationService.getLocation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationData) =>
      locationService.createLocation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(variables.organization_id) });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationData }) =>
      locationService.updateLocation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      locationService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}