// src/features/platform-admin/pages/DashboardPage.tsx

import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { PlatformStatsCards } from '../components/PlatformStatsCards';
import { CompanyDirectory } from '../components/CompanyDirectory/CompanyDirectory';
import { PointsGovernance } from '../components/PointsGovernance/PointsGovernance';
import { FeedModeration } from '../components/FeedModeration/FeedModeration';
import { TaxonomyManager } from '../components/TaxonomyManager/TaxonomyManager';
import { RewardsManager } from '../components/RewardsManager/RewardsManager';
import { ActivitiesManager } from '../components/ActivitiesManager/ActivitiesManager';
import { PlatformSettings } from '../components/PlatformSettings/PlatformSettings';
import { MeetupConfig } from '../components/ExternalApis/MeetupConfig';
import { GooglePlacesConfig } from '../components/ExternalApis/GooglePlacesConfig';
import { usePlatformStats } from '../hooks/usePlatformStats';
import type { PlatformStats } from '../types/platform.types';

// PlatformOverview component integrated here
function PlatformOverview({ stats, isLoading }: { stats: PlatformStats | null; isLoading: boolean }) {
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
      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-semibold text-sm">Platform Summary</h3>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Companies</span>
            <span className="font-bold">{stats.totalOrganizations}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Users</span>
            <span className="font-bold">{stats.totalUsers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Users</span>
            <span className="font-bold">{stats.activeUsers}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-semibold text-sm">Content Stats</h3>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Activities</span>
            <span className="font-bold">{stats.totalActivities}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Challenges</span>
            <span className="font-bold">{stats.totalChallenges}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rewards</span>
            <span className="font-bold">{stats.totalRewards}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-semibold text-sm">Points & Engagement</h3>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Points Awarded</span>
            <span className="font-bold">{stats.totalPointsAwarded.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Points Pool</span>
            <span className="font-bold">{stats.monthlyPointsPool.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Point Valuation</span>
            <span className="font-bold">${stats.pointValuationUSD.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type TabId = 'overview' | 'companies' | 'activities' | 'rewards' | 'governance' | 'moderation' | 'taxonomy' | 'meetup' | 'places' | 'settings';

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { stats, isLoading } = usePlatformStats();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'activities', label: 'Activities', icon: '📋' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'governance', label: 'Points Governance', icon: '⚖️' },
    { id: 'moderation', label: 'Moderation', icon: '🛡️' },
    { id: 'taxonomy', label: 'Taxonomy', icon: '📂' },
    { id: 'meetup', label: 'Meetup API', icon: '👥' },
    { id: 'places', label: 'Places API', icon: '📍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user?.email}. Manage all organizations and platform settings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </span>
        </div>
      </div>

      {activeTab === 'overview' && (
        <PlatformStatsCards stats={stats} isLoading={isLoading} />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <PlatformOverview stats={stats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <CompanyDirectory />
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <ActivitiesManager />
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <RewardsManager />
        </TabsContent>

        <TabsContent value="governance" className="mt-4">
          <PointsGovernance />
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <FeedModeration />
        </TabsContent>

        <TabsContent value="taxonomy" className="mt-4">
          <TaxonomyManager />
        </TabsContent>

        <TabsContent value="meetup" className="mt-4">
          <MeetupConfig />
        </TabsContent>

        <TabsContent value="places" className="mt-4">
          <GooglePlacesConfig />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <PlatformSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}