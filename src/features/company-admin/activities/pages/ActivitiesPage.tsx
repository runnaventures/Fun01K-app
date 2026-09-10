// src/features/company-admin/activities/pages/ActivitiesPage.tsx

import { useState } from 'react';
import { ActivityFeed } from '@/features/shared/activities/components/ActivityFeed';
import { useActivityPermissions } from '@/features/shared/activities/hooks/useActivityPermissions';
import { CreateActivityDialog } from './CreateActivityDialog';

export default function ActivitiesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { canCreateActivity } = useActivityPermissions();

  return (
    <div className="space-y-6">
      <ActivityFeed 
        tab="featured" 
        isAdmin={true}
        onAddActivity={() => setIsCreateDialogOpen(true)}
      />

      <CreateActivityDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          // Refresh activities
        }}
      />
    </div>
  );
}