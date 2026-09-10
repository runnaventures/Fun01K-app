// src/features/platform-admin/components/RewardsManager/CreateRewardDialog.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface CreateRewardDialogProps {
  onRewardCreated?: () => void;
  children: React.ReactNode;
}

export function CreateRewardDialog({ onRewardCreated, children }: CreateRewardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
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
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Reward title is required');
        setIsLoading(false);
        return;
      }

      if (!formData.organization_id) {
        setError('Please select an organization');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('rewards')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          organization_id: formData.organization_id,
          points_cost: formData.points_cost,
          category: formData.category,
          stock: formData.stock,
          icon: formData.icon || 'Gift',
          photo: formData.photo || null,
          provider: formData.provider,
          delivery_method: formData.delivery_method,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

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
      });

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        if (onRewardCreated) {
          onRewardCreated();
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error creating reward:', error);
      setError(error.message || 'Failed to create reward');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'Voucher', label: '🎫 Voucher' },
    { value: 'Experience', label: '🎯 Experience' },
    { value: 'Company Swag', label: '👕 Company Swag' },
    { value: 'Perk', label: '✨ Perk' },
  ];

  const deliveryMethods = [
    { value: 'instant_digital', label: '⚡ Instant Digital' },
    { value: 'manual_fulfillment', label: '📦 Manual Fulfillment' },
  ];

  const iconOptions = [
    'Gift', 'Trophy', 'Star', 'Heart', 'Coffee', 'Music', 'Camera', 
    'Book', 'Bike', 'Plane', 'Car', 'Home', 'ShoppingBag', 'Package'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
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
                Add a new reward for any organization
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5">
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
            {/* Organization */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Organization <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="Building2" size={16} />
                </div>
                <select
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
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

            {/* Category & Provider */}
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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
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
                    onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {deliveryMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <LucideIcon name="ChevronDown" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Icon */}
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

            {/* Photo URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Photo URL <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Image" size={16} />
                </div>
                <Input
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="pl-9 py-2.5 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isLoading || success}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg shadow-sm shadow-amber-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    Create Reward
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