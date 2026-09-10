// src/features/platform-admin/components/PlatformStatsCards.tsx

import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlatformStats } from '../types/platform.types';

interface StatsCardsProps {
  stats: PlatformStats | null;
  isLoading: boolean;
}

export function PlatformStatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: 'Companies', value: stats.totalOrganizations, icon: '🏢', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-green-500/10 text-green-500' },
    { label: 'Active Users (30d)', value: stats.activeUsers, icon: '🟢', color: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Activities', value: stats.totalActivities, icon: '📋', color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Challenges', value: stats.totalChallenges, icon: '🏆', color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Rewards', value: stats.totalRewards, icon: '🎁', color: 'bg-pink-500/10 text-pink-500' },
    { label: 'Points Awarded', value: stats.totalPointsAwarded, icon: '⭐', color: 'bg-yellow-500/10 text-yellow-500' },
    { label: 'Active Tenants', value: stats.activeTenants, icon: '✅', color: 'bg-indigo-500/10 text-indigo-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value.toLocaleString()}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${item.color}`}>
              {item.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}