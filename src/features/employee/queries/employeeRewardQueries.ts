// src/features/employee/queries/employeeRewardQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────

export interface EmployeeReward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  category: string;
  stock: number | null;
  image_url: string | null;
  status: string;
  source: string;
  organization_id: string | null;
  created_at: string;
}

export interface Redemption {
  id: string;
  reward_id: string;
  profile_id: string;
  points_spent: number;
  status: string;
  redemption_code: string | null;
  provider_order_id: string | null;
  redeemed_at: string | null;
  created_at: string;
  reward?: { title: string; image_url: string | null } | null;
}

export const employeeRewardKeys = {
  all: ['employee-rewards'] as const,
  available: (orgId: string) => [...employeeRewardKeys.all, 'available', orgId] as const,
  balance: (profileId: string) => [...employeeRewardKeys.all, 'balance', profileId] as const,
  redemptions: (profileId: string) => [...employeeRewardKeys.all, 'redemptions', profileId] as const,
};

// ─── Available rewards ────────────────────────────────────────────────
// Shows: rewards belonging to the employee's org OR global (organization_id IS NULL),
// that are visible to employees (status in ('published','active')).

export function useAvailableRewards(organizationId?: string) {
  return useQuery({
    queryKey: employeeRewardKeys.available(organizationId || 'none'),
    queryFn: async (): Promise<EmployeeReward[]> => {
      let q = supabase
        .from('rewards')
        .select('*')
        .in('status', ['published', 'active'])
        .order('created_at', { ascending: false });

      if (organizationId) {
        q = q.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      } else {
        q = q.is('organization_id', null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as EmployeeReward[];
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

// ─── Points balance ───────────────────────────────────────────────────

export function usePointsBalance(profileId?: string) {
  return useQuery({
    queryKey: employeeRewardKeys.balance(profileId || 'none'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_accounts')
        .select('balance, lifetime_redeemed')
        .eq('profile_id', profileId!)
        .maybeSingle();
      if (error) throw error;
      return {
        balance: Number(data?.balance ?? 0),
        lifetimeRedeemed: Number(data?.lifetime_redeemed ?? 0),
      };
    },
    enabled: !!profileId,
    staleTime: 15 * 1000,
  });
}

// ─── My redemptions ───────────────────────────────────────────────────

export function useMyRedemptions(profileId?: string) {
  return useQuery({
    queryKey: employeeRewardKeys.redemptions(profileId || 'none'),
    queryFn: async (): Promise<Redemption[]> => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*, reward:reward_id(title, image_url)')
        .eq('profile_id', profileId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Redemption[];
    },
    enabled: !!profileId,
    staleTime: 30 * 1000,
  });
}

// ─── Redeem mutation ──────────────────────────────────────────────────

export function useRedeemReward(profileId?: string, organizationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_reward_id: rewardId,
      });
      if (error) throw error;
      const result = data as {
        ok: boolean;
        error?: string;
        redemption_id?: string;
        balance?: number;
      };
      if (!result?.ok) throw new Error(result?.error || 'redemption_failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeRewardKeys.available(organizationId || 'none'),
      });
      queryClient.invalidateQueries({
        queryKey: employeeRewardKeys.balance(profileId || 'none'),
      });
      queryClient.invalidateQueries({
        queryKey: employeeRewardKeys.redemptions(profileId || 'none'),
      });
    },
  });
}