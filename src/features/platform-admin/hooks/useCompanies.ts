// src/features/platform-admin/hooks/useCompanies.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: number | null;
  timezone: string | null;
  status: string | null;
  monthly_points_budget: number | null;
  created_at: string;
  updated_at: string;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .neq('slug', 'platform')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the data to Company[] since the status field is string | null
      setCompanies((data || []) as Company[]);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { companies, isLoading, refreshCompanies: fetchCompanies };
}