// src/features/shared/activities/hooks/useActiveInterests.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActiveInterest {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  places_keyword: string | null;
  sort_order: number | null;
}

export function useActiveInterests() {
  const [interests, setInterests] = useState<ActiveInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('interests')
        .select('id, name, slug, icon, color, places_keyword, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (qErr) throw qErr;
      setInterests((data || []) as ActiveInterest[]);
    } catch (err: any) {
      console.error('useActiveInterests:', err);
      setError(err?.message || 'Failed to load interests');
      setInterests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { interests, isLoading, error, reload: load };
}