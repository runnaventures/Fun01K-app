// src/features/activities/pages/ActivitiesPage.tsx (Employee)

import { useState } from 'react';
import { ActivityFeed } from '@/features/shared/activities/components/ActivityFeed';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState<'featured' | 'social' | 'places'>('featured');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-muted-foreground">Discover and join activities curated for you</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'featured' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('featured')}
          >
            <LucideIcon name="Star" size={14} className="mr-1" />
            Featured
          </Button>
          <Button
            variant={activeTab === 'social' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('social')}
          >
            <LucideIcon name="Users" size={14} className="mr-1" />
            Social
          </Button>
          <Button
            variant={activeTab === 'places' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('places')}
          >
            <LucideIcon name="MapPin" size={14} className="mr-1" />
            Places
          </Button>
        </div>
      </div>
      <ActivityFeed tab={activeTab} isAdmin={false} />
    </div>
  );
}