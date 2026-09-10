import { supabase } from '@/lib/supabase';

const db = supabase as any;

export const integrationService = {
  async getSettings(): Promise<Record<string, any>> {
    const { data, error } = await db
      .from('app_config')
      .select('*');

    if (error) {
      console.error('Error fetching integration settings:', error);
      return {};
    }

    return data.reduce((acc: Record<string, any>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  },

  async updateSettings(settings: Record<string, string>): Promise<boolean> {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await db
        .from('app_config')
        .upsert(update);

      if (error) {
        console.error('Error updating integration:', error);
        return false;
      }
    }

    return true;
  },

  async getMeetupStatus(): Promise<{ configured: boolean; valid?: boolean }> {
    const { data } = await db
      .from('app_config')
      .select('value')
      .eq('key', 'meetup_api_key')
      .single();

    if (!data?.value) {
      return { configured: false };
    }

    try {
      const response = await fetch('https://api.meetup.com/status', {
        headers: { 'Authorization': `Bearer ${data.value}` },
      });
      return { configured: true, valid: response.ok };
    } catch {
      return { configured: true, valid: false };
    }
  },

  async getGooglePlacesStatus(): Promise<{ configured: boolean; valid?: boolean }> {
    const { data } = await db
      .from('app_config')
      .select('value')
      .eq('key', 'google_places_api_key')
      .single();

    if (!data?.value) {
      return { configured: false };
    }

    return { configured: true };
  },
};