// src/features/shared/activities/components/AdminFeaturedFeed.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { AdminActivityCard } from './AdminActivityCard';
import type { Activity } from '../types/activity.types';

interface AdminFeaturedFeedProps {
  loadActivities: () => Promise<Activity[]>;
  onAddActivity: (activityId: string) => void;
  onFeatureActivity?: (activityId: string) => void;
  onFlagActivity?: (activityId: string, reason: string) => void;
  onArchiveActivity?: (activityId: string) => void;
  onAddNewActivity?: () => void;
  userInterests?: string[];
  organizationId?: string;
  joinedActivityIds?: string[];
  isFormOpen?: boolean;
}

const CATEGORIES = [
  'All Categories',
  'Wellness',
  'Sports',
  'Social',
  'Hobby',
  'Learning',
];

export function AdminFeaturedFeed({
  loadActivities,
  onAddActivity,
  onFeatureActivity,
  onArchiveActivity,
  onAddNewActivity,
  isFormOpen = false,
}: AdminFeaturedFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await loadActivities();
      let filtered = data;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            (a.description?.toLowerCase() || '').includes(term)
        );
      }

      if (selectedCategory !== 'All Categories') {
        filtered = filtered.filter(
          (a) => a.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      setActivities(filtered);
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  const isSpotlight = (activity: Activity) =>
    !!activity.is_featured && activity.status === 'published';

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header — hidden when the inline create form is open */}
      {!isFormOpen && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Activities</h2>
            <p className="text-sm text-muted-foreground">
              Create immersive company challenges, social group gatherings, or
              peer wellness rituals.
            </p>
          </div>
          <Button
            onClick={() => onAddNewActivity?.()}
            className="flex items-center gap-1.5"
          >
            <LucideIcon name="Plus" size={16} />
            Add Activity
          </Button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <LucideIcon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activities by name, category, location..."
            className="pl-9"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-muted-foreground">
          <p className="text-lg">No featured activities</p>
          <p className="text-sm">Create your first activity to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const spotlight = isSpotlight(activity);

            return (
              <AdminActivityCard
                key={activity.id}
                activity={activity}
                onAdd={() => onAddActivity(activity.id)}
                onFeature={() => {
                  if (onFeatureActivity) onFeatureActivity(activity.id);
                }}
                onArchive={() => {
                  if (onArchiveActivity) onArchiveActivity(activity.id);
                }}
                onEdit={() => {
                  console.log('Edit activity:', activity.id);
                }}
                onRefresh={handleRefresh}
                isSpotlight={spotlight}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}