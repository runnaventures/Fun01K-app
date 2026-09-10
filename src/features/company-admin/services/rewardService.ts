import { supabase } from '@/lib/supabase';
import type { 
  Reward, 
  CreateRewardData, 
  UpdateRewardData,
  ExternalReward,
  TremendousReward,
  TangoCardReward
} from '../types/reward.types';

const db = supabase as any;

export const rewardService = {
  // Get all rewards for an organization
  async getRewards(organizationId: string, filters?: { status?: string; category?: string }): Promise<Reward[]> {
    let query = db
      .from('rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }

    return data as Reward[];
  },

  // Get a single reward
  async getReward(id: string): Promise<Reward | null> {
    const { data, error } = await db
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reward:', error);
      return null;
    }

    return data as Reward;
  },

  // Create a reward
  async createReward(data: CreateRewardData): Promise<Reward | null> {
    const { data: reward, error } = await db
      .from('rewards')
      .insert({
        organization_id: data.organization_id,
        title: data.title,
        description: data.description,
        category: data.category,
        points_required: data.points_required,
        image_url: data.image_url || null,
        stock: data.stock || null,
        source: data.source || 'manual',
        source_id: data.source_id || null,
        metadata: data.metadata || {},
        status: data.status || 'draft',
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return null;
    }

    return reward as Reward;
  },

  // Update a reward
  async updateReward(id: string, data: UpdateRewardData): Promise<Reward | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.points_required !== undefined) updateData.points_required = data.points_required;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.source_id !== undefined) updateData.source_id = data.source_id;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await db
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return null;
    }

    return updated as Reward;
  },

  // Delete a reward
  async deleteReward(id: string): Promise<boolean> {
    const { error } = await db
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reward:', error);
      return false;
    }

    return true;
  },

  // Update reward stock
  async updateStock(id: string, stock: number): Promise<Reward | null> {
    const { data, error } = await db
      .from('rewards')
      .update({ 
        stock, 
        updated_at: new Date().toISOString(),
        status: stock === 0 ? 'out_of_stock' : 'active'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stock:', error);
      return null;
    }

    return data as Reward;
  },

  // Upload reward image - FIXED with better error handling
  async uploadImage(rewardId: string, file: File): Promise<string | null> {
    try {
      const bucketName = 'reward-images';
      
      console.log('Uploading image for reward:', rewardId);
      console.log('File:', file.name, file.size, file.type);
      
      // Upload the file
      const fileExt = file.name.split('.').pop();
      const fileName = `${rewardId}-${Date.now()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Public URL:', data.publicUrl);

      // Update reward with image URL
      const { error: updateError } = await db
        .from('rewards')
        .update({ image_url: data.publicUrl })
        .eq('id', rewardId);

      if (updateError) {
        console.error('Error updating reward with image:', updateError);
        return null;
      }

      console.log('Reward updated with image URL');
      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  },

  // Remove reward image
  async removeImage(rewardId: string): Promise<boolean> {
    try {
      // Get the current image URL
      const { data: reward, error: fetchError } = await db
        .from('rewards')
        .select('image_url')
        .eq('id', rewardId)
        .single();

      if (fetchError) {
        console.error('Error fetching reward for image removal:', fetchError);
        return false;
      }

      if (reward?.image_url) {
        // Extract the file path from the URL
        const urlParts = reward.image_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('reward-images') + 1).join('/');
        
        if (filePath) {
          const { error } = await supabase.storage
            .from('reward-images')
            .remove([filePath]);
          
          if (error) {
            console.error('Error removing image from storage:', error);
          }
        }
      }

      // Remove the image URL from the reward
      const { error } = await db
        .from('rewards')
        .update({ image_url: null })
        .eq('id', rewardId);

      if (error) {
        console.error('Error removing image from reward:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeImage:', error);
      return false;
    }
  },
};