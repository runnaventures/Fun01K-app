import { supabase } from '@/lib/supabase';
import type { PointsAccount, PointsTransaction, AwardPointsData, RedeemPointsData } from '../types/points.types';

const db = supabase as any;

export const pointsService = {
  // Get points account for a user
  async getAccount(profileId: string): Promise<PointsAccount | null> {
    const { data, error } = await db
      .from('points_accounts')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      console.error('Error fetching points account:', error);
      return null;
    }

    return data as PointsAccount;
  },

  // Get transaction history for a user
  async getTransactions(profileId: string, limit: number = 50, offset: number = 0): Promise<PointsTransaction[]> {
    const { data, error } = await db
      .from('points_ledger')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data as PointsTransaction[];
  },

  // Award points (server-side via Edge Function)
  async awardPoints(data: AwardPointsData): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('award-points', {
        body: data,
      });

      if (error) {
        console.error('Error awarding points:', error);
        return { success: false, error: error.message };
      }

      return { success: true, transactionId: result.transactionId };
    } catch (error) {
      console.error('Error in awardPoints:', error);
      return { success: false, error: String(error) };
    }
  },

  // Award points directly (using database function - fallback)
  async awardPointsDirect(data: AwardPointsData): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data: result, error } = await db
        .rpc('award_points', {
          p_profile_id: data.profileId,
          p_amount: data.amount,
          p_source: data.source,
          p_source_id: data.sourceId || null,
          p_description: data.description,
          p_metadata: data.metadata || null,
        });

      if (error) {
        console.error('Error awarding points directly:', error);
        return { success: false, error: error.message };
      }

      return { success: true, transactionId: result };
    } catch (error) {
      console.error('Error in awardPointsDirect:', error);
      return { success: false, error: String(error) };
    }
  },

  // Redeem points
  async redeemPoints(data: RedeemPointsData): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data: result, error } = await db
        .rpc('redeem_points', {
          p_profile_id: data.profileId,
          p_amount: data.amount,
          p_source_id: data.rewardId,
          p_description: data.description,
        });

      if (error) {
        console.error('Error redeeming points:', error);
        return { success: false, error: error.message };
      }

      return { success: true, transactionId: result };
    } catch (error) {
      console.error('Error in redeemPoints:', error);
      return { success: false, error: String(error) };
    }
  },

  // Get points balance
  async getBalance(profileId: string): Promise<number> {
    const { data, error } = await db
      .rpc('get_points_balance', {
        p_profile_id: profileId,
      });

    if (error) {
      console.error('Error getting points balance:', error);
      return 0;
    }

    return data || 0;
  },

  // Get points summary (balance, lifetime earned, lifetime redeemed)
  async getPointsSummary(profileId: string): Promise<{ balance: number; lifetimeEarned: number; lifetimeRedeemed: number }> {
    const account = await this.getAccount(profileId);
    
    if (!account) {
      return { balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 };
    }

    return {
      balance: account.balance || 0,
      lifetimeEarned: account.lifetime_earned || 0,
      lifetimeRedeemed: account.lifetime_redeemed || 0,
    };
  },
};