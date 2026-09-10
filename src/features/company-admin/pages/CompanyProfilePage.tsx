// src/features/company-admin/pages/CompanyProfilePage.tsx

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useOrganizations, useUpdateOrganization, useUploadOrganizationLogo, useRemoveOrganizationLogo } from '@/features/platform-admin/organizations/queries/organizationQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { LucideIcon } from '@/components/ui/LucideIcon';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const organizationId = organizationMember?.organization_id || '';
  const { data: organizations, isLoading, refetch } = useOrganizations();
  const { mutate: updateOrganization, isPending: isUpdating } = useUpdateOrganization();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadOrganizationLogo();
  const { mutate: removeLogo, isPending: isRemovingLogo } = useRemoveOrganizationLogo();

  // State for company code
  const [companyCode, setCompanyCode] = useState<string>('');

  // Find the current organization
  const organization = organizations?.find((org: any) => org.id === organizationId);

  // Fetch company code
  useEffect(() => {
    const fetchCompanyCode = async () => {
      if (!organizationId || organizationId === 'super-admin') return;

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('company_code')
          .eq('id', organizationId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company code:', error);
          return;
        }

        if (data?.company_code) {
          setCompanyCode(data.company_code);
        }
      } catch (error) {
        console.error('Error fetching company code:', error);
      }
    };

    fetchCompanyCode();
  }, [organizationId]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    timezone: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleEdit = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        industry: organization.industry || '',
        size: organization.size?.toString() || '',
        website: organization.website || '',
        timezone: organization.timezone || 'UTC',
      });
      setCurrentLogoUrl(organization.logo_url || null);
      setLogoFile(null);
      setLogoPreview('');
      setIsEditing(true);
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    const updateData: any = {
      name: formData.name,
      industry: formData.industry || null,
      size: formData.size ? parseInt(formData.size) : null,
      website: formData.website || null,
      timezone: formData.timezone || 'UTC',
    };

    if (!organizationId || organizationId === 'super-admin') {
      setSaveError('Cannot update super-admin organization. Please use a real organization.');
      return;
    }

    updateOrganization({
      id: organizationId,
      data: updateData,
    }, {
      onSuccess: (updatedOrg) => {
        // If there's a logo file to upload
        if (logoFile) {
          uploadLogo({
            organizationId: organizationId,
            file: logoFile,
          }, {
            onSuccess: () => {
              setLogoFile(null);
              setLogoPreview('');
              setSaveSuccess(true);
              setIsEditing(false);
              refetch();
              setTimeout(() => setSaveSuccess(false), 3000);
            },
            onError: (error) => {
              console.error('Logo upload error:', error);
              setSaveError('Logo upload failed, but company info was saved.');
              setSaveSuccess(true);
              setIsEditing(false);
              refetch();
              setTimeout(() => setSaveSuccess(false), 3000);
            },
          });
        } else {
          setSaveSuccess(true);
          setIsEditing(false);
          refetch();
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      },
      onError: (error: any) => {
        console.error('Update error:', error);
        setSaveError(error?.message || 'Failed to save company profile. Please try again.');
      },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview('');
    setCurrentLogoUrl(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Image size must be less than 5MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setSaveError('Please upload a valid image (JPG, PNG, GIF, or WEBP)');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSaveError(null);
    }
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Remove the company logo?')) {
      setLogoFile(null);
      setLogoPreview('');
      setCurrentLogoUrl(null);
      if (organization?.logo_url) {
        removeLogo(organizationId, {
          onSuccess: () => {
            refetch();
          },
          onError: (error) => {
            console.error('Logo removal error:', error);
            setSaveError('Failed to remove logo. Please try again.');
          },
        });
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Handle super-admin case
  if (organizationId === 'super-admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-muted-foreground">
            Manage your organization's information and branding
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-6 pb-6 border-b">
            <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              <span className="text-3xl font-bold text-primary">F</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Super Admin</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">
                  Development Mode
                </span>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                  ID: super-admin
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                <span>This is a development placeholder organization</span>
              </div>
            </div>
          </div>

          <div className="pt-6 text-center">
            <p className="text-muted-foreground">
              You are currently in super-admin mode. To manage a real organization, 
              please log in with a company admin account.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong>Note:</strong> The super-admin organization is a placeholder for development. 
              Real organizations will appear here when you are logged in as a company admin.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no organization found
  if (!organization) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏢</div>
        <h2 className="text-2xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-muted-foreground">
          We couldn't find your organization. Please contact support.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Organization ID: {organizationId || 'Not found'}
        </p>
      </div>
    );
  }

  const displayCode = companyCode || organization.id?.slice(0, 8) || '';

  // Display logo - either preview, current logo, or initial
  const displayLogo = logoPreview || organization.logo_url || undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          Manage your organization <strong>{organization.name}</strong>
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500 rounded-md text-green-600 text-sm">
          ✅ Company profile updated successfully!
        </div>
      )}
      
      {saveError && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
          ❌ {saveError}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {/* Display Mode - Not Editing */}
        {!isEditing && (
          <>
            {/* Logo Section */}
            <div className="flex items-start gap-6 pb-6 border-b">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  {organization.logo_url ? (
                    <img 
                      src={organization.logo_url} 
                      alt={organization.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {organization.name?.charAt(0) || 'C'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">{organization.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                    {organization.status || 'Active'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                    Company Code: {displayCode}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                  {organization.industry && <span>{organization.industry}</span>}
                  {organization.size && <span>• {organization.size} employees</span>}
                  {organization.website && (
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {organization.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {organization.timezone && <span>• {organization.timezone}</span>}
                </div>
              </div>
              <Button onClick={handleEdit} variant="outline">
                Edit Company Profile
              </Button>
            </div>
          </>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="pt-0">
            {/* Logo Upload Section - Inside Edit Form */}
            <div className="pb-6 border-b mb-6">
              <label className="block text-sm font-medium mb-3">Company Logo</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
                    {displayLogo ? (
                      <img 
                        src={displayLogo} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {formData.name?.charAt(0) || 'C'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <LucideIcon name="Upload" size={14} />
                      {organization.logo_url || logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {(organization.logo_url || logoPreview) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <LucideIcon name="Trash2" size={14} />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 5MB. JPG, PNG, GIF, WEBP
                  </p>
                  {logoFile && (
                    <p className="text-xs text-emerald-600">
                      New logo selected: {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Size</label>
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (EST/EDT)</option>
                  <option value="America/Chicago">Central Time (CST/CDT)</option>
                  <option value="America/Denver">Mountain Time (MST/MDT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Central European Time (CET/CEST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} disabled={isUpdating || isUploading}>
                {isUpdating || isUploading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}