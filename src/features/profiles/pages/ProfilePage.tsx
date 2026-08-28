import { useState, useRef } from 'react';
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDepartments,
  useTeams,
} from '../queries/profileQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: profile,
    isLoading: profileLoading,
    refetch,
  } = useProfile();

  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateProfile();

  const { mutate: uploadAvatar, isPending: isUploading } =
    useUploadAvatar();

  const { data: departments } = useDepartments();
  const { data: teams } = useTeams(profile?.department_id ?? undefined);

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    department_id: '',
    team_id: '',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        job_title: profile.job_title || '',
        department_id: profile.department_id || '',
        team_id: profile.team_id || '',
      });

      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const cleanData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
      job_title: formData.job_title || null,
      department_id: formData.department_id || null,
      team_id: formData.team_id || null,
    };

    updateProfile(cleanData, {
      onSuccess: () => {
        setIsEditing(false);
        refetch();
      },
      onError: (error) => {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    uploadAvatar(file, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload profile image. Please try again.');
      },
    });
  };

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <div className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Account / Profile
                </span>
              </div>
            </div>

            <div className="px-6 py-16 text-center sm:px-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/30">
                <svg
                  className="h-7 w-7 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.5 1.5-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-2.12v-.5a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.5-1.5.06-.06A1.65 1.65 0 0 0 9.4 15a1.65 1.65 0 0 0-1.51-1H7.4v-2.12h.5a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.5-1.5.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V5h2.12v.5a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.5 1.5-.06.06A1.65 1.65 0 0 0 19.4 10c.2.61.76 1 1.4 1h.5v2.12h-.5c-.64 0-1.2.39-1.4 1Z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold tracking-tight">
                Profile Not Found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Your profile hasn&apos;t been created yet. Please contact
                your administrator.
              </p>

              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                If you just signed up, try logging out and back in.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fullName =
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  const initials =
    `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`
      .toUpperCase() || 'U';

  const departmentName =
    departments?.find(
      (department) => department.id === profile.department_id,
    )?.name || 'Unassigned';

  const teamName =
    teams?.find((team) => team.id === profile.team_id)?.name ||
    'Unassigned';

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const inputClass =
    'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10';

  const selectClass =
    'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10';

  return (
    <div className="min-h-full px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* =========================================================
            PAGE HEADER
        ========================================================== */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />

              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Account / Identity
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Profile
            </h1>

            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Manage your professional identity and account information.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account Active
            </span>
          </div>
        </div>

        {/* =========================================================
            PROFILE HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

          {/* Subtle terminal grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              {/* Identity */}
              <div className="flex min-w-0 items-center gap-4 sm:gap-6">

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full border border-primary/20" />

                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-background bg-primary/10 shadow-lg sm:h-24 sm:w-24">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <span className="font-mono text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Change profile image"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-foreground text-background shadow-md transition-all hover:scale-105 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"
                        />
                        <circle cx="12" cy="13" r="3.2" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Name / identity */}
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                      {fullName}
                    </h2>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  {profile.job_title && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {profile.job_title}
                    </p>
                  )}

                  <p className="mt-1 truncate text-xs text-muted-foreground/80">
                    {profile.email}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {departmentName}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-border" />

                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {teamName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary lg:self-center"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 20h9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* =======================================================
              METRICS STRIP
          ======================================================== */}
          <div className="relative grid grid-cols-2 border-t border-border sm:grid-cols-4">
            <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Member Since
              </p>

              <p className="mt-1.5 text-sm font-semibold">
                {memberSince}
              </p>
            </div>

            <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Department
              </p>

              <p className="mt-1.5 truncate text-sm font-semibold">
                {departmentName}
              </p>
            </div>

            <div className="border-r border-border p-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Team
              </p>

              <p className="mt-1.5 truncate text-sm font-semibold">
                {teamName}
              </p>
            </div>

            <div className="p-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            EDIT MODE
        ========================================================== */}
        {isEditing && (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

            <div className="flex flex-col gap-2 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />

                  <h3 className="text-sm font-semibold">
                    Edit Profile
                  </h3>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Update your professional and contact information.
                </p>
              </div>

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Profile Configuration
              </span>
            </div>

            <div className="p-5 sm:p-6">

              {/* Identity */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Identity
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="first_name"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      First Name
                    </label>

                    <input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          first_name: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Last Name
                    </label>

                    <input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          last_name: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="mt-7">
                <div className="mb-4 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Professional
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="job_title"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Job Title
                    </label>

                    <input
                      id="job_title"
                      type="text"
                      value={formData.job_title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          job_title: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. Senior Trader"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Department
                    </label>

                    <select
                      id="department"
                      value={formData.department_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_id: e.target.value,
                          team_id: '',
                        })
                      }
                      className={selectClass}
                    >
                      <option value="">Select Department</option>

                      {departments?.map((department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="team"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Team
                    </label>

                    <select
                      id="team"
                      value={formData.team_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          team_id: e.target.value,
                        })
                      }
                      className={selectClass}
                    >
                      <option value="">Select Team</option>

                      {teams?.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-7">
                <div className="mb-4 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Contact
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="phone"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="+234..."
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </label>

                    <div className="mt-2 flex min-h-[46px] items-center rounded-xl border border-border bg-muted/30 px-4 text-sm text-muted-foreground">
                      {profile.email}
                    </div>

                    <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                      Email is managed by your account provider.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            PROFILE DETAILS
        ========================================================== */}
        {!isEditing && (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

            <div className="border-b border-border px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />

                    <h3 className="text-sm font-semibold">
                      Profile Information
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Your current account and professional details.
                  </p>
                </div>

                <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  Account Data
                </span>
              </div>
            </div>

            <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">

              {/* Identity */}
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Identity
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-5">

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {fullName || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium">
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {profile.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Professional
                  </span>

                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-5">

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Job Title
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {profile.job_title || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Department
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {departmentName}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Team
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {teamName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer metadata */}
            <div className="flex flex-col gap-3 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Account verified
                </span>
              </div>

              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Member since {memberSince}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            BOTTOM STATUS
        ========================================================== */}
        <div className="flex flex-col gap-2 px-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            SignalXY Account Terminal
          </p>

          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            Profile data synchronized
          </p>
        </div>
      </div>
    </div>
  );
}