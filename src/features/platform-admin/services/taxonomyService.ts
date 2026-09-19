// src/features/platform-admin/services/taxonomyService.ts

import { supabase } from '@/lib/supabase';

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

export interface Interest {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  sub_interests?: SubInterest[];
}

export interface SubInterest {
  id: string;
  interest_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateInterestData {
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateSubInterestData {
  interest_id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   Service
   ═══════════════════════════════════════════════════════════════════════ */

export const taxonomyService = {
  /* ─────────────────────────── INTERESTS ─────────────────────────── */

  /** Get all interests with their sub-interests nested */
  async getInterestsWithSubs(): Promise<Interest[]> {
    const { data: interests, error: iErr } = await supabase
      .from('interests')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (iErr) {
      console.error('Error fetching interests:', iErr);
      return [];
    }

    const { data: subs, error: sErr } = await supabase
      .from('sub_interests')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (sErr) {
      console.error('Error fetching sub-interests:', sErr);
    }

    const subsByInterest: Record<string, SubInterest[]> = {};
    (subs || []).forEach((s: SubInterest) => {
      if (!subsByInterest[s.interest_id]) subsByInterest[s.interest_id] = [];
      subsByInterest[s.interest_id].push(s);
    });

    return (interests || []).map((i: Interest) => ({
      ...i,
      sub_interests: subsByInterest[i.id] || [],
    }));
  },

  /** Get just the interests (no sub-interests) */
  async getInterests(): Promise<Interest[]> {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching interests:', error);
      return [];
    }
    return (data || []) as Interest[];
  },

  async createInterest(payload: CreateInterestData): Promise<Interest | null> {
    const { data, error } = await supabase
      .from('interests')
      .insert({
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        icon: payload.icon || null,
        color: payload.color || null,
        description: payload.description || null,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interest:', error);
      throw error;
    }
    return data as Interest;
  },

  async updateInterest(
    id: string,
    payload: Partial<CreateInterestData>
  ): Promise<Interest | null> {
    const update: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.name !== undefined) update.name = payload.name.trim();
    if (payload.slug !== undefined) update.slug = payload.slug.trim().toLowerCase();
    if (payload.icon !== undefined) update.icon = payload.icon || null;
    if (payload.color !== undefined) update.color = payload.color || null;
    if (payload.description !== undefined)
      update.description = payload.description || null;
    if (payload.sort_order !== undefined) update.sort_order = payload.sort_order;
    if (payload.is_active !== undefined) update.is_active = payload.is_active;

    const { data, error } = await supabase
      .from('interests')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating interest:', error);
      throw error;
    }
    return data as Interest;
  },

  async deleteInterest(id: string): Promise<void> {
    const { error } = await supabase.from('interests').delete().eq('id', id);
    if (error) {
      console.error('Error deleting interest:', error);
      throw error;
    }
  },

  /* ─────────────────────────── SUB-INTERESTS ─────────────────────── */

  async getSubInterests(interestId: string): Promise<SubInterest[]> {
    const { data, error } = await supabase
      .from('sub_interests')
      .select('*')
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sub-interests:', error);
      return [];
    }
    return (data || []) as SubInterest[];
  },

  async createSubInterest(
    payload: CreateSubInterestData
  ): Promise<SubInterest | null> {
    const { data, error } = await supabase
      .from('sub_interests')
      .insert({
        interest_id: payload.interest_id,
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description || null,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sub-interest:', error);
      throw error;
    }
    return data as SubInterest;
  },

  async updateSubInterest(
    id: string,
    payload: Partial<CreateSubInterestData>
  ): Promise<SubInterest | null> {
    const update: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.name !== undefined) update.name = payload.name.trim();
    if (payload.slug !== undefined) update.slug = payload.slug.trim().toLowerCase();
    if (payload.description !== undefined)
      update.description = payload.description || null;
    if (payload.sort_order !== undefined) update.sort_order = payload.sort_order;
    if (payload.is_active !== undefined) update.is_active = payload.is_active;

    const { data, error } = await supabase
      .from('sub_interests')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sub-interest:', error);
      throw error;
    }
    return data as SubInterest;
  },

  async deleteSubInterest(id: string): Promise<void> {
    const { error } = await supabase.from('sub_interests').delete().eq('id', id);
    if (error) {
      console.error('Error deleting sub-interest:', error);
      throw error;
    }
  },
};