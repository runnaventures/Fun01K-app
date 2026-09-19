import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const fundingKeys = {
  all: ['funding'] as const,
  org: (organizationId: string) => [...fundingKeys.all, organizationId] as const,
};

export function useOrganizationFunding(organizationId: string) {
  return useQuery({
    queryKey: fundingKeys.org(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('prepaid_balance')
        .eq('id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.prepaid_balance ?? 0);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

export function useDepositFunding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      amount,
    }: {
      organizationId: string;
      amount: number;
    }) => {
      const { data: current, error: readErr } = await supabase
        .from('organizations')
        .select('prepaid_balance')
        .eq('id', organizationId)
        .maybeSingle();
      if (readErr) throw readErr;
      const next = Number(current?.prepaid_balance ?? 0) + amount;
      const { error: writeErr } = await supabase
        .from('organizations')
        .update({ prepaid_balance: next })
        .eq('id', organizationId);
      if (writeErr) throw writeErr;
      return next;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: fundingKeys.org(variables.organizationId),
      });
    },
  });
}