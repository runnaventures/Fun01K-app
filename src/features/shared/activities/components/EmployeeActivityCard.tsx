// src/features/shared/activities/components/EmployeeActivityCard.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { cn } from '@/lib/utils';
import type { Activity } from '../types/activity.types';

interface EmployeeActivityCardProps {
  activity: Activity;
  onJoin: () => void;
  onFlag: () => void;
  onDetails: () => void;
  isFeatured?: boolean;
  isSpotlight?: boolean;
  interestMatch?: boolean;
  isJoined?: boolean;
}

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://bteqcbfdbsmszitaxuiy.supabase.co';

// ─── Interest resolvers ──────────────────────────────────────────────

function resolveInterestLabel(activity: any): string | null {
  if (activity?.sub_interest?.name && activity?.interest?.name) {
    return `${activity.interest.name} · ${activity.sub_interest.name}`;
  }
  if (activity?.interest?.name) return activity.interest.name;
  if (activity?.category?.name) return activity.category.name;
  return null;
}

function resolveInterestIcon(activity: any): string {
  if (activity?.interest?.icon) return activity.interest.icon;
  if (activity?.category?.icon) return activity.category.icon;
  return '🎯';
}

function resolveInterestStyle(activity: any): string {
  const map: Record<string, string> = {
    sports: 'bg-blue-500/10 text-blue-600',
    wellness: 'bg-emerald-500/10 text-emerald-600',
    learning: 'bg-purple-500/10 text-purple-600',
    social: 'bg-amber-500/10 text-amber-700',
    creative: 'bg-pink-500/10 text-pink-600',
    hobby: 'bg-violet-500/10 text-violet-600',
    professional: 'bg-indigo-500/10 text-indigo-600',
    community: 'bg-teal-500/10 text-teal-600',
    outdoor: 'bg-orange-500/10 text-orange-600',
  };
  const key =
    activity?.interest?.name?.toLowerCase() ||
    activity?.category?.name?.toLowerCase() ||
    '';
  return map[key] || 'bg-slate-500/10 text-slate-600';
}

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

function formatShortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) +
    ' • ' +
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  );
}

function formatDistance(miles?: number | null): string | null {
  if (miles === null || miles === undefined) return null;
  if (miles < 0.1) return 'Nearby';
  return `${miles.toFixed(1)} mi away`;
}

export function EmployeeActivityCard({
  activity,
  onJoin,
  onFlag,
  onDetails,
  isFeatured = false,
  isSpotlight = false,
  interestMatch = false,
  isJoined = false,
}: EmployeeActivityCardProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    if (isJoined) return;
    setIsJoining(true);
    onJoin();
    setTimeout(() => setIsJoining(false), 2500);
  };

  const points = activity.points ?? 0;
  const distance = formatDistance(activity.distance_miles);
  const interestLabel = resolveInterestLabel(activity);
  const interestStyle = resolveInterestStyle(activity);
  const interestIcon = resolveInterestIcon(activity);
  const imageUrl = resolveImageUrl(activity);
  const sourceBadge = resolveSourceBadge(activity);
  const organizerName =
    (activity as any).organization?.name || (activity as any).host_name || 'Fun01K';

  const isGoldCard = isSpotlight || isFeatured;

  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        isGoldCard
          ? 'border-amber-300 shadow-amber-100/60 ring-1 ring-amber-200/40'
          : 'border-slate-200 shadow-sm',
        interestMatch && !isGoldCard && 'ring-2 ring-indigo-200'
      )}
    >
      {/* Organizer row */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <LucideIcon name="Users" size={11} />
          </div>
          <p className="truncate text-xs font-semibold text-slate-700">
            {organizerName}
          </p>
          <LucideIcon name="BadgeCheck" size={12} className="shrink-0 text-sky-500" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSpotlight && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <LucideIcon name="Star" size={10} className="fill-amber-600 text-amber-600" />
              Spotlight
            </span>
          )}
          {interestLabel ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                interestStyle
              )}
            >
              <span aria-hidden>{interestIcon}</span>
              {interestLabel}
            </span>
          ) : sourceBadge ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                sourceBadge.className
              )}
            >
              {sourceBadge.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* Hero image */}
      <div className="relative mx-4 overflow-hidden rounded-xl bg-slate-100">
        <div className="relative h-40 w-full">
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
                    'text-5xl'
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
              <span className="text-5xl">{interestIcon}</span>
            </div>
          )}
        </div>

        {distance && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-slate-900/85 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            <LucideIcon name="MapPin" size={10} />
            {distance}
          </span>
        )}

        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
          +{points} PTS
        </span>

        {interestMatch && !isFeatured && !isSpotlight && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <LucideIcon name="Sparkles" size={10} />
            For you
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
          {activity.title}
        </h3>

        {activity.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
            {activity.description}
          </p>
        )}

        <div className="mt-auto space-y-1 pt-2 text-xs text-slate-600">
          {activity.start_at && (
            <div className="flex items-start gap-1.5">
              <LucideIcon
                name="Calendar"
                size={12}
                className="mt-0.5 shrink-0 text-slate-400"
              />
              <span className="leading-snug">{formatShortDate(activity.start_at)}</span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-start gap-1.5">
              <LucideIcon
                name="MapPin"
                size={12}
                className="mt-0.5 shrink-0 text-slate-400"
              />
              <span className="line-clamp-1 leading-snug">{activity.location}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-500">
            <LucideIcon name="Users" size={11} />
            {activity.attendees_count ?? 0} attending
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlag}
            className="h-8 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <LucideIcon name="Flag" size={12} className="mr-1" />
            Flag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDetails}
            className="h-8 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <LucideIcon name="Info" size={12} className="mr-1" />
            Details
          </Button>

          <Button
            onClick={handleJoin}
            disabled={isJoined || isJoining}
            className={cn(
              'ml-auto h-9 flex-1 rounded-lg text-xs font-semibold transition-all',
              isJoined
                ? 'cursor-default bg-emerald-500 text-white hover:bg-emerald-500'
                : isJoining
                ? 'cursor-wait bg-slate-400 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            )}
          >
            {isJoined ? (
              <>
                <LucideIcon name="Check" size={13} className="mr-1" />
                Joined
              </>
            ) : isJoining ? (
              <>
                <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Joining…
              </>
            ) : (
              <>
                <LucideIcon name="Plus" size={13} className="mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}