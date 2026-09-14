// src/features/company-admin/activities/pages/ActivitiesPage.tsx

import { useState } from 'react';
import { ActivityFeed } from '@/features/shared/activities/components/ActivityFeed';
import { CreateActivityDialog } from './CreateActivityDialog';

export default function ActivitiesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Inline create form */}
      <CreateActivityDialog
        mode="inline"
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => setShowCreateForm(false)}
      />

      {/* Feed (tabs + activity grid) */}
      <ActivityFeed
        tab="featured"
        isAdmin={true}
        isFormOpen={showCreateForm}
        onAddActivity={() => setShowCreateForm(true)}
      />
    </div>
  );
}