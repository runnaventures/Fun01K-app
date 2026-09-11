// src/features/shared/activities/components/EmployeeSocialFeed.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { EmployeeActivityCard } from './EmployeeActivityCard';
import { Activity } from '../types/activity.types';

interface EmployeeSocialFeedProps {
  loadActivities?: (
    searchTerm?: string,
    selectedCity?: string,
    selectedDomain?: string
  ) => Promise<Activity[]>;
  onJoinActivity?: (activityId: string) => void;
  onFlagActivity?: (activityId: string, reason: string) => void;
  userInterests?: string[];
  organizationId?: string;
  joinedActivityIds?: string[];
}

const CITIES = [
  'Atlanta',
  'San Francisco',
  'New York',
  'Austin',
  'Seattle',
  'Chicago',
  'Denver',
  'London',
  'Remote/Virtual',
  'All Cities',
];
const DOMAINS = ['All', 'Learning', 'Sports', 'Wellness', 'Hobby', 'Social'];

export function EmployeeSocialFeed({
  loadActivities,
  onJoinActivity,
  onFlagActivity,
  userInterests = [],
  joinedActivityIds = [],
}: EmployeeSocialFeedProps) {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Atlanta');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  useEffect(() => {
    if (loadActivities) {
      fetchActivities();
    } else {
      loadSocialActivities();
    }
  }, [selectedCity, selectedDomain, searchTerm]);

  const loadSocialActivities = async () => {
    setIsLoading(true);
    try {
      const organizationId = organizationMember?.organization_id;

      let query = supabase
        .from('activities')
        .select('*')
        .in('status', ['published', 'active'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
      }

      if (selectedDomain !== 'All') {
        const { data: categoryData } = await supabase
          .from('activity_categories')
          .select('id')
          .ilike('name', `%${selectedDomain}%`)
          .maybeSingle();

        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const orgIds = [
          ...new Set(data.map((a: any) => a.organization_id).filter(Boolean)),
        ];
        const catIds = [
          ...new Set(data.map((a: any) => a.category_id).filter(Boolean)),
        ];

        const [orgResult, catResult] = await Promise.all([
          orgIds.length > 0
            ? supabase.from('organizations').select('id, name').in('id', orgIds)
            : { data: [] },
          catIds.length > 0
            ? supabase
                .from('activity_categories')
                .select('id, name, icon, color')
                .in('id', catIds)
            : { data: [] },
        ]);

        const orgMap = Object.fromEntries(
          (orgResult.data || []).map((o: any) => [o.id, o])
        );
        const catMap = Object.fromEntries(
          (catResult.data || []).map((c: any) => [c.id, c])
        );

        const enriched = data.map((item: any) => ({
          ...item,
          organization: orgMap[item.organization_id] || null,
          category: catMap[item.category_id] || null,
          location: item.location || orgMap[item.organization_id]?.name || null,
        }));

        setActivities(enriched);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading social activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!loadActivities) return;
    setIsLoading(true);
    try {
      const data = await loadActivities(searchTerm, selectedCity, selectedDomain);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityChange = (city: string) => {
    if (city === '++ Custom City') {
      setShowCustomCity(true);
    } else {
      setShowCustomCity(false);
      setSelectedCity(city);
    }
  };

  const handleCustomCityAdd = () => {
    if (customCity.trim()) {
      setSelectedCity(customCity.trim());
      setShowCustomCity(false);
      setCustomCity('');
    }
  };

  const handleJoin = (activityId: string) => {
    if (onJoinActivity) onJoinActivity(activityId);
  };

  const handleFlag = (activityId: string) => {
    const reason = prompt('Why are you flagging this activity?');
    if (reason && onFlagActivity) onFlagActivity(activityId, reason);
  };

  const handleDetails = (activity: Activity) => {
    alert(
      `📋 ${activity.title}\n\n${activity.description || 'No description'}\n\n📍 ${
        activity.location || 'Global'
      }\n⭐ ${activity.points} PTS`
    );
  };

  const isSpotlight = (activity: Activity) => {
    return activity.is_featured && activity.status === 'published';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ Outer wrapper: space-y-6
  return (
    <div className="space-y-6">
      {/* Social Hub Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-200/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Social Hub</h2>
              <Badge variant="secondary" className="text-xs">
                {selectedCity} • {activities.length} Activities Found
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Social Activities &amp; Community Feed
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Discover real-world meetups, hobby clubs, and social events around you.
              Join with coworkers to build connections and earn reward points!
            </p>
          </div>
        </div>
      </div>

      {/* Remote Worker Hub */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🌍</div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">
              Remote Worker Activity Hub
            </h3>
            <p className="text-xs text-amber-700">
              <span className="font-medium">Multi-City</span> — Suggesting activities
              for remote employees? Select or type ANY city worldwide (e.g. Seattle,
              Chicago, Denver, London, Toronto, Berlin) to generate and import local
              community Meetups for remote staff!
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <LucideIcon
          name="Search"
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Meetup topic, group, or keyword (e.g., AI, Coffee, Yoga)..."
          className="pl-10 py-6 text-sm"
        />
      </div>

      {/* City Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          City Hub:
        </span>
        {CITIES.map((city) => (
          <Button
            key={city}
            variant={selectedCity === city ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCityChange(city)}
            className="text-xs"
          >
            {city === 'All Cities' ? '🌍' : city === '++ Custom City' ? '➕' : '📍'}{' '}
            {city}
          </Button>
        ))}
      </div>

      {/* Custom City Input */}
      {showCustomCity && (
        <div className="flex items-center gap-2">
          <Input
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="Enter custom city name..."
            className="w-48"
          />
          <Button size="sm" onClick={handleCustomCityAdd}>
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomCity(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Location & Domain Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Location:</span>
          <Badge variant="secondary" className="text-xs">
            {selectedCity}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Domain:
          </span>
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
      </div>

      {/* Activities Grid — the only grid */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p className="text-lg">No social activities found</p>
          <p className="text-sm">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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