import { useState, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useRewards, useCreateReward, useUpdateReward, useDeleteReward, useUpdateRewardStock, useUploadRewardImage, useRemoveRewardImage } from '@/features/company-admin/queries/rewardQueries';
import { rewardSourceService } from '@/features/company-admin/services/rewardSourceService';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import type { Reward, RewardCategory, RewardStatus, ExternalReward } from '@/features/company-admin/types/reward.types';

const CATEGORY_OPTIONS = [
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'experience', label: 'Experience' },
  { value: 'training', label: 'Training' },
  { value: 'pto', label: 'PTO' },
  { value: 'company_benefit', label: 'Company Benefit' },
  { value: 'charitable', label: 'Charitable' },
];

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual', description: 'Create from scratch' },
  { value: 'tremendous', label: 'Tremendous', description: 'Gift cards & rewards' },
  { value: 'tangocard', label: 'Tango Card', description: 'Digital rewards' },
  { value: 'giftbit', label: 'Giftbit', description: 'Gift cards' },
  { value: 'blackhawk', label: 'BlackHawk', description: 'Gift cards & incentives' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', description: 'Not visible to employees' },
  { value: 'published', label: 'Published', description: 'Visible to employees' },
  { value: 'active', label: 'Active', description: 'Available for redemption' },
  { value: 'out_of_stock', label: 'Out of Stock', description: 'Temporarily unavailable' },
  { value: 'archived', label: 'Archived', description: 'Permanently hidden' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-600',
  published: 'bg-blue-500/10 text-blue-600',
  active: 'bg-green-500/10 text-green-600',
  out_of_stock: 'bg-red-500/10 text-red-600',
  archived: 'bg-gray-500/10 text-gray-600',
};

const STATUS_BADGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  active: 'Active',
  out_of_stock: 'Out of Stock',
  archived: 'Archived',
};

export default function RewardsPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: rewards, isLoading, refetch } = useRewards(organizationId);
  const { mutate: createReward, isPending: isCreating } = useCreateReward();
  const { mutate: updateReward } = useUpdateReward();
  const { mutate: deleteReward } = useDeleteReward();
  const { mutate: updateStock } = useUpdateRewardStock();
  const { mutate: uploadImage, isPending: isUploading } = useUploadRewardImage();
  const { mutate: removeImage } = useRemoveRewardImage();

  const [isCreatingReward, setIsCreatingReward] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rewardSource, setRewardSource] = useState<'manual' | 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk'>('manual');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiResults, setApiResults] = useState<ExternalReward[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gift_card' as RewardCategory,
    points_required: 100,
    stock: '',
    image_url: '',
  });

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      category: 'gift_card',
      points_required: 100,
      stock: '',
      image_url: '',
    });
    setRewardSource('manual');
    setApiResults([]);
    setApiSearchQuery('');
    setImagePreview('');
    setImageFile(null);
    setIsCreatingReward(true);
    setEditingId(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleEdit = (reward: Reward) => {
    setFormData({
      title: reward.title,
      description: reward.description,
      category: reward.category,
      points_required: reward.points_required,
      stock: reward.stock?.toString() || '',
      image_url: reward.image_url || '',
    });
    setImagePreview('');
    setImageFile(null);
    setEditingId(reward.id);
    setIsCreatingReward(false);
    setRewardSource(reward.source || 'manual');
    setApiResults([]);
    setApiSearchQuery('');
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleApiSearch = async () => {
    if (!apiSearchQuery.trim()) {
      setSaveError('Please enter a search term');
      return;
    }

    if (rewardSource === 'manual') {
      setSaveError('Please select an API source');
      return;
    }

    setIsSearchingApi(true);
    setSaveError(null);
    try {
      const results = await rewardSourceService.searchAllSources(
        apiSearchQuery,
        rewardSource as 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk'
      );
      setApiResults(results);
      if (results.length === 0) {
        setSaveError('No rewards found. Try a different search term.');
      }
    } catch (error) {
      console.error('API search error:', error);
      setSaveError('Failed to search. Please try again.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleImportApiResult = (result: ExternalReward) => {
    setFormData({
      ...formData,
      title: result.title,
      description: result.description,
      category: result.category,
      image_url: result.image_url || '',
      points_required: Math.round((result.retail_price || 10) * 10),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setApiResults([]);
    setApiSearchQuery('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Image selected:', file.name, file.size, file.type);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    if (!imageFile) {
      setSaveError('No image selected');
      return;
    }
    
    const rewardId = editingId;
    if (!rewardId) {
      setSaveError('Please save the reward first, then upload an image');
      return;
    }

    setSaveError(null);

    console.log('Uploading image for reward:', rewardId);
    uploadImage(
      {
        rewardId,
        file: imageFile,
      },
      {
        onSuccess: (result) => {
          console.log('Image uploaded successfully:', result);
          if (result) {
            setImagePreview('');
            setImageFile(null);
            setFormData(prev => ({ ...prev, image_url: result }));
            refetch();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          }
        },
        onError: (error) => {
          console.error('Upload error:', error);
          setSaveError('Failed to upload image');
        },
      }
    );
  };

  const handleRemoveImage = async () => {
    if (!editingId) return;
    
    removeImage(editingId, {
      onSuccess: () => {
        setFormData({ ...formData, image_url: '' });
        refetch();
      },
      onError: (error) => {
        console.error('Remove image error:', error);
        setSaveError('Failed to remove image');
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    // Always create as 'draft' initially
    const submitData = {
      organization_id: organizationId,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      points_required: formData.points_required,
      image_url: formData.image_url || undefined,
      stock: formData.stock ? parseInt(formData.stock) : undefined,
      source: rewardSource,
      status: 'draft' as RewardStatus, // Always start as draft
      created_by: user.id,
    };

    if (editingId) {
      // For editing, preserve the existing status
      const existingReward = rewards?.find(r => r.id === editingId);
      updateReward({
        id: editingId,
        data: {
          ...submitData,
          status: existingReward?.status || 'draft',
        },
      }, {
        onSuccess: () => {
          setEditingId(null);
          setIsCreatingReward(false);
          refetch();
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: (error) => {
          console.error('Update error:', error);
          setSaveError('Failed to update reward');
        },
      });
    } else {
      createReward(submitData, {
        onSuccess: (newReward) => {
          setIsCreatingReward(false);
          refetch();
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          if (imageFile && newReward) {
            uploadImage({
              rewardId: newReward.id,
              file: imageFile,
            });
          }
        },
        onError: (error) => {
          console.error('Create error:', error);
          setSaveError('Failed to create reward');
        },
      });
    }
  };

  const handleStatusChange = (id: string, status: RewardStatus) => {
    const reward = rewards?.find(r => r.id === id);
    if (!reward) return;

    updateReward({
      id,
      data: {
        ...reward,
        status,
      },
    }, {
      onSuccess: () => {
        refetch();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
      onError: (error) => {
        console.error('Status update error:', error);
        setSaveError('Failed to update status');
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      deleteReward(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleStockUpdate = (id: string, stock: number) => {
    updateStock({ id, stock }, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleCancel = () => {
    setIsCreatingReward(false);
    setEditingId(null);
    setImagePreview('');
    setImageFile(null);
    setApiResults([]);
    setApiSearchQuery('');
    setSaveError(null);
    setSaveSuccess(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const categoryLabels: Record<RewardCategory, string> = {
    gift_card: 'Gift Card',
    merchandise: 'Merchandise',
    experience: 'Experience',
    training: 'Training',
    pto: 'PTO',
    company_benefit: 'Company Benefit',
    charitable: 'Charitable',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
          <p className="text-muted-foreground">
            Create and manage rewards for your employees
          </p>
        </div>
        {!isCreatingReward && !editingId && (
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Reward
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500 rounded-md text-green-600 text-sm">
          ✅ Reward saved successfully!
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
          ❌ {saveError}
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreatingReward || editingId) && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Reward' : 'Create Reward'}
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
                  placeholder="$25 Amazon Gift Card"
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
                  placeholder="Describe the reward..."
                />
              </div>

              {/* Image Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Reward Image</label>
                <div className="flex items-center gap-4">
                  {(formData.image_url || imagePreview) ? (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Reward"
                        className="h-32 w-32 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          (e.target as HTMLImageElement).src = '';
                        }}
                      />
                      {!imagePreview && editingId && formData.image_url && (
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

              {/* Reward Source Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Reward Source</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {SOURCE_OPTIONS.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => {
                        setRewardSource(source.value as typeof rewardSource);
                        setApiResults([]);
                        setApiSearchQuery('');
                      }}
                      className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                        rewardSource === source.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">{source.label}</div>
                      <div className="text-xs text-muted-foreground">{source.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Search Section */}
              {rewardSource !== 'manual' && (
                <div className="md:col-span-2 p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={apiSearchQuery}
                      onChange={(e) => setApiSearchQuery(e.target.value)}
                      placeholder={`Search ${rewardSource} rewards...`}
                      className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={(e) => e.key === 'Enter' && handleApiSearch()}
                    />
                    <button
                      type="button"
                      onClick={handleApiSearch}
                      disabled={isSearchingApi || !apiSearchQuery.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSearchingApi ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {apiResults.length > 0 && (
                    <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                      {apiResults.map((result) => (
                        <div key={result.id} className="flex items-start justify-between p-3 bg-background rounded-lg border hover:border-primary/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {result.image_url && (
                                <img src={result.image_url} alt={result.title} className="w-10 h-10 rounded object-cover" />
                              )}
                              <div>
                                <h4 className="font-medium">{result.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{result.description}</p>
                                {result.retail_price && (
                                  <p className="text-xs text-muted-foreground">${result.retail_price} {result.currency || 'USD'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleImportApiResult(result)}
                            className="ml-3 px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 text-sm font-medium whitespace-nowrap transition-colors"
                          >
                            Import
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Points Required *</label>
                <input
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock (Optional)</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited stock</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  ℹ️ New rewards are created as <span className="font-medium">Draft</span>. 
                  You can publish them after creation.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingId ? 'Update' : 'Create Reward'}
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

      {/* Rewards List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Points</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewards?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No rewards found. Create your first reward by clicking the "Create Reward" button.
                  </td>
                </tr>
              ) : (
                rewards?.map((reward: Reward) => (
                  <tr key={reward.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.title}
                          className="h-10 w-10 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{reward.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {categoryLabels[reward.category] || reward.category}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{reward.points_required}</td>
                    <td className="px-4 py-3 text-sm">
                      {reward.stock !== null ? (
                        <div className="flex items-center gap-2">
                          <span>{reward.stock}</span>
                          <button
                            onClick={() => {
                              const newStock = prompt('Enter new stock quantity:', String(reward.stock || 0));
                              if (newStock !== null) {
                                handleStockUpdate(reward.id, parseInt(newStock) || 0);
                              }
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unlimited</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[reward.status] || 'bg-gray-500/10 text-gray-600'}`}>
                          {STATUS_BADGE_LABELS[reward.status] || reward.status}
                        </span>
                        <select
                          value={reward.status}
                          onChange={(e) => handleStatusChange(reward.id, e.target.value as RewardStatus)}
                          className="text-xs border border-input rounded-md bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="active">Active</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(reward)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
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