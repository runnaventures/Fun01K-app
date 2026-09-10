// src/features/activities/components/AdminFeaturedFeed.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { AdminActivityCard } from './AdminActivityCard';
import { Activity } from '../types/activity.types';
import { useOrganization } from '@/app/providers/OrganizationProvider';

interface AdminFeaturedFeedProps {
  loadActivities: () => Promise<Activity[]>;
  onAddActivity: (activityId: string) => void;
  onFeatureActivity?: (activityId: string) => void;
  onArchiveActivity?: (activityId: string) => void;
  onAddNewActivity?: () => void;
  userInterests?: string[];
  organizationId?: string;
}

const CATEGORIES = ['All Categories', 'Wellness', 'Sports', 'Social', 'Hobby', 'Learning'];

// Default categories for fallback
const DEFAULT_CATEGORIES = [
  { id: 'sports', name: 'Sports' },
  { id: 'wellness', name: 'Wellness' },
  { id: 'learning', name: 'Learning' },
  { id: 'social', name: 'Social' },
  { id: 'creative', name: 'Creative' },
  { id: 'professional', name: 'Professional' },
  { id: 'community', name: 'Community' },
  { id: 'outdoor', name: 'Outdoor' },
  { id: 'hobby', name: 'Hobby' },
];

export function AdminFeaturedFeed({
  loadActivities,
  onAddActivity,
  onFeatureActivity,
  onArchiveActivity,
  onAddNewActivity,
}: AdminFeaturedFeedProps) {
  const { organizationMember } = useOrganization();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>(DEFAULT_CATEGORIES);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 40,
    capacity: '',
    category_id: '',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchCategories();
  }, [searchTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await loadActivities();
      let filtered = data;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(a => 
          a.title.toLowerCase().includes(term) || 
          (a.description?.toLowerCase() || '').includes(term)
        );
      }
      
      if (selectedCategory !== 'All Categories') {
        filtered = filtered.filter(a => 
          a.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      
      setActivities(filtered);
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  const isSpotlight = (activity: Activity) => {
    return activity.is_featured && activity.status === 'published';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size must be less than 5MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setFormError('Please upload a valid image (JPG, PNG, GIF, or WEBP)');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormError(null);
    }
  };

  const uploadImage = async (activityId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `activity-${activityId}-${Date.now()}.${fileExt}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('activity-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setIsSubmitting(true);

    try {
      if (!formData.title.trim()) {
        setFormError('Activity title is required');
        setIsSubmitting(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const orgId = organizationMember?.organization_id || null;

      if (!orgId) {
        setFormError('No organization found. Please contact support.');
        setIsSubmitting(false);
        return;
      }

      let startAt = null;
      let endAt = null;
      
      if (formData.start_date && formData.start_time) {
        startAt = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
      }
      if (formData.start_date && formData.end_time) {
        endAt = new Date(`${formData.start_date}T${formData.end_time}`).toISOString();
      }

      let duration = 60;
      if (startAt && endAt) {
        const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
        duration = Math.round(diff);
        if (duration < 5) duration = 5;
      }

      const activityData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        organization_id: orgId,
        points: formData.points,
        duration: duration,
        status: 'published',
        visibility: 'public',
        start_at: startAt,
        end_at: endAt,
        verification_method: 'manual',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        difficulty: 'easy',
        location: formData.location || null,
        source: 'manual',
        is_featured: true,
        featured_at: new Date().toISOString(),
      };

      if (formData.category_id) {
        activityData.category_id = formData.category_id;
      }

      if (formData.capacity && parseInt(formData.capacity) > 0) {
        activityData.completion_limit = parseInt(formData.capacity);
      }

      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      if (imageFile && data) {
        const imageUrl = await uploadImage(data.id);
        if (imageUrl) {
          await supabase
            .from('activities')
            .update({ image_url: imageUrl })
            .eq('id', data.id);
        }
      }

      setFormSuccess(true);
      resetForm();

      setTimeout(() => {
        setFormSuccess(false);
        setShowForm(false);
        fetchActivities();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating activity:', error);
      setFormError(error.message || 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points: 40,
      capacity: '',
      category_id: '',
      start_date: '',
      start_time: '',
      end_time: '',
      location: '',
    });
    setImagePreview('');
    setImageFile(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Activity Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Activities</h2>
          <p className="text-sm text-muted-foreground">
            Create immersive company challenges, social group gatherings, or peer wellness rituals.
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5"
        >
          <LucideIcon name="Plus" size={16} />
          {showForm ? 'Cancel' : 'Add Activity'}
        </Button>
      </div>

      {/* Ready to Engage Banner */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/10 text-center">
        <h3 className="text-lg font-semibold">Ready to Engage the Workspace?</h3>
        <p className="text-sm text-muted-foreground">
          Click the "Add Activity" button above to reveal the personalized event creator,
          rewarding employees with social points.
        </p>
      </div>

      {/* Activity Form - Displayed inline when Add Activity is clicked */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Publish New Activity</h3>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <LucideIcon name="AlertCircle" size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <LucideIcon name="CheckCircle" size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-emerald-700 font-medium">Activity created successfully!</span>
                <p className="text-xs text-emerald-600 mt-0.5">Refreshing...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            {/* Row 1: Activity Name + Category */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="FileText" size={16} />
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Wednesday Waterfront Run"
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Tag" size={16} />
                  </div>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <LucideIcon name="ChevronDown" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-slate-400">
                  <LucideIcon name="AlignLeft" size={16} />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell employees why they should participate, what to expect, and details on how hobbies or socialization is stimulated."
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[80px] resize-y"
                />
              </div>
            </div>

            {/* Row 3: Points + Capacity (optional) */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Points Reward <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Star" size={16} />
                  </div>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    min={1}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Capacity Slots <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Users" size={16} />
                  </div>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    min={1}
                    placeholder="e.g., 20"
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Date + Hours / Time Range */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Schedule Date
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Calendar" size={16} />
                  </div>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Hours / Time
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Clock" size={16} />
                  </div>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  To
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Clock" size={16} />
                  </div>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Location / Address */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Location / Address <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="MapPin" size={16} />
                </div>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 123 Main St, New York, NY 10001 or Lounge B"
                  className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Row 6: Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Activity Image <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Activity preview" 
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white text-xs w-5 h-5 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md bg-secondary px-4 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Choose Image
                  </button>
                  <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF, WEBP</p>
                </div>
              </div>
            </div>

            {/* Actions - Single Cancel button */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || formSuccess}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-sm shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : formSuccess ? (
                  <>
                    <LucideIcon name="Check" size={16} />
                    Created!
                  </>
                ) : (
                  <>
                    <LucideIcon name="Plus" size={16} />
                    Publish Activity
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Active Registry */}
      <div>
        <h3 className="font-semibold">Active Registry</h3>
        <p className="text-sm text-muted-foreground">
          Ongoing company challenges, team interactions, or peer wellness rituals.
        </p>
        <p className="text-sm font-medium mt-1">{activities.length} Active Activities</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <LucideIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activities by name, category, location..."
            className="pl-9"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p className="text-lg">No featured activities</p>
          <p className="text-sm">Create your first activity to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => {
            const spotlight = isSpotlight(activity);

            return (
              <AdminActivityCard
                key={activity.id}
                activity={activity}
                onAdd={() => onAddActivity(activity.id)}
                onFeature={() => {
                  if (onFeatureActivity) onFeatureActivity(activity.id);
                }}
                onArchive={() => {
                  if (onArchiveActivity) onArchiveActivity(activity.id);
                }}
                onEdit={() => {
                  console.log('Edit activity:', activity.id);
                }}
                onRefresh={handleRefresh}
                isSpotlight={spotlight}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}