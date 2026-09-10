// src/features/company-admin/services/locationService.ts

import { supabase } from '@/lib/supabase';

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationData {
  name: string;
  organization_id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  is_active?: boolean;
}

export interface UpdateLocationData {
  name?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  is_active?: boolean;
}

export const locationService = {
  async getLocations(organizationId?: string): Promise<Location[]> {
    let query = supabase.from('locations').select('*');
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Location[];
  },

  async getLocationById(id: string): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Location;
  },

  async createLocation(data: CreateLocationData): Promise<Location> {
    const insertData: Record<string, any> = {
      name: data.name,
      organization_id: data.organization_id,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      postal_code: data.postal_code || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      radius: data.radius || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: location, error } = await supabase
      .from('locations')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return location as Location;
  },

  async updateLocation(id: string, data: UpdateLocationData): Promise<Location> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.postal_code !== undefined) updateData.postal_code = data.postal_code;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.radius !== undefined) updateData.radius = data.radius;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const { data: location, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return location as Location;
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  },
};