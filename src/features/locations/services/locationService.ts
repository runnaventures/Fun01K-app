import { supabase } from '@/lib/supabase';
import type { Location, CreateLocationData, UpdateLocationData } from '../types/location.types';

export const locationService = {
  async getLocations(organizationId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    return data as Location[];
  },

  async getLocation(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    return data as Location;
  },

  async createLocation(data: CreateLocationData): Promise<Location | null> {
    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        organization_id: data.organization_id,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        radius: data.radius || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      return null;
    }

    return location as Location;
  },

  async updateLocation(id: string, data: UpdateLocationData): Promise<Location | null> {
    const updateData: {
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
      updated_at: string;
    } = {
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

    const { data: updated, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      return null;
    }

    return updated as Location;
  },

  async deleteLocation(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      return false;
    }

    return true;
  },
};