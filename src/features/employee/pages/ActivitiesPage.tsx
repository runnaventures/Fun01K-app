// src/features/employee/pages/ActivitiesPage.tsx

import { ActivityFeed } from '@/features/shared/activities/components/ActivityFeed';

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activities</h1>
        <p className="text-muted-foreground">
          Discover and join activities curated for you
        </p>
      </div>
      <ActivityFeed tab="featured" isAdmin={false} />
    </div>
  );
}