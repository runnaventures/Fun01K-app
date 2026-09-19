// src/features/platform-admin/components/ActivitiesManager/ActivitiesManager.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { AddActivityDialog } from './AddActivityDialog';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  interest_id?: string | null;
  sub_interest_id?: string | null;
  type_id: string | null;
  points: number;
  duration: number | null;
  status: string;
  visibility: string;
  verification_method: string;
  start_at: string | null;
  end_at: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  image_url?: string | null;
  organization?: { id: string; name: string } | null;
  category?: { id: string; name: string; icon?: string; color?: string } | null;
  interest?: { id: string; name: string; icon?: string | null; color?: string | null } | null;
  sub_interest?: { id: string; name: string; slug?: string | null } | null;
  type?: { id: string; name: string } | null;
  is_global?: boolean;
  difficulty?: string;
  location?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  place_id?: string | null;
  is_featured?: boolean;
  source?: string;
  attendees_count?: number;
  completion_limit?: number | null;
  interest_tags?: string[] | null;
}

export function ActivitiesManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'All' | 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived'
  >('All');
  const [filterScope, setFilterScope] = useState<'All' | 'Global' | 'Organization'>('All');

  // ─── Inline create form toggle ─────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ─── Edit modal state ──────────────────────────────────────────────
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [editFormData, setEditFormData] = useState({
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
    status: 'published' as 'draft' | 'published' | 'active',
    organization_id: '',
  });

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          organization:organization_id(id, name),
          category:category_id(id, name, icon, color),
          interest:interest_id(id, name, icon, color),
          sub_interest:sub_interest_id(id, name, slug),
          type:type_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map((item: any) => ({
        ...item,
        is_global: item.organization_id === null,
      }));

      setActivities(mappedData as unknown as Activity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('id, name, icon')
        .order('name');
      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchOrganizations();
    fetchCategories();
  }, []);

  /** Resolve display name/icon for an activity:
   *  prefers Interest → Sub-Interest, falls back to legacy Category. */
  const getInterestIcon = (activity: any) => {
    if (activity?.interest?.icon) return activity.interest.icon;
    if (activity?.category?.icon) return activity.category.icon;
    return '📌';
  };

  const getInterestName = (activity: any) => {
    if (activity?.sub_interest?.name && activity?.interest?.name) {
      return `${activity.interest.name} · ${activity.sub_interest.name}`;
    }
    if (activity?.interest?.name) return activity.interest.name;
    if (activity?.category?.name) return activity.category.name;
    return 'Uncategorized';
  };

  // ═══════════════════════════════════════════════════════════════════
  //                          EDIT (modal)
  // ═══════════════════════════════════════════════════════════════════

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditMode(true);
    setIsEditDialogOpen(true);

    let startDate = '';
    let startTime = '';
    let endTime = '';

    if (activity.start_at) {
      const date = new Date(activity.start_at);
      startDate = date.toISOString().split('T')[0];
      startTime = date.toTimeString().slice(0, 5);
    }
    if (activity.end_at) {
      const date = new Date(activity.end_at);
      endTime = date.toTimeString().slice(0, 5);
    }

    setEditFormData({
      title: activity.title || '',
      description: activity.description || '',
      points: activity.points || 40,
      capacity: activity.completion_limit || 12,
      category_id: activity.category_id || '',
      icon_theme: activity.interest_tags?.[0] || 'Board / Dice Games',
      start_date: startDate,
      start_time: startTime,
      end_time: endTime,
      location: activity.location || '',
      status: (activity.status as 'draft' | 'published' | 'active') || 'published',
      organization_id: activity.organization_id || '',
    });

    if (activity.image_url) {
      setImagePreview(activity.image_url);
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
    setIsUploading(true);
    setUploadProgress(0);
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
      setUploadProgress(100);
      const { data: urlData } = supabase.storage
        .from('activity-images')
        .getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (!editFormData.title.trim()) {
        setError('Activity title is required');
        return;
      }

      let startAt = null;
      let endAt = null;
      if (editFormData.start_date && editFormData.start_time) {
        startAt = new Date(
          `${editFormData.start_date}T${editFormData.start_time}`
        ).toISOString();
      }
      if (editFormData.start_date && editFormData.end_time) {
        endAt = new Date(
          `${editFormData.start_date}T${editFormData.end_time}`
        ).toISOString();
      }

      let duration = 60;
      if (startAt && endAt) {
        const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000;
        duration = Math.round(diff);
        if (duration < 5) duration = 5;
      }

      const activityData: any = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim() || null,
        points: editFormData.points,
        duration: duration,
        status: editFormData.status,
        start_at: startAt,
        end_at: endAt,
        completion_limit: editFormData.capacity || null,
        location: editFormData.location || null,
        updated_at: new Date().toISOString(),
        organization_id: editFormData.organization_id || null,
      };

      if (editFormData.category_id) {
        activityData.category_id = editFormData.category_id;
      }

      const { error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', editingActivity?.id);
      if (error) throw error;

      if (imageFile && editingActivity) {
        const imageUrl = await uploadImage(editingActivity.id);
        if (imageUrl) {
          await supabase
            .from('activities')
            .update({ image_url: imageUrl })
            .eq('id', editingActivity.id);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setSuccess(false);
        setIsEditMode(false);
        setEditingActivity(null);
        setImagePreview('');
        setImageFile(null);
        fetchActivities();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating activity:', err);
      setError(err.message || 'Failed to update activity');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  };

  const handleFeatureToggle = async (id: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          is_featured: !currentFeatured,
          featured_at: !currentFeatured ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || activity.status === filterStatus;
    const matchesScope =
      filterScope === 'All' ||
      (filterScope === 'Global' && activity.is_global) ||
      (filterScope === 'Organization' && !activity.is_global);
    return matchesSearch && matchesStatus && matchesScope;
  });

  return (
    <div className="space-y-4">
      {/* ─── Header with toggle Add/Cancel ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Global Activities</h2>
          <p className="text-sm text-muted-foreground">
            Manage activities across all organizations ({activities.length} total)
            <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {activities.filter((a) => a.is_global).length} Global
            </span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5"
        >
          <LucideIcon name={showCreateForm ? 'X' : 'Plus'} size={16} />
          {showCreateForm ? 'Cancel' : 'Add Activity'}
        </Button>
      </div>

      {/* ─── INLINE create form (self-contained component) ─── */}
      <AddActivityDialog
        mode="inline"
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onActivityCreated={() => {
          fetchActivities();
          setShowCreateForm(false);
        }}
      />

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Scope:</span>
          {(['All', 'Global', 'Organization'] as const).map((scope) => (
            <Button
              key={scope}
              variant={filterScope === scope ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterScope(scope)}
              className="text-xs"
            >
              {scope}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {(
            ['All', 'draft', 'published', 'active', 'paused', 'completed', 'archived'] as const
          ).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="text-xs capitalize"
            >
              {status === 'All' ? 'All' : status}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          className="ml-auto"
        >
          <LucideIcon name="RefreshCw" size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ─── Edit Dialog (modal — unchanged) ─── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[95vh] bg-white">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                  <LucideIcon name="Edit" size={20} className="text-indigo-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold">
                    Edit Activity
                  </DialogTitle>
                  <p className="text-indigo-300 text-xs mt-0.5">
                    Update your activity details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsEditMode(false);
                  setEditingActivity(null);
                  setImagePreview('');
                  setImageFile(null);
                }}
                className="text-indigo-300 hover:text-white transition-colors"
              >
                <LucideIcon name="X" size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 overflow-y-auto max-h-[calc(95vh-120px)]">
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
                    Activity updated successfully!
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              {/* Row 1 */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Activity Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="FileText" size={16} />
                    </div>
                    <Input
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, title: e.target.value })
                      }
                      placeholder="e.g., Wednesday Waterfront Run"
                      className="pl-9 py-2.5 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Tag" size={16} />
                    </div>
                    <select
                      value={editFormData.category_id}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, category_id: e.target.value })
                      }
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select a category (optional)</option>
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

              {/* Row 2: Description */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <LucideIcon name="AlignLeft" size={16} />
                  </div>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    placeholder="Tell employees why they should participate, what to expect..."
                    className="min-h-[80px] w-full resize-y rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Row 3: Points + Capacity */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Points Reward <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Star" size={16} />
                    </div>
                    <Input
                      type="number"
                      value={editFormData.points}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          points: parseInt(e.target.value) || 0,
                        })
                      }
                      min={1}
                      className="pl-9 py-2.5 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Capacity Slots
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Users" size={16} />
                    </div>
                    <Input
                      type="number"
                      value={editFormData.capacity}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          capacity: parseInt(e.target.value) || 0,
                        })
                      }
                      min={1}
                      className="pl-9 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Date + Times */}
              <div className="mb-4 grid grid-cols-3 gap-4">
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
                      value={editFormData.start_date}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, start_date: e.target.value })
                      }
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
                      value={editFormData.start_time}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, start_time: e.target.value })
                      }
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
                      value={editFormData.end_time}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, end_time: e.target.value })
                      }
                      className="pl-9 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Location + Organization */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Location / Room
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="MapPin" size={16} />
                    </div>
                    <Input
                      value={editFormData.location}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, location: e.target.value })
                      }
                      placeholder="e.g., Lounge B or search address"
                      className="pl-9 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Organization
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Building2" size={16} />
                    </div>
                    <select
                      value={editFormData.organization_id}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          organization_id: e.target.value,
                        })
                      }
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">🌍 Global - All Organizations</option>
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

              {/* Row 6: Status + Image */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Circle" size={16} />
                    </div>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="active">Active</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="ChevronDown" size={16} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Activity Image
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Activity preview"
                          className="h-16 w-16 rounded-lg border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setImageFile(null);
                          }}
                          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
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
                        className="rounded-md bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary/80"
                      >
                        {imagePreview ? 'Change Image' : 'Choose Image'}
                      </button>
                      <p className="text-[10px] text-muted-foreground">Max 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setIsEditMode(false);
                    setEditingActivity(null);
                    setImagePreview('');
                    setImageFile(null);
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : success ? (
                    <>
                      <LucideIcon name="Check" size={16} />
                      Updated!
                    </>
                  ) : (
                    <>
                      <LucideIcon name="Save" size={16} />
                      Update Activity
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Activities Grid ─── */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg">No activities found</p>
            <p className="text-sm">Create your first activity to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => {
            const isSpotlight = activity.is_featured && activity.status === 'published';
            const sourceInfo =
              activity.source === 'google_places'
                ? {
                    label: 'Google Place',
                    icon: 'MapPin',
                    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
                  }
                : activity.source === 'meetup'
                ? {
                    label: 'Meetup',
                    icon: 'Users',
                    color: 'bg-red-500/10 text-red-600 border-red-200',
                  }
                : null;

            return (
              <Card
                key={activity.id}
                className={`overflow-hidden border-0 bg-gradient-to-br transition-all duration-300 hover:shadow-xl ${
                  isSpotlight
                    ? 'from-amber-50 via-white to-amber-50/50 border-2 border-amber-300 shadow-amber-200/30'
                    : 'from-white to-slate-50/50 border border-slate-200'
                }`}
              >
                {activity.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {isSpotlight && (
                      <div className="absolute top-4 right-4">
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow-lg">
                          <LucideIcon name="Star" size={14} className="fill-amber-900" />
                          SPOTLIGHT
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-lg border bg-white/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                        {getInterestIcon(activity)}{' '}
                        {getInterestName(activity)}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4">
                      <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                        <LucideIcon name="Coins" size={16} />+{activity.points} PTS
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex h-40 items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200">
                    <div className="text-center">
                      <span className="text-5xl">
                        {getInterestIcon(activity)}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {getInterestName(activity)}
                      </p>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-lg border bg-white/80 px-3 py-1.5 text-xs font-medium">
                        {getInterestIcon(activity)}{' '}
                        {getInterestName(activity)}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                        <LucideIcon name="Coins" size={16} />+{activity.points} PTS
                      </span>
                    </div>
                  </div>
                )}

                <CardContent className="space-y-3 p-5">
                  <div>
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                      {activity.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {sourceInfo && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${sourceInfo.color}`}
                        >
                          <LucideIcon
                            name={sourceInfo.icon as any}
                            size={10}
                            className="mr-1"
                          />
                          {sourceInfo.label}
                        </Badge>
                      )}
                      {activity.status === 'published' && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-[10px] text-blue-600"
                        >
                          Published
                        </Badge>
                      )}
                      {activity.status === 'active' && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600"
                        >
                          Active
                        </Badge>
                      )}
                      {activity.is_global && (
                        <Badge
                          variant="outline"
                          className="border-purple-200 bg-purple-50 text-[10px] text-purple-600"
                        >
                          🌍 Global
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-slate-600">
                    {activity.description || 'No description available'}
                  </p>

                  <div className="space-y-1.5 text-sm text-slate-500">
                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <LucideIcon name="MapPin" size={14} className="text-slate-400" />
                        <span className="truncate">{activity.location}</span>
                      </div>
                    )}
                    {activity.start_at && (
                      <div className="flex items-center gap-2">
                        <LucideIcon name="Calendar" size={14} className="text-slate-400" />
                        <span>
                          {new Date(activity.start_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    {activity.attendees_count !== undefined &&
                      activity.attendees_count > 0 && (
                        <div className="flex items-center gap-2">
                          <LucideIcon name="Users" size={14} className="text-slate-400" />
                          <span>{activity.attendees_count} attending</span>
                        </div>
                      )}
                  </div>

                  {activity.organization && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <LucideIcon name="Building2" size={12} />
                      {activity.organization.name}
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => handleEdit(activity)}
                        >
                          <LucideIcon name="Edit2" size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs ${
                            activity.is_featured
                              ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          onClick={() =>
                            handleFeatureToggle(activity.id, !!activity.is_featured)
                          }
                        >
                          <LucideIcon name="Star" size={14} className="mr-1" />
                          {activity.is_featured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(activity.id)}
                        >
                          <LucideIcon name="Trash2" size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <select
                        value={activity.status}
                        onChange={(e) => handleStatusChange(activity.id, e.target.value)}
                        className="rounded-md border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}