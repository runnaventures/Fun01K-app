// src/features/platform-admin/organizations/components/OnboardCompanyForm.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { supabase } from '@/lib/supabase';

interface OnboardCompanyFormProps {
  /** Controlled visibility — parent toggles this */
  open: boolean;
  /** Called when user clicks Cancel or X */
  onClose: () => void;
  /** Called after successful creation — parent refetches */
  onSuccess?: () => void;
}

export function OnboardCompanyForm({
  open,
  onClose,
  onSuccess,
}: OnboardCompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    website: '',
    industry: '',
    size: '',
    subscription_plan: 'starter' as 'starter' | 'growth' | 'enterprise',
    monthly_points_allowance: 5000,
    contact_email: '',
  });

  // Reset when the form opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        slug: '',
        website: '',
        industry: '',
        size: '',
        subscription_plan: 'starter',
        monthly_points_allowance: 5000,
        contact_email: '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    setFormData((prev) => {
      const prevDerivedSlug = prev.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      const userEditedSlug = prev.slug !== prevDerivedSlug;
      return {
        ...prev,
        name,
        slug: userEditedSlug ? prev.slug : slug,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        setError('Organization name is required');
        setIsLoading(false);
        return;
      }
      if (!formData.slug.trim()) {
        setError('Slug is required');
        setIsLoading(false);
        return;
      }

      let website = formData.website.trim();
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }

      // Generate company_code: first 8 chars of slug (uppercase) + 4 random digits
      const codeBase =
        formData.slug
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8) || 'ORG';
      const codeNumber = Math.floor(1000 + Math.random() * 9000);
      const companyCode = `${codeBase}-${codeNumber}`;

      const { error: insertError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          website: website || null,
          industry: formData.industry.trim() || null,
          size: formData.size ? parseInt(formData.size) : null,
          timezone: 'UTC',
          status: 'active',
          subscription_plan: formData.subscription_plan,
          monthly_points_allowance: formData.monthly_points_allowance,
          contact_email: formData.contact_email.trim() || null,
          company_code: companyCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setFormData({
      name: '',
      slug: '',
      website: '',
      industry: '',
      size: '',
      subscription_plan: 'starter',
      monthly_points_allowance: 5000,
      contact_email: '',
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Don't render if closed
  if (!open) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            <LucideIcon name="Building2" size={20} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Onboard Company Tenant</h3>
            <p className="mt-0.5 text-xs text-indigo-300">
              Add a new organization to the platform
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

      {/* Body */}
      <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
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
                Organization onboarded successfully!
              </span>
              <p className="mt-0.5 text-xs text-emerald-600">Closing...</p>
            </div>
          </div>
        )}

        <form
          id="onboard-company-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Building2" size={16} />
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Laboratories"
                  className="pl-9 py-2.5 text-sm"
                  required
                />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Contact Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Mail" size={16} />
                </div>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="admin@acme.com"
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Link2" size={16} />
                </div>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="acme-laboratories"
                  className="pl-9 py-2.5 text-sm"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                URL-friendly identifier. Auto-generated from name.
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Website
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Globe" size={16} />
                </div>
                <Input
                  type="text"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && !/^https?:\/\//i.test(v)) {
                      setFormData({ ...formData, website: `https://${v}` });
                    }
                  }}
                  placeholder="https://acme.com"
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Industry
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Briefcase" size={16} />
                </div>
                <Input
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Technology"
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Company Size
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Users" size={16} />
                </div>
                <Input
                  type="number"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="50"
                  min={1}
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Subscription Plan */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Subscription Plan
              </label>
              <select
                value={formData.subscription_plan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription_plan: e.target.value as any,
                  })
                }
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Monthly Points */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Monthly Points Allowance
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideIcon name="Coins" size={16} />
                </div>
                <Input
                  type="number"
                  value={formData.monthly_points_allowance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_points_allowance: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
          className="px-6 py-2.5"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isLoading || success}
          onClick={() => {
            const form = document.getElementById(
              'onboard-company-form'
            ) as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Onboarding...
            </>
          ) : success ? (
            <>
              <LucideIcon name="Check" size={16} />
              Onboarded!
            </>
          ) : (
            <>
              <LucideIcon name="Plus" size={16} />
              Onboard Company
            </>
          )}
        </Button>
      </div>
    </div>
  );
}