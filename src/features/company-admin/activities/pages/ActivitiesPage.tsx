import { useState, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity, useChangeActivityStatus, useActivityCategories } from '@/features/activities/queries/activityQueries';
import { useLocations } from '@/features/locations/queries/locationQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { activityImageService } from '@/features/activities/services/activityImageService';
import type { Activity, ActivityCategory } from '@/features/activities/types/activity.types';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: activities, isLoading, refetch } = useActivities(organizationId);
  const { data: categories } = useActivityCategories(organizationId);
  const { data: locations } = useLocations(organizationId);
  const { mutate: createActivity, isPending: isCreating } = useCreateActivity();
  const { mutate: updateActivity } = useUpdateActivity();
  const { mutate: deleteActivity } = useDeleteActivity();
  const { mutate: changeStatus } = useChangeActivityStatus();

  const [isCreatingAct, setIsCreatingAct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    category_id: '',
    points: 10,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    duration: 30,
    start_at: '',
    end_at: '',
    visibility: 'public' as 'public' | 'private' | 'invite_only',
    verification_method: 'manual' as 'gps' | 'qr' | 'host_approval' | 'manual',
    requires_location: false,
    requires_evidence: false,
    requires_host_approval: false,
    completion_limit: '',
    status: 'draft' as 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !editingId && !isCreatingAct) return;
    
    setIsUploading(true);
    try {
      let activityId = editingId;
      
      // If creating new, first create the activity then upload image
      if (!activityId) {
        // We'll handle this in the submit flow
        return;
      }
      
      const url = await activityImageService.uploadImage(activityId, imageFile);
      if (url) {
        setFormData({ ...formData, image_url: url });
        setImagePreview('');
        setImageFile(null);
        // Refetch to show the image
        refetch();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editingId) return;
    
    const success = await activityImageService.removeImage(editingId);
    if (success) {
      setFormData({ ...formData, image_url: '' });
      refetch();
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      category_id: '',
      points: 10,
      difficulty: 'easy',
      duration: 30,
      start_at: '',
      end_at: '',
      visibility: 'public',
      verification_method: 'manual',
      requires_location: false,
      requires_evidence: false,
      requires_host_approval: false,
      completion_limit: '',
      status: 'draft',
    });
    setImagePreview('');
    setImageFile(null);
    setIsCreatingAct(true);
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      title: activity.title,
      description: activity.description,
      image_url: activity.image_url || '',
      category_id: activity.category_id || '',
      points: activity.points,
      difficulty: activity.difficulty,
      duration: activity.duration,
      start_at: activity.start_at || '',
      end_at: activity.end_at || '',
      visibility: activity.visibility,
      verification_method: activity.verification_method,
      requires_location: activity.requires_location,
      requires_evidence: activity.requires_evidence,
      requires_host_approval: activity.requires_host_approval,
      completion_limit: activity.completion_limit?.toString() || '',
      status: activity.status,
    });
    setImagePreview('');
    setImageFile(null);
    setEditingId(activity.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    const submitData = {
      organization_id: organizationId,
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url || undefined,
      category_id: formData.category_id || undefined,
      points: formData.points,
      difficulty: formData.difficulty,
      duration: formData.duration,
      start_at: formData.start_at || undefined,
      end_at: formData.end_at || undefined,
      visibility: formData.visibility,
      verification_method: formData.verification_method,
      requires_location: formData.requires_location,
      requires_evidence: formData.requires_evidence,
      requires_host_approval: formData.requires_host_approval,
      completion_limit: formData.completion_limit ? parseInt(formData.completion_limit) : undefined,
      status: formData.status,
      created_by: user.id,
    };

    if (editingId) {
      updateActivity({
        id: editingId,
        data: submitData,
      }, {
        onSuccess: async (updatedActivity) => {
          // If there's a pending image upload, upload it now
          if (imageFile && updatedActivity) {
            const url = await activityImageService.uploadImage(updatedActivity.id, imageFile);
            if (url) {
              setFormData({ ...formData, image_url: url });
              setImagePreview('');
              setImageFile(null);
            }
          }
          setEditingId(null);
          refetch();
        },
      });
    } else {
      createActivity(submitData, {
        onSuccess: async (newActivity) => {
          // If there's a pending image upload, upload it now
          if (imageFile && newActivity) {
            const url = await activityImageService.uploadImage(newActivity.id, imageFile);
            if (url) {
              setFormData({ ...formData, image_url: url });
              setImagePreview('');
              setImageFile(null);
            }
          }
          setIsCreatingAct(false);
          refetch();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteActivity(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    changeStatus({ id, status }, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleCancel = () => {
    setIsCreatingAct(false);
    setEditingId(null);
    setImagePreview('');
    setImageFile(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-600',
    published: 'bg-blue-500/10 text-blue-600',
    active: 'bg-green-500/10 text-green-600',
    paused: 'bg-yellow-500/10 text-yellow-600',
    completed: 'bg-purple-500/10 text-purple-600',
    archived: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">
            Manage activities for your employees
          </p>
        </div>
        {!isCreatingAct && !editingId && (
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Activity
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreatingAct || editingId) && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Activity' : 'Create Activity'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Morning Yoga Session"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe the activity..."
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Activity Image</label>
                <div className="flex items-center gap-4">
                  {(formData.image_url || imagePreview) ? (
                    <div className="relative">
                      <img 
                        src={imagePreview || formData.image_url} 
                        alt="Activity" 
                        className="h-32 w-32 object-cover rounded-lg border"
                      />
                      {!imagePreview && editingId && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 text-xs w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setImageFile(null);
                          }}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 text-xs w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-lg border-2 border-dashed border-input flex items-center justify-center text-muted-foreground text-sm">
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
                      className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Choose Image
                    </button>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={isUploading}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Category</option>
                  {categories?.map((cat: ActivityCategory) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points *</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verification Method</label>
                <select
                  value={formData.verification_method}
                  onChange={(e) => setFormData({ ...formData, verification_method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="manual">Manual</option>
                  <option value="gps">GPS</option>
                  <option value="qr">QR Code</option>
                  <option value="host_approval">Host Approval</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Completion Limit</label>
                <input
                  type="number"
                  value={formData.completion_limit}
                  onChange={(e) => setFormData({ ...formData, completion_limit: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Requirements</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_location}
                    onChange={(e) => setFormData({ ...formData, requires_location: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label className="text-sm">Requires Location</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_evidence}
                    onChange={(e) => setFormData({ ...formData, requires_evidence: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label className="text-sm">Requires Evidence</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_host_approval}
                    onChange={(e) => setFormData({ ...formData, requires_host_approval: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label className="text-sm">Requires Host Approval</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating || isUploading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Points</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Verification</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No activities found
                  </td>
                </tr>
              ) : (
                activities?.map((activity: Activity) => (
                  <tr key={activity.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      {activity.image_url ? (
                        <img 
                          src={activity.image_url} 
                          alt={activity.title} 
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{activity.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {categories?.find((c: ActivityCategory) => c.id === activity.category_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{activity.points}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[activity.status] || 'bg-gray-500/10 text-gray-600'}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{activity.verification_method}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(activity)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <select
                        onChange={(e) => handleStatusChange(activity.id, e.target.value)}
                        value={activity.status}
                        className="text-sm border-none bg-transparent focus:outline-none focus:ring-0"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="text-sm text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}