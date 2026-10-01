// src/features/shared/activities/components/AdminPlacesFeed.tsx

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import {
  MapPin,
  Search,
  Globe,
  Filter,
  Star,
  Plus,
  Check,
  Loader2,
  Pencil,
  EyeOff,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGooglePlaces, type GooglePlace } from '../hooks/useGooglePlaces';
import { useActiveInterests } from '../hooks/useActiveInterests';

interface AdminPlacesFeedProps {
  onFeatureActivity?: (activityId: string) => void;
  refreshKey?: number;
}

interface FeaturedRow {
  id: string;
  external_id: string;
  points: number;
  completion_limit: number | null;
  status: string;
}

const PRESET_CITIES = [
  'San Francisco',
  'Atlanta',
  'New York',
  'Austin',
  'Seattle',
  'Chicago',
  'All Cities',
];

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://bteqcbfdbsmszitaxuiy.supabase.co';

const DEFAULT_POINTS = 50;
const DEFAULT_RADIUS_METERS = 200;

function placeIcon(place: GooglePlace): string {
  const types = place.types || [];
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('food')) return '☕';
  if (types.includes('gym') || types.includes('stadium') || types.includes('sports_complex')) return '⚽';
  if (types.includes('museum') || types.includes('art_gallery')) return '🎨';
  if (types.includes('park') || types.includes('tourist_attraction')) return '🌳';
  if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
  return '📍';
}

export function AdminPlacesFeed({
  onFeatureActivity,
  refreshKey = 0,
}: AdminPlacesFeedProps) {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id;

  // Dynamic taxonomy
  const { interests } = useActiveInterests();

  const [selectedCity, setSelectedCity] = useState('Atlanta');
  const [venueType, setVenueType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [customCities, setCustomCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Chip list: 'All' plus taxonomy interests
  const venueTypes = useMemo(
    () => ['All', ...interests.map((i) => i.name)],
    [interests]
  );

  // Keyword mapping for Google Places (places_keyword || name)
  const keywordByInterestName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const i of interests) {
      map[i.name.toLowerCase()] = (i.places_keyword || i.name).toLowerCase();
    }
    return map;
  }, [interests]);

  const queryCity = selectedCity === 'All Cities' ? 'Atlanta' : selectedCity;
  const queryKeyword =
    debouncedSearch.trim() ||
    (venueType !== 'All'
      ? keywordByInterestName[venueType.toLowerCase()]
      : undefined);

  const { places, isLoading, error } = useGooglePlaces({
    city: queryCity,
    keyword: queryKeyword,
    maxResults: 20,
    enabled: true,
  });

  // ─── Featured state ──────────────────────────────────────────────
  const [featuredByExternalId, setFeaturedByExternalId] = useState<
    Record<string, FeaturedRow>
  >({});
  const [featuredRefresh, setFeaturedRefresh] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // ─── Inline feature form ─────────────────────────────────────────
  const [configuringPlaceId, setConfiguringPlaceId] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<{ points: number; completion_limit: string }>({
    points: DEFAULT_POINTS,
    completion_limit: '',
  });

  // ─── Edit points form ────────────────────────────────────────────
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<number>(DEFAULT_POINTS);
  const [editingLimit, setEditingLimit] = useState<string>('');

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      const { data, error: qErr } = await supabase
        .from('activities')
        .select('id, external_id, points, completion_limit, status')
        .eq('organization_id', organizationId)
        .eq('external_source', 'google_places')
        .in('status', ['active', 'published']);
      if (cancelled) return;
      if (qErr) {
        console.error('featured check failed:', qErr);
        return;
      }
      const map: Record<string, FeaturedRow> = {};
      for (const row of (data as any[]) || []) {
        if (row.external_id) map[row.external_id] = row as FeaturedRow;
      }
      setFeaturedByExternalId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey, featuredRefresh]);

  // ─── Feature ─────────────────────────────────────────────────────
  const openConfigureForm = (place: GooglePlace) => {
    setConfiguringPlaceId(place.place_id);
    setConfigForm({ points: DEFAULT_POINTS, completion_limit: '' });
  };

  const cancelConfigureForm = () => {
    setConfiguringPlaceId(null);
    setConfigForm({ points: DEFAULT_POINTS, completion_limit: '' });
  };

  const handleFeature = async (place: GooglePlace, points: number, limit: string) => {
    if (!organizationId || !user?.id) return;

    setPendingId(place.place_id);
    try {
      const { error: insertError } = await supabase.from('activities').insert({
        title: place.name,
        description: `From Google Places — ${place.address}`,
        organization_id: organizationId,
        points,
        duration: null,
        status: 'published',
        visibility: 'public',
        verification_method: 'gps',
        location: place.address,
        location_lat: place.latitude,
        location_lng: place.longitude,
        place_id: place.place_id,
        external_source: 'google_places',
        external_id: place.place_id,
        external_payload: place.photo_name
          ? { photo_name: place.photo_name }
          : null,
        source: 'google_places',
        created_by: user.id,
        start_at: null,
        end_at: null,
        image_url: null,
        is_featured: true,
        featured_at: new Date().toISOString(),
        completion_limit: limit ? parseInt(limit) : null,
        check_in_radius_meters: DEFAULT_RADIUS_METERS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        if ((insertError as any).code === '23505') {
          alert('This place is already featured.');
          return;
        }
        throw insertError;
      }

      setFeaturedRefresh((n) => n + 1);
      cancelConfigureForm();
    } catch (err) {
      console.error('feature failed:', err);
      alert('Could not feature this place. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  // ─── Edit points ─────────────────────────────────────────────────
  const openEditPoints = (place: GooglePlace, featured: FeaturedRow) => {
    setEditingPlaceId(place.place_id);
    setEditingPoints(featured.points);
    setEditingLimit(featured.completion_limit !== null ? String(featured.completion_limit) : '');
  };

  const cancelEditPoints = () => {
    setEditingPlaceId(null);
  };

  const handleSavePoints = async (featured: FeaturedRow) => {
    setPendingId(featured.external_id);
    try {
      const { error: upErr } = await supabase
        .from('activities')
        .update({
          points: editingPoints,
          completion_limit: editingLimit ? parseInt(editingLimit) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', featured.id);
      if (upErr) throw upErr;
      setFeaturedRefresh((n) => n + 1);
      cancelEditPoints();
    } catch (err) {
      console.error('edit points failed:', err);
      alert('Could not update points. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  // ─── Unfeature ───────────────────────────────────────────────────
  const handleUnfeature = async (featured: FeaturedRow) => {
    if (!confirm("Remove this place from your employees' catalog?")) return;
    setPendingId(featured.external_id);
    try {
      const { error: upErr } = await supabase
        .from('activities')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', featured.id);
      if (upErr) throw upErr;
      setFeaturedRefresh((n) => n + 1);
    } catch (err) {
      console.error('unfeature failed:', err);
      alert('Could not unfeature this place. Try again.');
    } finally {
      setPendingId(null);
    }
  };

  // ─── City handlers ───────────────────────────────────────────────
  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    setShowCustomCity(false);
  };

  const openCustomCityInput = () => setShowCustomCity(true);

  const applyCustomCity = () => {
    const trimmed = customCity.trim();
    if (!trimmed) return;
    setCustomCities((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSelectedCity(trimmed);
    setShowCustomCity(false);
    setCustomCity('');
  };

  const mapQuery = useMemo(() => {
    const names = places.map((p) => p.name).filter(Boolean).slice(0, 10);
    if (names.length > 0) return names.join(' OR ');
    return queryCity;
  }, [places, queryCity]);

  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY as
    | string
    | undefined;

  if (isLoading && places.length === 0) return <LoadingScreen />;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" />
              Places Hub
            </span>
            <p className="mt-2 text-xs font-medium text-white/60">
              {selectedCity} • {places.length} Venues Pinned
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Places &amp; Venue Discovery
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Live Google Places search — browse real venues in your area and
              feature them for employees with a click.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" />
            {selectedCity}
          </span>
        </div>
      </div>

      {/* Search */}
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

      {/* City chips */}
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

      {/* Venue type (dynamic from taxonomy) */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Venue Type:
        </span>
        {venueTypes.map((type) => {
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

      {/* Map placeholder */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Interactive Places Map View
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {places.length} {places.length === 1 ? 'Venue' : 'Venues'} Pinned
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
              <h4 className="text-lg font-bold">Google Maps Interactive Canvas</h4>
              <p className="mt-2 max-w-lg text-sm text-white/70">
                Set{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  VITE_GOOGLE_MAPS_PLATFORM_KEY
                </code>{' '}
                in your <code>.env</code> to render the map tiles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
          Could not load Google Places: {error}
        </div>
      )}

      {/* Grid */}
      {places.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No places found</p>
          <p className="text-sm">Try a different city or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {places.map((place) => {
            const featured = featuredByExternalId[place.place_id];
            const isFeatured = !!featured;
            const isPending = pendingId === place.place_id;
            const isConfiguring = configuringPlaceId === place.place_id;
            const isEditing = editingPlaceId === place.place_id;
            const photoUrl = place.photo_name
              ? `${SUPABASE_URL}/functions/v1/places-photo?name=${encodeURIComponent(
                  place.photo_name
                )}&maxWidth=800`
              : null;

            return (
              <div
                key={place.place_id}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all',
                  isFeatured
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-md'
                )}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={place.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const parent = (e.currentTarget as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center', 'text-5xl');
                          parent.textContent = placeIcon(place);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      {placeIcon(place)}
                    </div>
                  )}

                  {place.rating !== null && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {place.rating.toFixed(1)}
                      {place.user_ratings_total !== null && (
                        <span className="ml-1 text-slate-400">
                          ({place.user_ratings_total.toLocaleString()})
                        </span>
                      )}
                    </span>
                  )}

                  {isFeatured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Check className="h-3 w-3" />
                      Featured · {featured.points} pts
                    </span>
                  )}

                  {place.open_now !== null && !isFeatured && (
                    <span
                      className={cn(
                        'absolute left-3 top-3 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm',
                        place.open_now
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      )}
                    >
                      {place.open_now ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                    {place.name}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {place.address}
                  </p>

                  {place.types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {place.types.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions — state machine */}
                  <div className="mt-auto space-y-2 pt-3">
                    {!isFeatured && !isConfiguring && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => openConfigureForm(place)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        Feature for Employees
                      </button>
                    )}

                    {isConfiguring && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                            Points to award on check-in
                          </p>
                          <button
                            type="button"
                            onClick={cancelConfigureForm}
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Points
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={configForm.points}
                              onChange={(e) =>
                                setConfigForm({
                                  ...configForm,
                                  points: parseInt(e.target.value) || DEFAULT_POINTS,
                                })
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Limit (optional)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={configForm.completion_limit}
                              onChange={(e) =>
                                setConfigForm({
                                  ...configForm,
                                  completion_limit: e.target.value,
                                })
                              }
                              placeholder="Unlimited"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleFeature(place, configForm.points, configForm.completion_limit)
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Publishing…
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Publish to Employees
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isFeatured && !isEditing && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPoints(place, featured)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Points
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleUnfeature(featured)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Unfeature
                        </button>
                      </div>
                    )}

                    {isFeatured && isEditing && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Update points
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Points
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={editingPoints}
                              onChange={(e) =>
                                setEditingPoints(parseInt(e.target.value) || DEFAULT_POINTS)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Limit (optional)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={editingLimit}
                              onChange={(e) => setEditingLimit(e.target.value)}
                              placeholder="Unlimited"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={cancelEditPoints}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSavePoints(featured)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}