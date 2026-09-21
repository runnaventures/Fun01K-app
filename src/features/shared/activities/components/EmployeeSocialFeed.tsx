// src/features/shared/activities/components/EmployeeSocialFeed.tsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Users, MapPin, Search, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeActivityCard } from './EmployeeActivityCard';
import { useActiveInterests } from '../hooks/useActiveInterests';
import type { Activity } from '../types/activity.types';

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

const PRESET_CITIES = [
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

export function EmployeeSocialFeed({
  loadActivities,
  onJoinActivity,
  onFlagActivity,
  userInterests = [],
  joinedActivityIds = [],
}: EmployeeSocialFeedProps) {
  const { organizationMember } = useOrganization();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const hasLoadedOnce = useRef(false);

  // Dynamic taxonomy chips
  const { interests } = useActiveInterests();
  const domains = useMemo(
    () => ['All', ...interests.map((i) => i.name)],
    [interests]
  );

  const [selectedCity, setSelectedCity] = useState('Atlanta');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [customCities, setCustomCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedDomain, debouncedSearch]);

  const run = async () => {
    if (hasLoadedOnce.current) setIsRefetching(true);
    else setIsInitialLoading(true);
    try {
      const data = loadActivities
        ? await loadActivities(debouncedSearch, selectedCity, selectedDomain)
        : await inlineLoad();
      setActivities(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error loading social activities:', err);
      setActivities([]);
    } finally {
      setIsInitialLoading(false);
      setIsRefetching(false);
    }
  };

  const inlineLoad = async (): Promise<Activity[]> => {
    const organizationId = organizationMember?.organization_id;
    let query = supabase
      .from('activities')
      .select(`
        *,
        interest:interest_id(id, name, icon, color),
        sub_interest:sub_interest_id(id, name, slug)
      `)
      .in('status', ['published', 'active'])
      .order('created_at', { ascending: false })
      .limit(50);
    if (organizationId) {
      query = query.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      );
    }
    if (debouncedSearch) {
      query = query.or(
        `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
      );
    }
    if (selectedDomain !== 'All') {
      const { data: interest } = await supabase
        .from('interests')
        .select('id')
        .ilike('name', selectedDomain)
        .maybeSingle();
      if (interest?.id) query = query.eq('interest_id', interest.id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Activity[];
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    setShowCustomCity(false);
  };

  const openCustomCityInput = () => {
    setShowCustomCity(true);
  };

  const applyCustomCity = () => {
    const trimmed = customCity.trim();
    if (!trimmed) return;
    setCustomCities((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setSelectedCity(trimmed);
    setShowCustomCity(false);
    setCustomCity('');
  };

  const handleJoin = (id: string) => onJoinActivity?.(id);
  const handleFlag = (id: string) => {
    const reason = prompt('Why are you flagging this activity?');
    if (reason) onFlagActivity?.(id, reason);
  };
  const handleDetails = (activity: Activity) => {
    alert(
      `📋 ${activity.title}\n\n${activity.description || 'No description'}\n\n📍 ${
        activity.location || 'Global'
      }\n⭐ ${activity.points} PTS`
    );
  };
  const isSpotlight = (a: Activity) =>
    !!a.is_featured && a.status === 'published';

  if (isInitialLoading) return <LoadingScreen />;

  return (
    <div className="space-y-5">
      {isRefetching && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          Updating…
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Users className="h-3.5 w-3.5" />
              Social Hub
            </span>
            <p className="mt-2 text-xs font-medium text-white/60">
              {selectedCity} • {activities.length} Activities Found
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Social Activities &amp; Community Feed
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Discover real-world meetups, hobby clubs, and social events around
              you. Join with coworkers to build connections and earn reward
              points!
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" />
            {selectedCity}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 px-5 py-4 text-white shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
          <Globe className="h-5 w-5 text-indigo-300" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">Remote Worker Activity Hub</h3>
            <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">
              Multi-City
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/70">
            Working from anywhere? Select or type{' '}
            <span className="font-semibold text-white">ANY city worldwide</span>{' '}
            (e.g. Seattle, Chicago, Denver, London, Toronto, Berlin) to discover
            local meetups and activities near you.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Meetup topic, group, or keyword (e.g., AI, Coffee, Yoga)..."
            className="pl-11 h-12 text-sm border-slate-200 bg-slate-50 focus:bg-white rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <MapPin className="h-4 w-4" />
            City Hub:
          </span>

          {PRESET_CITIES.map((city) => {
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {city === 'All Cities' ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                {city}
              </button>
            );
          })}

          {customCities.map((city) => {
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                title="Custom city"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {city}
              </button>
            );
          })}

          <button
            onClick={openCustomCityInput}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
              showCustomCity
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            )}
          >
            <span className="text-sm leading-none">+</span>
            Custom City
          </button>
        </div>

        {showCustomCity && (
          <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Type any city:
            </span>
            <Input
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              placeholder="e.g., Toronto, Berlin, Sydney..."
              className="h-9 w-64 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyCustomCity();
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg bg-slate-900 px-4 text-xs font-semibold hover:bg-slate-800"
              onClick={applyCustomCity}
            >
              Add City
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg px-4 text-xs font-semibold"
              onClick={() => {
                setShowCustomCity(false);
                setCustomCity('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Interest:
        </span>
        {domains.map((domain) => {
          const isActive = selectedDomain === domain;
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              )}
            >
              {domain}
            </button>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No social activities found</p>
          <p className="text-sm">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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