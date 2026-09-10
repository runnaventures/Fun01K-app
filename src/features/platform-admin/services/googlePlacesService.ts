// src/features/platform-admin/services/googlePlacesService.ts

import { supabase } from '@/lib/supabase';

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  url?: string;
  website?: string;
  formatted_phone_number?: string;
  vicinity?: string;
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

class GooglePlacesService {
  private apiKey: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      // Get Google Places API config from platform settings
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'google_places_config')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const config = data.value;
        this.apiKey = config?.api_key || null;
        this.enabled = config?.enabled || false;
      }
    } catch (error) {
      console.error('Error loading Google Places config:', error);
      this.apiKey = null;
      this.enabled = false;
    }
  }

  private getApiKey(): string | null {
    return this.apiKey;
  }

  isEnabled(): boolean {
    return this.enabled && !!this.apiKey;
  }

  // Get place predictions (autocomplete)
  async getPlacePredictions(input: string): Promise<PlacePrediction[]> {
    if (!this.isEnabled() || !input || input.length < 2) {
      return [];
    }

    try {
      const apiKey = this.getApiKey();
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=geocode|establishment`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          structured_formatting: p.structured_formatting,
          types: p.types || [],
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      return [];
    }
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    if (!this.isEnabled() || !placeId) {
      return null;
    }

    try {
      const apiKey = this.getApiKey();
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address,geometry,types,rating,user_ratings_total,photos,url,website,formatted_phone_number,vicinity`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address || result.vicinity || '',
          geometry: result.geometry,
          types: result.types || [],
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          photos: result.photos?.map((p: any) => ({
            photo_reference: p.photo_reference,
            height: p.height,
            width: p.width,
          })),
          url: result.url,
          website: result.website,
          formatted_phone_number: result.formatted_phone_number,
          vicinity: result.vicinity,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  // Search places by text query
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<GooglePlace[]> {
    if (!this.isEnabled() || !query) {
      return [];
    }

    try {
      const apiKey = this.getApiKey();
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        return data.results.map((result: any) => ({
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address || result.vicinity || '',
          geometry: result.geometry,
          types: result.types || [],
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          photos: result.photos?.map((p: any) => ({
            photo_reference: p.photo_reference,
            height: p.height,
            width: p.width,
          })),
          vicinity: result.vicinity,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // Get photo URL
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string | null {
    const apiKey = this.getApiKey();
    if (!apiKey || !photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
  }
}

export const googlePlacesService = new GooglePlacesService();