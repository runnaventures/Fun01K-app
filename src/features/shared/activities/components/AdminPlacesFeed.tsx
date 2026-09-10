// src/features/activities/components/AdminPlacesFeed.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { AdminActivityCard } from './AdminActivityCard';
import { Activity } from '../types/activity.types';

interface AdminPlacesFeedProps {
  loadActivities: (searchTerm?: string, selectedCity?: string, venueType?: string) => Promise<Activity[]>;
  onJoinActivity?: (activityId: string) => void;
  onAddActivity?: (activityId: string) => void;
  onFlagActivity?: (activityId: string, reason: string) => void;
  onFeatureActivity?: (activityId: string) => void;
  onAddNewActivity?: () => void;
  userInterests?: string[];
  organizationId?: string;
  joinedActivityIds?: string[];
}

const CITIES = ['Atlanta', 'San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago', 'All Cities'];
const VENUE_TYPES = ['All', 'Wellness', 'Sports', 'Social', 'Hobby', 'Learning'];

export function AdminPlacesFeed({
  loadActivities,
  onJoinActivity,
  onAddActivity,
  onFlagActivity,
  onFeatureActivity,
  onAddNewActivity,
  joinedActivityIds = [],
}: AdminPlacesFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Atlanta');
  const [venueType, setVenueType] = useState('All');

  useEffect(() => {
    fetchActivities();
  }, [searchTerm, selectedCity, venueType]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await loadActivities(searchTerm, selectedCity, venueType);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching places activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeature = (activityId: string) => {
    if (onFeatureActivity) onFeatureActivity(activityId);
  };

  const handleAdd = (activityId: string) => {
    if (onAddActivity) onAddActivity(activityId);
  };

  const handleFlag = (activityId: string) => {
    const reason = prompt('Why are you flagging this activity?');
    if (reason && onFlagActivity) onFlagActivity(activityId, reason);
  };

  const handleEdit = (activity: Activity) => {
    console.log('Edit activity:', activity.id);
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  const isSpotlight = (activity: Activity) => {
    return activity.is_featured && activity.status === 'published';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Places Hub Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-200/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Places Hub</h2>
            <p className="text-sm text-muted-foreground">{selectedCity} • {activities.length} Venues Pinned</p>
            <p className="text-xs text-muted-foreground mt-1">Places & Venue Discovery — Convert any place into a team activity!</p>
          </div>
          {onAddNewActivity && (
            <Button onClick={onAddNewActivity} className="flex items-center gap-1.5">
              <LucideIcon name="Plus" size={16} />
              Add Activity
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <LucideIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Google Places (e.g., Climbing, Park, Museum, Cafe)..."
          className="pl-10 py-6 text-sm"
        />
      </div>

      {/* City Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">City:</span>
        {CITIES.map((city) => (
          <Button
            key={city}
            variant={selectedCity === city ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCity(city)}
            className="text-xs"
          >
            {city === 'All Cities' ? '🌍' : '📍'} {city}
          </Button>
        ))}
      </div>

      {/* Venue Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Venue Type:</span>
        {VENUE_TYPES.map((type) => (
          <Button
            key={type}
            variant={venueType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVenueType(type)}
            className="text-xs"
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Places Grid */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p className="text-lg">No places discovered yet</p>
          <p className="text-sm">Explore local venues and convert them into activities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => {
            const spotlight = isSpotlight(activity);

            return (
              <AdminActivityCard
                key={activity.id}
                activity={activity}
                onAdd={() => handleAdd(activity.id)}
                onFeature={() => handleFeature(activity.id)}
                onArchive={() => {
                  if (confirm('Archive this place?')) {
                    // Archive logic handled by parent
                  }
                }}
                onEdit={() => handleEdit(activity)}
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