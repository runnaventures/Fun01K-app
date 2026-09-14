// src/features/platform-admin/components/ActivitiesManager/AddActivityDialog.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface AddActivityDialogProps {
  onActivityCreated?: () => void;
  children?: React.ReactNode;

  /**
   * Display mode:
   * - "modal" (default): opens as a modal via DialogTrigger
   * - "inline": renders the form inline (no modal wrapper). Requires `open` + `onClose`.
   */
  mode?: 'modal' | 'inline';

  /** Only used in inline mode — controls visibility */
  open?: boolean;

  /** Only used in inline mode — called when user cancels */
  onClose?: () => void;
}

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

export function AddActivityDialog({
  onActivityCreated,
  children,
  mode = 'modal',
  open,
  onClose,
}: AddActivityDialogProps) {
  const isInline = mode === 'inline';

  // In modal mode this controls the Dialog. In inline mode the parent controls via `open`.
  const [isOpen, setIsOpen] = useState(false);
  const effectiveOpen = isInline ? !!open : isOpen;

  const [isLoading, setIsLoading] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    DEFAULT_CATEGORIES
  );
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 40,
    capacity: 0,
    category_id: '',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    organization_id: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch dropdown data whenever the form becomes visible
  useEffect(() => {
    if (effectiveOpen) {
      fetchCategories();
      fetchOrganizations();
      setError(null);
      setSuccess(false);
    }
  }, [effectiveOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      if (data && data.length > 0) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    if (!file) return;
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
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
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

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      let startAt: string | null = null;
      let endAt: string | null = null;
      if (formData.start_date && formData.start_time) {
        startAt = new Date(
          `${formData.start_date}T${formData.start_time}`
        ).toISOString();
      }
      if (formData.start_date && formData.end_time) {
        endAt = new Date(
          `${formData.start_date}T${formData.end_time}`
        ).toISOString();
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
        organization_id: formData.organization_id || null,
        points: formData.points,
        duration,
        status: 'published',
        visibility: 'public',
        start_at: startAt,
        end_at: endAt,
        verification_method: 'manual',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        difficulty: 'easy',
        completion_limit: formData.capacity || null,
        location: formData.location || null,
        source: 'manual',
        is_featured: true,
        featured_at: new Date().toISOString(),
      };

      if (formData.category_id) {
        activityData.category_id = formData.category_id;
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

      setSuccess(true);
      resetForm();

      setTimeout(() => {
        // In inline mode the parent controls closing — call onClose
        if (isInline) {
          onClose?.();
        } else {
          setIsOpen(false);
        }
        setSuccess(false);
        if (onActivityCreated) onActivityCreated();
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
      capacity: 0,
      category_id: '',
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
    if (isInline) {
      onClose?.();
    } else {
      setIsOpen(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     Form body — the same JSX for modal and inline mode
     ═══════════════════════════════════════════════════════════════════ */
  const formBody = (
    <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
          <LucideIcon name="AlertCircle" size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <LucideIcon name="CheckCircle" size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          <div>
            <span className="text-sm font-medium text-emerald-700">
              Activity created successfully!
            </span>
            <p className="mt-0.5 text-xs text-emerald-600">Closing…</p>
          </div>
        </div>
      )}

      <form
        id="add-activity-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {/* LEFT COLUMN (2/3) — Content */}
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                  className="pl-9 py-2.5 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Category{' '}
                <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Tag" size={16} />
                </div>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full appearance-none cursor-pointer rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                className="min-h-[110px] w-full resize-y rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Location / Room
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="MapPin" size={16} />
                </div>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Lounge B"
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Organization{' '}
                <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Building2" size={16} />
                </div>
                <select
                  value={formData.organization_id}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_id: e.target.value })
                  }
                  className="w-full appearance-none cursor-pointer rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">🌍 Global — All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      🏢 {org.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) — Metadata + Image */}
        <div className="space-y-3 lg:col-span-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Points <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Star" size={16} />
                </div>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) =>
                    setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
                  }
                  min={1}
                  className="pl-9 py-2.5 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Capacity <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Users" size={16} />
                </div>
                <Input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                  }
                  min={1}
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Activity Image{' '}
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>

            {imagePreview ? (
              <div className="relative mb-3">
                <img
                  src={imagePreview}
                  alt="Activity preview"
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                  }}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="mb-2 flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-xs text-slate-400">
                No image selected
              </div>
            )}

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
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {imagePreview ? 'Change Image' : 'Choose Image'}
            </button>
            <p className="mt-2 text-xs text-slate-400">Max 5MB. JPG, PNG, GIF, WEBP</p>
          </div>
        </div>
      </form>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     Footer buttons — shared by both modes
     ═══════════════════════════════════════════════════════════════════ */
  const footerButtons = (
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        className="px-6 py-2.5"
      >
        Cancel
      </Button>
      <Button
        type="button"
        disabled={isLoading || success}
        onClick={() => {
          const form = document.getElementById(
            'add-activity-form'
          ) as HTMLFormElement | null;
          if (form) form.requestSubmit();
        }}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
  );

  /* ═══════════════════════════════════════════════════════════════════
     INLINE mode — plain <div> wrapper, no modal
     ═══════════════════════════════════════════════════════════════════ */
  if (isInline) {
    if (!open) return null;

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Inline header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-900 to-indigo-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
              <LucideIcon name="Calendar" size={20} className="text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Publish New Activity</h3>
              <p className="mt-0.5 text-xs text-indigo-300">
                Create a custom activity for your employees
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-indigo-300 transition-colors hover:text-white"
          >
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        {formBody}
        {footerButtons}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     MODAL mode — original Dialog wrapper
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[85vh]">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                <LucideIcon name="Calendar" size={20} className="text-indigo-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Publish New Activity
                </DialogTitle>
                <p className="mt-0.5 text-xs text-indigo-300">
                  Create a custom activity for your employees
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-indigo-300 transition-colors hover:text-white"
            >
              <LucideIcon name="X" size={20} />
            </button>
          </div>
        </div>

        {formBody}
        {footerButtons}
      </DialogContent>
    </Dialog>
  );
}