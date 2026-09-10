// src/features/activities/services/activityImageService.ts

import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export const activityImageService = {
  uploadImage: async (activityId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activityId}-${Date.now()}.${fileExt}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('activity-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('activity-images')
        .getPublicUrl(filePath);

      // Use db wrapper instead of direct supabase
      await db.activities.updateImage(activityId, urlData.publicUrl);

      return { publicUrl: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  getImageUrl: (activity: any) => {
    if (!activity) return null;
    return activity.image_url || null;
  },

  deleteImage: async (activityId: string) => {
    try {
      // Get the activity first to get the image URL
      const { data: activity } = await db.activities.getById(activityId);
      
      if (activity?.image_url) {
        const urlParts = (activity.image_url as string).split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `activities/${fileName}`;

        await supabase.storage
          .from('activity-images')
          .remove([filePath]);

        // Use db wrapper
        await db.activities.updateImage(activityId, null);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
};