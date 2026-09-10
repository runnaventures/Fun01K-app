// src/features/activities/components/EmployeeFeaturedFeed.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { EmployeeActivityCard } from './EmployeeActivityCard';
import { Activity } from '../types/activity.types';

interface EmployeeFeaturedFeedProps {
  loadActivities: () => Promise<Activity[]>;
  onJoinActivity: (activityId: string) => void;
  onFlagActivity: (activityId: string, reason: string) => void;
  userInterests?: string[];
  organizationId?: string;
  joinedActivityIds?: string[];
}

const DOMAINS = ['All', 'Wellness', 'Sports', 'Social', 'Hobby', 'Learning', 'Completed'];

export function EmployeeFeaturedFeed({
  loadActivities,
  onJoinActivity,
  onFlagActivity,
  userInterests = [],
  joinedActivityIds = [],
}: EmployeeFeaturedFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  useEffect(() => {
    fetchActivities();
  }, [searchTerm, selectedDomain]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await loadActivities();
      let filtered = data;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(a => 
          a.title.toLowerCase().includes(term) || 
          (a.description?.toLowerCase() || '').includes(term)
        );
      }
      
      if (selectedDomain !== 'All' && selectedDomain !== 'Completed') {
        filtered = filtered.filter(a => 
          a.category?.name?.toLowerCase() === selectedDomain.toLowerCase()
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

  const handleDetails = (activity: Activity) => {
    alert(`📋 ${activity.title}\n\n${activity.description || 'No description'}\n\n📍 ${activity.location || 'Global'}\n⭐ ${activity.points} PTS`);
  };

  const handleJoin = (activityId: string) => {
    onJoinActivity(activityId);
  };

  const handleFlag = (activityId: string) => {
    const reason = prompt('Why are you flagging this activity?');
    if (reason) onFlagActivity(activityId, reason);
  };

  const isSpotlight = (activity: Activity) => {
    return activity.is_featured && activity.status === 'published';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Featured Hub Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured Hub</h2>
            <p className="text-sm text-muted-foreground">
              {activities.length} Activities Available • {activities.length} Total Curated
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Company Featured Activities & Events</p>
            <p className="text-xs text-muted-foreground">Join coworker-hosted workshops, wellness meetups, and team gatherings</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <LucideIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search featured activities (e.g., Climbing, Coffee, Yoga, Hackathon, Book Club...)"
            className="pl-10 py-6 text-sm"
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {activities.length} Activities Found
        </div>
      </div>

      {/* Domain Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Domain:</span>
        {DOMAINS.map((domain) => (
          <Button
            key={domain}
            variant={selectedDomain === domain ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDomain(domain)}
            className="text-xs"
          >
            {domain}
          </Button>
        ))}
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p className="text-lg">No featured activities found</p>
          <p className="text-sm">Check back later for company featured activities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => {
            const interestMatch = userInterests.some((interest: string) => 
              activity.interest_tags?.includes(interest)
            );
            const spotlight = isSpotlight(activity);
            const isJoined = joinedActivityIds.includes(activity.id);

            return (
              <EmployeeActivityCard
                key={activity.id}
                activity={activity}
                onJoin={() => handleJoin(activity.id)}
                onFlag={() => handleFlag(activity.id)}
                onDetails={() => handleDetails(activity)}
                isFeatured={!!activity.is_featured}
                isSpotlight={spotlight}
                interestMatch={interestMatch}
                isJoined={isJoined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}