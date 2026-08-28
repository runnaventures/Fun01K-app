import { supabase } from '@/lib/supabase';

export const activityImageService = {
  async uploadImage(activityId: string, file: File): Promise<string | null> {
    // Create bucket if it doesn't exist
    try {
      const { error: bucketError } = await supabase.storage.createBucket('activity-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
      }
    } catch (e) {
      // Bucket might already exist
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${activityId}-${Date.now()}.${fileExt}`;
    const filePath = `activities/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('activity-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading activity image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('activity-images')
      .getPublicUrl(filePath);

    // Update activity with image URL - using any to bypass type checking
    const { error: updateError } = await supabase
      .from('activities')
      .update({ image_url: data.publicUrl } as any)
      .eq('id', activityId);

    if (updateError) {
      console.error('Error updating activity with image URL:', updateError);
      return null;
    }

    return data.publicUrl;
  },

  async removeImage(activityId: string): Promise<boolean> {
    // Get the current image URL
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('image_url')
      .eq('id', activityId)
      .single();

    if (fetchError) {
      console.error('Error fetching activity:', fetchError);
      return false;
    }

    if (activity?.image_url) {
      // Extract the file path from the URL
      const urlParts = (activity.image_url as string).split('/');
      const filePath = urlParts.slice(urlParts.indexOf('activity-images') + 1).join('/');
      
      if (filePath) {
        const { error } = await supabase.storage
          .from('activity-images')
          .remove([filePath]);
        
        if (error) {
          console.error('Error removing image:', error);
        }
      }
    }

    // Remove the image URL from the activity
    const { error } = await supabase
      .from('activities')
      .update({ image_url: null } as any)
      .eq('id', activityId);

    if (error) {
      console.error('Error removing image from activity:', error);
      return false;
    }

    return true;
  },
};