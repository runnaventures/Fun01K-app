// src/features/platform-admin/components/CompanyDirectory/CreateCompanyDialog.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface CreateCompanyDialogProps {
  onCompanyCreated?: () => void;
  children: React.ReactNode;
}

export function CreateCompanyDialog({ onCompanyCreated, children }: CreateCompanyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: '',
    size: 10,
    timezone: 'UTC',
    adminEmail: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        setError('Company name is required');
        setIsLoading(false);
        return;
      }

      const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          slug: slug,
          industry: formData.industry || null,
          size: formData.size || 10,
          timezone: formData.timezone || 'UTC',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      setFormData({
        name: '',
        slug: '',
        industry: '',
        size: 10,
        timezone: 'UTC',
        adminEmail: '',
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        if (onCompanyCreated) {
          onCompanyCreated();
        }
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating company:', error);
      setError(error.message || 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = () => {
    if (formData.name.trim()) {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, slug });
    }
  };

  const industries = [
    { value: '', label: 'Select industry...' },
    { value: 'Technology', label: '💻 Technology', icon: 'Cpu' },
    { value: 'Healthcare', label: '🏥 Healthcare', icon: 'HeartPulse' },
    { value: 'Finance', label: '💰 Finance', icon: 'Banknote' },
    { value: 'Education', label: '📚 Education', icon: 'BookOpen' },
    { value: 'Retail', label: '🛍️ Retail', icon: 'ShoppingBag' },
    { value: 'Manufacturing', label: '🏭 Manufacturing', icon: 'Factory' },
    { value: 'Consulting', label: '📊 Consulting', icon: 'TrendingUp' },
    { value: 'Nonprofit', label: '🤝 Nonprofit', icon: 'HandHeart' },
    { value: 'Other', label: '📌 Other', icon: 'MoreHorizontal' },
  ];

  const timezones = [
    { value: 'UTC', label: '🌐 UTC' },
    { value: 'America/New_York', label: '🗽 Eastern (EST)' },
    { value: 'America/Chicago', label: '🌽 Central (CST)' },
    { value: 'America/Denver', label: '⛰️ Mountain (MST)' },
    { value: 'America/Los_Angeles', label: '🌴 Pacific (PST)' },
    { value: 'Europe/London', label: '🇬🇧 London (GMT)' },
    { value: 'Europe/Paris', label: '🇫🇷 Paris (CET)' },
    { value: 'Asia/Dubai', label: '🇦🇪 Dubai (GST)' },
    { value: 'Asia/Singapore', label: '🇸🇬 Singapore (SGT)' },
    { value: 'Australia/Sydney', label: '🇦🇺 Sydney (AEDT)' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <LucideIcon name="Building2" size={20} className="text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-bold">
                Onboard New Company
              </DialogTitle>
              <p className="text-slate-400 text-xs mt-0.5">
                Add a new organization to the platform
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
                <span className="text-sm text-emerald-700 font-medium">Company created successfully!</span>
                <p className="text-xs text-emerald-600 mt-0.5">Redirecting...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Building2" size={16} />
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  className="pl-9 py-2.5 text-sm border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  onBlur={generateSlug}
                />
              </div>
            </div>

            {/* Company Slug */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Company URL <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">fun01k.com/</span>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="acme-corp"
                  className="border-0 bg-transparent px-0 py-1.5 text-sm focus:ring-0 focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <LucideIcon name="Info" size={12} />
                Leave blank to auto-generate from company name
              </p>
            </div>

            {/* Industry & Size Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Industry
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <LucideIcon name="Briefcase" size={16} />
                  </div>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {industries.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <LucideIcon name="ChevronDown" size={16} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company Size
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <LucideIcon name="Users" size={16} />
                  </div>
                  <Input
                    type="number"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 10 })}
                    min={1}
                    className="pl-9 py-2.5 text-sm border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Timezone
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="Globe" size={16} />
                </div>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <LucideIcon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Admin Email <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Mail" size={16} />
                </div>
                <Input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@company.com"
                  className="pl-9 py-2.5 text-sm border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <LucideIcon name="Info" size={12} />
                You can invite the admin user after creation
              </p>
            </div>

            {/* Divider */}
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
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg shadow-sm shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    Create Company
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