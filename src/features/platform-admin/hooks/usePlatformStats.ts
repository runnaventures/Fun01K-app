// src/features/platform-admin/hooks/usePlatformStats.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlatformStats } from '../types/platform.types';

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [
        { count: orgCount },
        { count: userCount },
        { count: activityCount },
        { count: challengeCount },
        { count: rewardCount },
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*', { count: 'exact', head: true }),
        supabase.from('rewards').select('*', { count: 'exact', head: true }),
      ]);

      // Get active users (joined in last 30 days)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get total points awarded
      const { data: pointsData } = await supabase
        .from('points_ledger')
        .select('amount')
        .eq('type', 'award');

      const totalPoints = (pointsData ?? []).reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);

      // Count active tenants (organizations with slug != 'platform')
      const { count: activeTenants } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .neq('slug', 'platform');

      setStats({
        totalOrganizations: orgCount || 0,
        totalUsers: userCount || 0,
        totalActivities: activityCount || 0,
        totalChallenges: challengeCount || 0,
        totalRewards: rewardCount || 0,
        totalPointsAwarded: totalPoints,
        activeUsers: activeUsers || 0,
        activeTenants: activeTenants || 0,
        monthlyPointsPool: 0, // Will be calculated from org budgets
        pointValuationUSD: 0.10, // Default
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, refreshStats: fetchStats };
}