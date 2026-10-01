// src/features/shared/activities/components/AdminActivityCard.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/utils';
import type { Activity } from '../types/activity.types';

interface AdminActivityCardProps {
  activity: Activity;
  onAdd?: () => void;
  onFeature: () => void;
  onArchive: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  isSpotlight?: boolean;
}

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://bteqcbfdbsmszitaxuiy.supabase.co';

// ─── Interest helpers (fall back to legacy category) ────────────────

function getInterestStyle(name?: string | null): string {
  const map: Record<string, string> = {
    sports: 'bg-blue-500/10 text-blue-600 border-blue-200',
    wellness: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    learning: 'bg-purple-500/10 text-purple-600 border-purple-200',
    social: 'bg-amber-500/10 text-amber-600 border-amber-200',
    creative: 'bg-pink-500/10 text-pink-600 border-pink-200',
    professional: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    community: 'bg-teal-500/10 text-teal-600 border-teal-200',
    outdoor: 'bg-orange-500/10 text-orange-600 border-orange-200',
    hobby: 'bg-violet-500/10 text-violet-600 border-violet-200',
  };
  return (
    map[name?.toLowerCase() || ''] ||
    'bg-slate-500/10 text-slate-600 border-slate-200'
  );
}

function getInterestIcon(name?: string | null): string {
  const map: Record<string, string> = {
    sports: '⚽',
    wellness: '🧘',
    learning: '📚',
    social: '🤝',
    outdoor: '🏔️',
    hobby: '🎯',
  };
  return map[name?.toLowerCase() || ''] || '📌';
}

function resolveInterestLabel(activity: any): string | null {
  const interestName = activity?.interest?.name;
  const subName = activity?.sub_interest?.name;
  const categoryName = activity?.category?.name;

  if (interestName && subName) return `${interestName} · ${subName}`;
  if (interestName) return interestName;
  if (categoryName) return categoryName;
  return null;
}

function resolveInterestIcon(activity: any): string {
  if (activity?.interest?.icon) return activity.interest.icon;
  if (activity?.interest?.name) return getInterestIcon(activity.interest.name);
  if (activity?.category?.icon) return activity.category.icon;
  if (activity?.category?.name) return getInterestIcon(activity.category.name);
  return '📌';
}

/**
 * Returns a URL for the card's image:
 *  1. activity.image_url (manually uploaded / previously stored)
 *  2. Live-proxied Google Places photo (from stored photo reference)
 *  3. null (caller renders the icon fallback)
 */
function resolveImageUrl(activity: any): string | null {
  if (activity?.image_url) return activity.image_url;

  if (activity?.external_source === 'google_places') {
    const photoName = activity?.external_payload?.photo_name;
    if (photoName) {
      return `${SUPABASE_URL}/functions/v1/places-photo?name=${encodeURIComponent(
        photoName
      )}&maxWidth=800`;
    }
  }

  return null;
}

/**
 * Returns a source pill for externally-imported activities.
 * Google Places activities get a small pill instead of "Uncategorized".
 */
function resolveSourceBadge(
  activity: any
): { label: string; className: string } | null {
  if (activity?.external_source === 'google_places') {
    return {
      label: 'Google Place',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }
  return null;
}

function formatEventDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' • ' +
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  );
}

export function AdminActivityCard({
  activity,
  onFeature,
  onArchive,
  onEdit,
  onRefresh,
  isSpotlight = false,
}: AdminActivityCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const points = activity.points ?? 0;
  const interestLabel = resolveInterestLabel(activity);
  const interestIcon = resolveInterestIcon(activity);
  const imageUrl = resolveImageUrl(activity);
  const sourceBadge = resolveSourceBadge(activity);
  const organizerName = (activity as any).organization?.name || 'Global';

  const statusStyle: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    published: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', activity.id);
      if (!error) onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isGoldCard = isSpotlight || activity.is_featured;

  return (
    <Card
      className={cn(
        'group overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        isGoldCard
          ? 'border-amber-300 shadow-amber-100/60 ring-1 ring-amber-200/40'
          : 'border-slate-200 shadow-sm'
      )}
    >
      {/* IMAGE */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={activity.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = (e.currentTarget as HTMLImageElement).parentElement;
              if (parent) {
                parent.classList.add(
                  'flex',
                  'items-center',
                  'justify-center',
                  'text-6xl'
                );
                parent.textContent = interestIcon;
              }
            }}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              isSpotlight
                ? 'from-amber-100 via-amber-50 to-white'
                : 'from-slate-100 via-slate-50 to-white'
            )}
          >
            <span className="text-6xl">{interestIcon}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

        {/* LEFT top: featured/spotlight badge */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {isSpotlight && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-950 shadow-sm">
              <LucideIcon name="Star" size={12} className="fill-amber-950" />
              SPOTLIGHT
            </span>
          )}
          {activity.is_featured && !isSpotlight && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
              <LucideIcon
                name="Star"
                size={12}
                className="fill-amber-400 text-amber-400"
              />
              FEATURED
            </span>
          )}
          {activity.is_global && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              🌍 Global
            </span>
          )}
        </div>

        {/* RIGHT top: points + status */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            +{points} PTS
          </span>
          <span
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm',
              statusStyle[activity.status || 'draft'] || statusStyle.draft
            )}
          >
            {activity.status || 'draft'}
          </span>
        </div>

        {/* LEFT bottom: location */}
        {activity.location && (
          <span className="absolute bottom-3 left-3 inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-lg bg-slate-900/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <LucideIcon name="MapPin" size={12} className="shrink-0" />
            <span className="truncate">{activity.location}</span>
          </span>
        )}
      </div>

      {/* CONTENT */}
      <CardContent className="space-y-3 p-5">
        {/* Organizer row + interest or source badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <LucideIcon name="Users" size={12} />
            </div>
            <p className="truncate text-sm font-semibold text-slate-800">
              {organizerName}
            </p>
            <LucideIcon
              name="BadgeCheck"
              size={14}
              className="shrink-0 text-sky-500"
            />
          </div>

          {interestLabel ? (
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                getInterestStyle(
                  activity.interest?.name || activity.category?.name
                )
              )}
            >
              {interestLabel}
            </span>
          ) : sourceBadge ? (
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                sourceBadge.className
              )}
            >
              {sourceBadge.label}
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Uncategorized
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-slate-900">
          {activity.title}
        </h3>

        {/* Description */}
        {activity.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
            {activity.description}
          </p>
        )}

        {/* Meta list */}
        <div className="space-y-1.5 pt-1 text-sm text-slate-600">
          {activity.start_at && (
            <div className="flex items-start gap-2">
              <LucideIcon
                name="Calendar"
                size={14}
                className="mt-0.5 shrink-0 text-slate-400"
              />
              <span className="leading-snug">
                {formatEventDate(activity.start_at)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
            <LucideIcon name="Users" size={13} />
            {activity.attendees_count ?? 0} Attending
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            className="h-9 rounded-xl px-3 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <LucideIcon name="Archive" size={14} className="mr-1.5" />
            Archive
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-9 rounded-xl px-3 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <LucideIcon name="Edit2" size={14} className="mr-1.5" />
            Edit
          </Button>

          <Button
            onClick={onFeature}
            className={cn(
              'ml-auto h-10 flex-1 rounded-xl text-sm font-semibold transition-all',
              activity.is_featured
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            )}
          >
            <LucideIcon
              name="Star"
              size={15}
              className={cn('mr-1.5', activity.is_featured && 'fill-white')}
            />
            {activity.is_featured ? 'Unfeature' : 'Feature'}
          </Button>
        </div>

        {/* Status selector */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Status
          </span>
          <select
            value={activity.status || 'draft'}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none disabled:opacity-50"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}