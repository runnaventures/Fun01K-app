// src/features/platform-admin/components/RewardsManager/RewardsManager.tsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  category: string;
  stock: number;
  icon: string;
  photo: string | null;
  provider: string;
  delivery_method: string;
  organization_id: string | null;
  created_at: string;
  organization?: { name: string } | null;
  is_global?: boolean;
}

export function RewardsManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterScope, setFilterScope] = useState<'All' | 'Global' | 'Organization'>('All');
  
  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization_id: '',
    points_cost: 100,
    category: 'Voucher' as 'Voucher' | 'Experience' | 'Company Swag' | 'Perk',
    stock: 10,
    icon: 'Gift',
    photo: '',
    provider: 'Digital Voucher' as 'Digital Voucher' | 'Brand Catalog' | 'Corporate Gateway' | 'Custom Internal',
    delivery_method: 'instant_digital' as 'instant_digital' | 'manual_fulfillment',
    is_global: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          organization:organization_id(name)
        `)
        .or('organization_id.is.null,organization_id.not.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        is_global: item.organization_id === null,
      }));
      
      setRewards(mappedData as unknown as Reward[]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
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

  useEffect(() => {
    fetchRewards();
    fetchOrganizations();
  }, []);

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

  const uploadImage = async (rewardId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `reward-${rewardId}-${Date.now()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('reward-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoadingCreate(true);

    try {
      if (!formData.title.trim()) {
        setError('Reward title is required');
        setIsLoadingCreate(false);
        return;
      }

      const orgId = formData.organization_id || null;

      const { data, error } = await supabase
        .from('rewards')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          organization_id: orgId,
          points_cost: formData.points_cost,
          category: formData.category,
          stock: formData.stock,
          icon: formData.icon || 'Gift',
          photo: formData.photo || null,
          provider: formData.provider,
          delivery_method: formData.delivery_method,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Upload image if present
      if (imageFile && data) {
        const imageUrl = await uploadImage(data.id);
        if (imageUrl) {
          await supabase
            .from('rewards')
            .update({ photo: imageUrl })
            .eq('id', data.id);
        }
      }

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        organization_id: '',
        points_cost: 100,
        category: 'Voucher',
        stock: 10,
        icon: 'Gift',
        photo: '',
        provider: 'Digital Voucher',
        delivery_method: 'instant_digital',
        is_global: true,
      });
      setImagePreview('');
      setImageFile(null);

      setTimeout(() => {
        setIsCreateDialogOpen(false);
        setSuccess(false);
        fetchRewards();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating reward:', error);
      setError(error.message || 'Failed to create reward');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;
    
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const handleReplenishStock = async (id: string, amount: number = 10) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .update({ 
          stock: reward.stock + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      fetchRewards();
    } catch (error) {
      console.error('Error replenishing stock:', error);
    }
  };

  const categories = ['All', 'Voucher', 'Experience', 'Company Swag', 'Perk'];

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || reward.category === filterCategory;
    const matchesScope = filterScope === 'All' || 
                         (filterScope === 'Global' && reward.is_global) ||
                         (filterScope === 'Organization' && !reward.is_global);
    return matchesSearch && matchesCategory && matchesScope;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Voucher': return 'bg-emerald-100 text-emerald-700';
      case 'Experience': return 'bg-purple-100 text-purple-700';
      case 'Company Swag': return 'bg-blue-100 text-blue-700';
      case 'Perk': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const iconOptions = [
    'Gift', 'Trophy', 'Star', 'Heart', 'Coffee', 'Music', 'Camera', 
    'Book', 'Bike', 'Plane', 'Car', 'Home', 'ShoppingBag', 'Package'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Global Rewards</h2>
          <p className="text-sm text-muted-foreground">
            Manage rewards across all organizations ({rewards.length} total)
            <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {rewards.filter(r => r.is_global).length} Global
            </span>
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1.5">
              <LucideIcon name="Plus" size={14} />
              Create Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <LucideIcon name="Gift" size={20} className="text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-bold">
                    Create New Reward
                  </DialogTitle>
                  <p className="text-amber-300 text-xs mt-0.5">
                    {formData.organization_id ? 'For a specific organization' : 'Global - Available to all organizations'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 overflow-y-auto">
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
                    <span className="text-sm text-emerald-700 font-medium">Reward created successfully!</span>
                    <p className="text-xs text-emerald-600 mt-0.5">Redirecting...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Organization Selection - Optional */}
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
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value, is_global: !e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
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
                  {formData.organization_id && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <LucideIcon name="Info" size={12} />
                      This reward will only be visible to employees of this organization
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Reward Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="FileText" size={16} />
                    </div>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., $25 Starbucks Gift Card"
                      className="pl-9 py-2.5 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
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
                      placeholder="Describe the reward..."
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[60px] resize-y"
                    />
                  </div>
                </div>

                {/* Points & Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Points Cost
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="Star" size={16} />
                      </div>
                      <Input
                        type="number"
                        value={formData.points_cost}
                        onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                        min={1}
                        className="pl-9 py-2.5 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Stock
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="Package" size={16} />
                      </div>
                      <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        min={0}
                        className="pl-9 py-2.5 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Delivery */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="Tag" size={16} />
                      </div>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Voucher">🎫 Voucher</option>
                        <option value="Experience">🎯 Experience</option>
                        <option value="Company Swag">👕 Company Swag</option>
                        <option value="Perk">✨ Perk</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="ChevronDown" size={16} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Delivery Method
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="Truck" size={16} />
                      </div>
                      <select
                        value={formData.delivery_method}
                        onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value as any })}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="instant_digital">⚡ Instant Digital</option>
                        <option value="manual_fulfillment">📦 Manual Fulfillment</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LucideIcon name="ChevronDown" size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-2 rounded-lg border transition-all ${
                          formData.icon === icon
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <LucideIcon name={icon as any} size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Photo <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {(imagePreview || formData.photo) ? (
                      <div className="relative">
                        <img 
                          src={imagePreview || formData.photo} 
                          alt="Reward" 
                          className="h-24 w-24 object-cover rounded-lg border"
                        />
                        {!imagePreview && formData.photo && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo: '' })}
                            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white text-xs w-6 h-6 flex items-center justify-center hover:bg-red-600"
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
                            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white text-xs w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-muted-foreground text-xs">
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
                      <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG, GIF</p>
                    </div>
                  </div>
                </div>

                {/* Provider */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Provider
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <LucideIcon name="Store" size={16} />
                    </div>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Digital Voucher">Digital Voucher</option>
                      <option value="Brand Catalog">Brand Catalog</option>
                      <option value="Corporate Gateway">Corporate Gateway</option>
                      <option value="Custom Internal">Custom Internal</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <LucideIcon name="ChevronDown" size={16} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoadingCreate || success || isUploading}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg shadow-sm shadow-amber-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoadingCreate || isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isUploading ? 'Uploading...' : 'Creating...'}
                      </>
                    ) : success ? (
                      <>
                        <LucideIcon name="Check" size={16} />
                        Created!
                      </>
                    ) : (
                      <>
                        <LucideIcon name="Plus" size={16} />
                        Create Reward
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search rewards..."
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
          <span className="text-xs text-muted-foreground mr-1">Category:</span>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat)}
              className="text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchRewards} className="ml-auto">
          <LucideIcon name="RefreshCw" size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            Loading rewards...
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            {searchTerm ? 'No rewards match your search' : 'No rewards found. Create one to get started.'}
          </div>
        ) : (
          filteredRewards.map((reward) => (
            <Card key={reward.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{reward.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(reward.category)} variant="secondary">
                        {reward.category}
                      </Badge>
                      {reward.is_global ? (
                        <Badge variant="success" className="text-xs">🌍 Global</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">🏢 Specific</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="success">{reward.points_cost} PTS</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {reward.photo && (
                  <div className="mb-3 rounded-lg overflow-hidden h-32">
                    <img 
                      src={reward.photo} 
                      alt={reward.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {reward.description || 'No description'}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-sm">
                    Stock: <strong>{reward.stock}</strong>
                    {reward.organization?.name && (
                      <span className="block text-xs text-muted-foreground">
                        {reward.organization.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleReplenishStock(reward.id, 10)}
                    >
                      +10
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(reward.id)}
                    >
                      <LucideIcon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}