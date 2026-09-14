// src/features/shared/activities/components/EmployeePlacesFeed.tsx

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { MapPin, Search, Globe, Map, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeActivityCard } from './EmployeeActivityCard';
import type { Activity } from '../types/activity.types';

interface EmployeePlacesFeedProps {
  loadActivities: (
    searchTerm?: string,
    selectedCity?: string,
    venueType?: string
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
  'All Cities',
];

const VENUE_TYPES = ['All', 'Wellness', 'Sports', 'Social', 'Hobby', 'Learning'];

export function EmployeePlacesFeed({
  loadActivities,
  onJoinActivity,
  onFlagActivity,
  userInterests = [],
  joinedActivityIds = [],
}: EmployeePlacesFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const hasLoadedOnce = useRef(false);

  const [selectedCity, setSelectedCity] = useState('Atlanta');
  const [venueType, setVenueType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [customCities, setCustomCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  // Google Maps API key (set VITE_GOOGLE_MAPS_PLATFORM_KEY in .env)
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY as
    | string
    | undefined;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCity, venueType]);

  const run = async () => {
    if (hasLoadedOnce.current) setIsRefetching(true);
    else setIsInitialLoading(true);
    try {
      const data = await loadActivities(debouncedSearch, selectedCity, venueType);
      setActivities(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error loading places:', err);
      setActivities([]);
    } finally {
      setIsInitialLoading(false);
      setIsRefetching(false);
    }
  };

  // â”€â”€â”€ City handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Card handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleJoin = (id: string) => onJoinActivity?.(id);
  const handleFlag = (id: string) => {
    const reason = prompt('Why are you flagging this place?');
    if (reason) onFlagActivity?.(id, reason);
  };
  const handleDetails = (activity: Activity) => {
    alert(
      `ðŸ“‹ ${activity.title}\n\n${activity.description || 'No description'}\n\nðŸ“ ${
        activity.location || 'Global'
      }\nâ­ ${activity.points} PTS`
    );
  };
  const isSpotlight = (a: Activity) =>
    !!a.is_featured && a.status === 'published';

  // Map query â€” uses loaded activity locations or falls back to city
  const mapQuery = (() => {
    const locations = activities
      .map((a) => a.location)
      .filter(Boolean)
      .slice(0, 10);
    if (locations.length > 0) return locations.join(' OR ');
    return selectedCity;
  })();

  if (isInitialLoading) return <LoadingScreen />;

  return (
    <div className="space-y-5">
      {isRefetching && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          Updatingâ€¦
        </div>
      )}

      {/* â”€â”€â”€ Hero banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" />
              Places Hub
            </span>
            <p className="mt-2 text-xs font-medium text-white/60">
              {selectedCity} â€¢ {activities.length} Venues Pinned
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Places &amp; Venue Discovery
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Explore activity spots, parks, climbing gyms, and wellness venues
              around your team's locations to potentially suggest and curate for
              employees.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" />
            {selectedCity}
          </span>
        </div>
      </div>

      {/* â”€â”€â”€ Search (own card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Google Places (e.g., Climbing, Park, Museum, Cafe)..."
            className="pl-11 h-12 text-sm border-slate-200 bg-slate-50 focus:bg-white rounded-xl"
          />
        </div>
      </div>

      {/* â”€â”€â”€ City chips (own card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <MapPin className="h-4 w-4" />
            City:
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

      {/* â”€â”€â”€ Venue Type (standalone row) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Category:
        </span>
        {VENUE_TYPES.map((type) => {
          const isActive = venueType === type;
          return (
            <button
              key={type}
              onClick={() => setVenueType(type)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              )}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* â”€â”€â”€ Interactive Places Map View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Interactive Places Map View
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {activities.length}{' '}
            {activities.length === 1 ? 'Venue' : 'Venues'} Pinned
          </span>
        </div>

        <div className="p-4">
          {googleMapsKey ? (
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-slate-100">
              <iframe
                title="Places Map"
                src={`https://www.google.com/maps/embed/v1/search?key=${googleMapsKey}&q=${encodeURIComponent(
                  mapQuery
                )}&zoom=12`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex h-[420px] w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-8 text-center text-white">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <MapPin className="h-8 w-8 text-white/80" />
              </div>
              <h4 className="text-lg font-bold">
                Google Maps Interactive Canvas
              </h4>
              <p className="mt-2 max-w-lg text-sm text-white/70">
                Connect your{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  GOOGLE_MAPS_PLATFORM_KEY
                </code>{' '}
                in Secrets to render live satellite tiles and dynamic place pin
                overlays!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€â”€ 2-column card grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No places discovered yet</p>
          <p className="text-sm">
            Explore local venues and convert them into activities
          </p>
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