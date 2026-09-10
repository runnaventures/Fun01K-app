// src/features/platform-admin/components/FeedModeration/FeedModeration.tsx

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { CompanyActivities } from './CompanyActivities';
import { SocialFeed } from './SocialFeed';
import { PlacesFeed } from './PlacesFeed';
import { useModeration } from '../../hooks/useModeration';

export function FeedModeration() {
  const [activeTab, setActiveTab] = useState<'company' | 'social' | 'places'>('company');
  const { state, flagActivity, featureActivity, hideItem } = useModeration();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Content Moderation</h2>
        <p className="text-sm text-muted-foreground">
          Manage and moderate all content across the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="company" className="relative">
            Company Activities
            {Object.keys(state.flaggedActivityIds).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                {Object.keys(state.flaggedActivityIds).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="social" className="relative">
            Social Feed
            {Object.keys(state.flaggedSocialEventIds).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                {Object.keys(state.flaggedSocialEventIds).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="places" className="relative">
            Places & Venues
            {Object.keys(state.flaggedPlaceIds).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                {Object.keys(state.flaggedPlaceIds).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyActivities />
        </TabsContent>

        <TabsContent value="social">
          <SocialFeed />
        </TabsContent>

        <TabsContent value="places">
          <PlacesFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}