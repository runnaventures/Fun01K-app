// src/features/platform-admin/components/PlatformOverview.tsx

import { PlatformStats } from '../types/platform.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface PlatformOverviewProps {
  stats: PlatformStats | null;
  isLoading: boolean;
}

export function PlatformOverview({ stats, isLoading }: PlatformOverviewProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading platform data...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Platform Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Companies</span>
            <span className="font-bold">{stats.totalOrganizations}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Users</span>
            <span className="font-bold">{stats.totalUsers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Active Users</span>
            <span className="font-bold">{stats.activeUsers}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Activities</span>
            <span className="font-bold">{stats.totalActivities}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Challenges</span>
            <span className="font-bold">{stats.totalChallenges}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Rewards</span>
            <span className="font-bold">{stats.totalRewards}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Points & Engagement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Points Awarded</span>
            <span className="font-bold">{stats.totalPointsAwarded.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Monthly Points Pool</span>
            <span className="font-bold">{stats.monthlyPointsPool.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Point Valuation</span>
            <span className="font-bold">${stats.pointValuationUSD.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}