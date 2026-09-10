// src/features/activities/components/EmployeeActivityFeed.tsx

import { useState } from 'react';
import { ActivityFeed } from './ActivityFeed';

interface EmployeeActivityFeedProps {
  tab?: 'featured' | 'social' | 'places';
}

export default function EmployeeActivityFeed({ tab = 'featured' }: EmployeeActivityFeedProps) {
  return <ActivityFeed tab={tab} isAdmin={false} />;
}