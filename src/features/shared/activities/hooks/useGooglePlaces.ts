// src/features/shared/activities/hooks/useGooglePlaces.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface GooglePlace {
  place_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  user_ratings_total: number | null;
  photo_name: string | null;
  types: string[];
  open_now: boolean | null;
}

interface UseGooglePlacesParams {
  city?: string;
  latitude?: number;
  longitude?: number;
  keyword?: string;
  radiusMeters?: number;
  maxResults?: number;
  enabled?: boolean;
}

export function useGooglePlaces({
  city,
  latitude,
  longitude,
  keyword,
  radiusMeters = 5000,
  maxResults = 20,
  enabled = true,
}: UseGooglePlacesParams) {
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!city && (latitude === undefined || longitude === undefined)) return;

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'places-search',
          {
            body: {
              city,
              latitude,
              longitude,
              keyword,
              radiusMeters,
              maxResults,
            },
          }
        );
        if (invokeError) throw invokeError;
        if (cancelled) return;
        const list = ((data as any)?.places ?? []) as GooglePlace[];
        setPlaces(list);
      } catch (err: any) {
        if (cancelled) return;
        console.error('places-search failed:', err);
        setError(err?.message || 'Failed to load places');
        setPlaces([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [city, latitude, longitude, keyword, radiusMeters, maxResults, enabled]);

  return { places, isLoading, error };
}