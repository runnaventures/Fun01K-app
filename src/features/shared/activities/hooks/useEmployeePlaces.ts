// src/features/shared/activities/hooks/useEmployeePlaces.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Existing: featured venues ───────────────────────────────────────

export interface FeaturedPlace {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  points: number;
  external_id: string | null;
  organization_id: string | null;
  check_in_radius_meters: number | null;
  completion_limit: number | null;
  image_url: string | null;
  status: string;
}

export function useEmployeePlaces(organizationId?: string) {
  const [places, setPlaces] = useState<FeaturedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setPlaces([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('activities')
        .select(
          'id, title, description, location, location_lat, location_lng, points, external_id, organization_id, check_in_radius_meters, completion_limit, image_url, status'
        )
        .eq('external_source', 'google_places')
        .eq('is_featured', true)
        .in('status', ['active', 'published'])
        .order('created_at', { ascending: false });

      query = query.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      );

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      setPlaces((data || []) as FeaturedPlace[]);
    } catch (err: any) {
      console.error('useEmployeePlaces:', err);
      setError(err?.message || 'Failed to load places');
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { places, isLoading, error, reload: load };
}

// ─── Existing: featured venue check-in ───────────────────────────────

export function useCheckIn() {
  const [isPending, setIsPending] = useState(false);

  const checkIn = async (activityId: string) => {
    setIsPending(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported on this device'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.rpc('check_in_place', {
        p_activity_id: activityId,
        p_lat: latitude,
        p_lng: longitude,
      });

      if (error) throw error;

      const result = data as {
        ok: boolean;
        error?: string;
        points_awarded?: number;
        distance_meters?: number | null;
      };

      return { latitude, longitude, ...result };
    } finally {
      setIsPending(false);
    }
  };

  return { checkIn, isPending };
}

// ─── NEW: employee default city ──────────────────────────────────────

export function useProfileCity(profileId?: string) {
  const [city, setCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_city')
          .eq('id', profileId)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setCity((data?.default_city as string | null) ?? null);
      } catch (err) {
        console.error('useProfileCity:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const saveCity = useCallback(
    async (next: string) => {
      if (!profileId) return;
      setCity(next);
      const { error } = await supabase
        .from('profiles')
        .update({ default_city: next })
        .eq('id', profileId);
      if (error) {
        console.error('saveCity failed:', error);
      }
    },
    [profileId]
  );

  return { city, isLoading, saveCity };
}

// ─── NEW: self check-in budget ───────────────────────────────────────

export interface SelfCheckinBudget {
  remaining: number;
  allowance: number;
  used: number;
  periodEnd: string | null;
}

export function useSelfCheckinBudget(
  profileId?: string,
  organizationId?: string
) {
  const [budget, setBudget] = useState<SelfCheckinBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profileId || !organizationId) {
      setBudget(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('self_checkin_budgets')
        .select('points_allowance, points_used, period_end')
        .eq('profile_id', profileId)
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        // No budget row yet for this period — the RPC will create it on first check-in.
        // Show the org's full allowance as the "remaining" value.
        const { data: org } = await supabase
          .from('organizations')
          .select('self_checkin_budget')
          .eq('id', organizationId)
          .maybeSingle();
        const allowance = Number(org?.self_checkin_budget ?? 50);
        setBudget({
          remaining: allowance,
          allowance,
          used: 0,
          periodEnd: null,
        });
        return;
      }

      const allowance = Number(data.points_allowance ?? 0);
      const used = Number(data.points_used ?? 0);
      setBudget({
        remaining: Math.max(0, allowance - used),
        allowance,
        used,
        periodEnd: (data.period_end as string) ?? null,
      });
    } catch (err) {
      console.error('useSelfCheckinBudget:', err);
      setBudget(null);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { budget, isLoading, reload: load };
}

// ─── NEW: self check-in at any discovered place ──────────────────────

export function useSelfCheckIn() {
  const [isPending, setIsPending] = useState(false);

  const selfCheckIn = async (place: {
    place_id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    types: string[];
  }) => {
    setIsPending(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported on this device'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.rpc('self_check_in_place', {
        p_place_id: place.place_id,
        p_place_name: place.name,
        p_place_address: place.address,
        p_place_lat: place.latitude,
        p_place_lng: place.longitude,
        p_place_types: place.types,
        p_lat: latitude,
        p_lng: longitude,
      });

      if (error) throw error;

      return data as {
        ok: boolean;
        error?: string;
        points_awarded?: number;
        remaining_budget?: number;
        period_end?: string;
      };
    } finally {
      setIsPending(false);
    }
  };

  return { selfCheckIn, isPending };
}