// src/features/platform-admin/components/ActivitiesManager/AddActivityDialog.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface AddActivityDialogProps {
  onActivityCreated?: () => void;
  children: React.ReactNode;
}

// Category options with icons
const CATEGORIES = [
  { value: 'Sports', icon: '⚽' },
  { value: 'Wellness', icon: '🧘' },
  { value: 'Learning', icon: '📚' },
  { value: 'Social', icon: '🤝' },
  { value: 'Creative', icon: '🎨' },
  { value: 'Professional', icon: '💼' },
  { value: 'Community', icon: '🌍' },
  { value: 'Outdoor', icon: '🏔️' },
  { value: 'Hobby', icon: '🎯' },
];

// Icon themes for activities
const ICON_THEMES = [
  { value: 'Board / Dice Games', icon: '🎲' },
  { value: 'Sports / Fitness', icon: '🏃' },
  { value: 'Art / Music', icon: '🎨' },
  { value: 'Food / Drink', icon: '🍽️' },
  { value: 'Tech / Coding', icon: '💻' },
  { value: 'Reading / Books', icon: '📚' },
  { value: 'Movies / Entertainment', icon: '🎬' },
  { value: 'Gardening / Nature', icon: '🌱' },
  { value: 'Yoga / Meditation', icon: '🧘' },
  { value: 'Cooking / Baking', icon: '👨‍🍳' },
  { value: 'Photography', icon: '📷' },
  { value: 'Music / Instruments', icon: '🎸' },
  { value: 'Dance / Movement', icon: '💃' },
  { value: 'Writing / Journaling', icon: '✍️' },
  { value: 'Crafts / DIY', icon: '🧶' },
];

export function AddActivityDialog({ onActivityCreated, children }: AddActivityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Categories from database
  const [categories, setCategories] = useState<{id: string, name: string, icon: string}[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 40,
    capacity: 12,
    category_id: '',
    icon_theme: 'Board / Dice Games',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    organization_id: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch categories and organizations when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchOrganizations();
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('id, name, icon')
        .order('name');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories(data);
        // Set default category if not already set
        if (!formData.category_id && data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } else {
        // Use default categories if none in database
        setCategories(DEFAULT_CATEGORIES.map(c => ({ 
          id: c.value, 
          name: c.value, 
          icon: c.icon || '📌' 
        })));
        if (!formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: DEFAULT_CATEGORIES[0].value }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories
      setCategories(DEFAULT_CATEGORIES.map(c => ({ 
        id: c.value, 
        name: c.value, 
        icon: c.icon || '📌' 
      })));
      if (!formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: DEFAULT_CATEGORIES[0].value }));
      }
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('slug', 'platform')
        .order('name');
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPG, PNG, GIF, or WEBP)');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Activity title is required');
        setIsLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Please select a category');
        setIsLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      // Build start and end datetime
      let startAt = null;
      let endAt = null;
      
      if (formData.start_date && formData.start_time) {
        startAt = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
      }
      if (formData.start_date && formData.end_time) {
        endAt = new Date(`${formData.start_date}T${formData.end_time}`).toISOString();
      }

      // Calculate duration from start and end times
      let duration = 60;
      if (startAt && endAt) {
        const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
        duration = Math.round(diff);
        if (duration < 5) duration = 5;
      }

      const activityData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        organization_id: formData.organization_id || null,
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
        category_id: formData.category_id,
        completion_limit: formData.capacity || null,
        location: formData.location || null,
        interest_tags: formData.icon_theme ? [formData.icon_theme] : [],
        source: 'manual',
        is_featured: true,
        featured_at: new Date().toISOString(),
      };

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

      setSuccess(true);
      resetForm();

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        if (onActivityCreated) {
          onActivityCreated();
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error creating activity:', error);
      setError(error.message || 'Failed to create activity');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points: 40,
      capacity: 12,
      category_id: categories.length > 0 ? categories[0].id : '',
      icon_theme: 'Board / Dice Games',
      start_date: '',
      start_time: '',
      end_time: '',
      location: '',
      organization_id: '',
    });
    setImagePreview('');
    setImageFile(null);
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    setSuccess(false);
    setIsOpen(false);
  };

  const getCategoryIcon = (categoryId: string) => {
    const found = categories.find(c => c.id === categoryId);
    return found?.icon || '📌';
  };

  const getCategoryName = (categoryId: string) => {
    const found = categories.find(c => c.id === categoryId);
    return found?.name || 'Category';
  };

  // Default categories for fallback
  const DEFAULT_CATEGORIES = [
    { value: 'Sports', icon: '⚽' },
    { value: 'Wellness', icon: '🧘' },
    { value: 'Learning', icon: '📚' },
    { value: 'Social', icon: '🤝' },
    { value: 'Creative', icon: '🎨' },
    { value: 'Professional', icon: '💼' },
    { value: 'Community', icon: '🌍' },
    { value: 'Outdoor', icon: '🏔️' },
    { value: 'Hobby', icon: '🎯' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[95vh] bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <LucideIcon name="Calendar" size={20} className="text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">
                  Publish New Activity
                </DialogTitle>
                <p className="text-indigo-300 text-xs mt-0.5">
                  Create a custom activity for your employees
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-indigo-300 hover:text-white transition-colors"
            >
              <LucideIcon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(95vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <LucideIcon name="AlertCircle" size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <LucideIcon name="CheckCircle" size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-emerald-700 font-medium">Activity created successfully!</span>
                <p className="text-xs text-emerald-600 mt-0.5">Redirecting...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Activity Name */}
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

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="text-lg">{getCategoryIcon(formData.category_id)}</span>
                </div>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '📌'} {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
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
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-y"
                />
              </div>
            </div>

            {/* Points & Capacity */}
            <div className="grid grid-cols-2 gap-4">
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
                  Capacity Slots
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <LucideIcon name="Users" size={16} />
                  </div>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    min={1}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Icon Theme */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Icon Theme
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Smile" size={16} />
                </div>
                <select
                  value={formData.icon_theme}
                  onChange={(e) => setFormData({ ...formData, icon_theme: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                >
                  {ICON_THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                      {theme.icon} {theme.value}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Date
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
                  Start Time
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
                  End Time
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

            {/* Location / Room */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Location / Room
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="MapPin" size={16} />
                </div>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Lounge B or search address"
                  className="pl-9 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Organization <span className="text-xs font-normal text-slate-400">(optional - leave empty for global)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="Building2" size={16} />
                </div>
                <select
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">🌍 Global - All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>🏢 {org.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
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

            {/* Actions */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-sm shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : success ? (
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
      </DialogContent>
    </Dialog>
  );
}