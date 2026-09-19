// src/features/shared/activities/components/EmployeePlacesFeed.tsx

import { useMemo, useState } from 'react';
import {
  MapPin,
  Search,
  Coins,
  Loader2,
  Check,
  X,
  Star,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useGooglePlaces, type GooglePlace } from '../hooks/useGooglePlaces';
import {
  useEmployeePlaces,
  useCheckIn,
  useProfileCity,
  useSelfCheckinBudget,
  useSelfCheckIn,
  type FeaturedPlace,
} from '../hooks/useEmployeePlaces';

const PRESET_CITIES = [
  'Atlanta',
  'San Francisco',
  'New York',
  'Austin',
  'Seattle',
  'Chicago',
  'Denver',
  'London',
  'Toronto',
  'Berlin',
];

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://bteqcbfdbsmszitaxuiy.supabase.co';

function placeIcon(place: GooglePlace): string {
  const types = place.types || [];
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('food')) return '☕';
  if (types.includes('gym') || types.includes('stadium') || types.includes('sports_complex')) return '⚽';
  if (types.includes('museum') || types.includes('art_gallery')) return '🎨';
  if (types.includes('park') || types.includes('tourist_attraction')) return '🌳';
  if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
  return '📍';
}

export function EmployeePlacesFeed() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id;

  // ─── City ────────────────────────────────────────────────────────
  const {
    city: defaultCity,
    isLoading: cityLoading,
    saveCity,
  } = useProfileCity(user?.id);

  // ─── Featured (admin-curated) — may be empty; that's fine ────────
  const {
    places: featured,
    isLoading: featuredLoading,
    reload: reloadFeatured,
  } = useEmployeePlaces(organizationId);
  const { checkIn: checkInFeatured } = useCheckIn();

  // ─── Self check-in budget ────────────────────────────────────────
  const { budget, reload: reloadBudget } = useSelfCheckinBudget(
    user?.id,
    organizationId
  );
  const { selfCheckIn } = useSelfCheckIn();

  // ─── Discover (Google Places by default city) ────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useMemo(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const {
    places: discovered,
    isLoading: discoveredLoading,
    error: discoveredError,
  } = useGooglePlaces({
    city: defaultCity ?? undefined,
    keyword: debouncedSearch.trim() || undefined,
    maxResults: 20,
    enabled: !!defaultCity,
  });

  // ─── UI state ────────────────────────────────────────────────────
  const [pendingFeaturedId, setPendingFeaturedId] = useState<string | null>(null);
  const [pendingDiscoverId, setPendingDiscoverId] = useState<string | null>(null);
  const [selfCheckedInIds, setSelfCheckedInIds] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState<{
    title: string;
    points: number;
    kind: 'featured' | 'self';
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Featured check-in ───────────────────────────────────────────
  const handleFeaturedCheckIn = async (place: FeaturedPlace) => {
    setPendingFeaturedId(place.id);
    setSuccess(null);
    setErrorMsg(null);
    try {
      const result = await checkInFeatured(place.id);
      if (!result.ok) {
        const messages: Record<string, string> = {
          already_checked_in: 'You have already checked in here.',
          too_far: `You need to be closer — you are ${result.distance_meters ?? '?'}m away.`,
          completion_limit_reached: 'This activity has reached its completion limit.',
          activity_not_available: 'This venue is no longer available.',
          activity_not_found: 'This venue no longer exists.',
          not_authenticated: 'Please sign in again.',
        };
        setErrorMsg(messages[result.error || ''] || 'Check-in failed.');
        return;
      }
      setSuccess({
        title: place.title,
        points: result.points_awarded ?? place.points,
        kind: 'featured',
      });
      setTimeout(() => setSuccess(null), 6000);
      reloadFeatured();
      reloadBudget();
    } catch (err: any) {
      handleGeoError(err);
    } finally {
      setPendingFeaturedId(null);
    }
  };

  // ─── Self check-in ───────────────────────────────────────────────
  const handleSelfCheckIn = async (place: GooglePlace) => {
    setPendingDiscoverId(place.place_id);
    setSuccess(null);
    setErrorMsg(null);
    try {
      const result = await selfCheckIn({
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        types: place.types,
      });

      if (!result.ok) {
        const messages: Record<string, string> = {
          already_checked_in: 'You have already checked in here.',
          no_active_org: 'You are not an active member of any organization.',
          not_authenticated: 'Please sign in again.',
        };
        setErrorMsg(messages[result.error || ''] || 'Check-in failed.');
        return;
      }

      setSelfCheckedInIds((prev) => new Set(prev).add(place.place_id));
      setSuccess({
        title: place.name,
        points: result.points_awarded ?? 0,
        kind: 'self',
      });
      setTimeout(() => setSuccess(null), 6000);
      reloadBudget();
    } catch (err: any) {
      handleGeoError(err);
    } finally {
      setPendingDiscoverId(null);
    }
  };

  const handleGeoError = (err: any) => {
    const msg = String(err?.message || err);
    if (msg.includes('denied') || msg.includes('permission')) {
      setErrorMsg('Location permission denied. Enable it in your browser to check in.');
    } else if (msg.includes('timeout')) {
      setErrorMsg('Could not get your location. Try again.');
    } else {
      setErrorMsg('Check-in failed. Try again.');
    }
  };

  // ─── Filter featured by search ───────────────────────────────────
  const filteredFeatured = useMemo(() => {
    if (!debouncedSearch.trim()) return featured;
    const term = debouncedSearch.trim().toLowerCase();
    return featured.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.location || '').toLowerCase().includes(term)
    );
  }, [featured, debouncedSearch]);

  // ─── Dedupe: discovered places already featured ──────────────────
  const featuredPlaceIds = useMemo(
    () => new Set(featured.map((f) => f.external_id).filter(Boolean)),
    [featured]
  );

  if (cityLoading || featuredLoading) return <LoadingScreen />;

  const budgetRemaining = budget?.remaining ?? 0;

  return (
    <div className="space-y-6">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" />
              Places Near You
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Explore, Visit &amp; Earn
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Check in at featured venues to earn full points, or discover nearby
              places and earn self check-in points.
            </p>
          </div>
          {defaultCity && (
            <button
              onClick={() => saveCity('')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              <MapPin className="h-4 w-4" />
              {defaultCity}
              <span className="text-[10px] opacity-60">Change</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── City inline banner (when no default city set) ────── */}
      {!defaultCity && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                Set your default city to discover places
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Pick a city to see venues around you. You can change it later.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => saveCity(c)}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Success banner ───────────────────────────────────── */}
      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Checked in at {success.title}!
            </p>
            <p className="text-xs text-emerald-700">
              {success.points > 0
                ? `+${success.points} points added to your balance.`
                : 'Visit recorded. Self check-in budget exhausted for this period.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Error banner ─────────────────────────────────────── */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
            <X className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-800">Check-in failed</p>
            <p className="text-xs text-rose-700">{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Search ───────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              defaultCity
                ? `Search venues and places in ${defaultCity}...`
                : 'Set your city to start searching...'
            }
            disabled={!defaultCity}
            className="pl-11 h-12 text-sm border-slate-200 bg-slate-50 focus:bg-white rounded-xl disabled:opacity-50"
          />
        </div>
      </div>

      {/* ─── SECTION 1: Featured for Your Team ────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Star className="h-4 w-4 fill-indigo-600" />
          </div>
          <h3 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
            Featured for Your Team ({filteredFeatured.length})
          </h3>
        </div>

        {filteredFeatured.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center">
            <MapPin className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-bold text-slate-800">
              No featured places yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ask your company admin to feature venues for your team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatured.map((place) => {
              const isPendingThis = pendingFeaturedId === place.id;
              const hasCoords =
                place.location_lat !== null && place.location_lng !== null;

              return (
                <div
                  key={place.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {place.image_url ? (
                      <img
                        src={place.image_url}
                        alt={place.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        📍
                      </div>
                    )}
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                      <Coins className="h-3 w-3" />
                      +{place.points} PTS
                    </span>
                    <span className="absolute left-3 top-3 rounded-lg bg-indigo-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Featured
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                      {place.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {place.location || place.description || 'Featured venue'}
                    </p>

                    <div className="mt-auto space-y-2 pt-3">
                      {!hasCoords && (
                        <p className="text-[11px] text-slate-400">
                          GPS check-in unavailable
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={isPendingThis || !hasCoords}
                        onClick={() => handleFeaturedCheckIn(place)}
                        className={cn(
                          'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                          !hasCoords
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : isPendingThis
                            ? 'cursor-wait bg-slate-400 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        )}
                      >
                        {isPendingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting location…
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            Check In &amp; Earn {place.points} pts
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Discover more in <City> ─────────────────── */}
      {defaultCity && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
                Discover more in {defaultCity}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {discovered.length} places
            </span>
          </div>

          {discoveredError && (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
              Could not load places: {discoveredError}
            </div>
          )}

          {discoveredLoading && discovered.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-slate-500">
              Loading places…
            </div>
          ) : discovered.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <p className="text-base font-bold text-slate-800">
                No places found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {discovered
                .filter((p) => !featuredPlaceIds.has(p.place_id))
                .map((place) => {
                  const isPendingThis = pendingDiscoverId === place.place_id;
                  const alreadyCheckedIn = selfCheckedInIds.has(place.place_id);
                  const budgetExhausted = budgetRemaining <= 0;
                  const photoUrl = place.photo_name
                    ? `${SUPABASE_URL}/functions/v1/places-photo?name=${encodeURIComponent(
                        place.photo_name
                      )}&maxWidth=800`
                    : null;

                  return (
                    <div
                      key={place.place_id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
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
                          </span>
                        )}

                        <span className="absolute left-3 top-3 rounded-lg bg-slate-900/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {budgetExhausted ? 'Budget used' : 'Earn 5 pts'}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-900">
                          {place.name}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {place.address}
                        </p>

                        <div className="mt-auto pt-3">
                          <button
                            type="button"
                            disabled={isPendingThis || alreadyCheckedIn}
                            onClick={() => handleSelfCheckIn(place)}
                            className={cn(
                              'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors',
                              alreadyCheckedIn
                                ? 'cursor-default bg-emerald-100 text-emerald-700'
                                : isPendingThis
                                ? 'cursor-wait bg-slate-300 text-slate-600'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            {alreadyCheckedIn ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Checked In
                              </>
                            ) : isPendingThis ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Getting location…
                              </>
                            ) : (
                              <>
                                <MapPin className="h-3.5 w-3.5" />
                                Check In Here
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}