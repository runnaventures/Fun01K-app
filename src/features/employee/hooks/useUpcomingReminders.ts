// src/features/employee/hooks/useUpcomingReminders.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Reminder {
  id: string;
  activityId: string;
  title: string;
  scheduledAt: string;
  location: string | null;
  pointsReward: number;
  categoryName: string | null;
}

export type ReminderUrgency = 'soon' | 'upcoming' | 'today' | 'later';

export interface GroupedReminders {
  urgency: ReminderUrgency;
  label: string;
  items: Reminder[];
}

const REMINDER_WINDOW_HOURS = 24;
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Classify a reminder by how soon it starts.
 *  - soon     : < 30 minutes away
 *   - upcoming : 30 min – 2 hours
 *   - today    : 2 hours – end of today
 *   - later    : tomorrow (still within the 24h window)
 */
function classify(scheduledAt: string): ReminderUrgency {
  const now = Date.now();
  const when = new Date(scheduledAt).getTime();
  const diffMin = (when - now) / 60000;

  if (diffMin <= 30) return 'soon';
  if (diffMin <= 120) return 'upcoming';

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (when <= today.getTime()) return 'today';

  return 'later';
}

export function groupReminders(reminders: Reminder[]): GroupedReminders[] {
  const buckets: Record<ReminderUrgency, Reminder[]> = {
    soon: [],
    upcoming: [],
    today: [],
    later: [],
  };

  reminders.forEach((r) => {
    buckets[classify(r.scheduledAt)].push(r);
  });

  const labels: Record<ReminderUrgency, string> = {
    soon: 'Starting soon',
    upcoming: 'Next 2 hours',
    today: 'Later today',
    later: 'Tomorrow',
  };

  return (['soon', 'upcoming', 'today', 'later'] as ReminderUrgency[])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ urgency: k, label: labels[k], items: buckets[k] }));
}

export function useUpcomingReminders(userId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setReminders([]);
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const cutoff = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

      try {
        const { data, error } = await supabase
          .from('activity_participations')
          .select(
            `
            id,
            activity_id,
            activities:activity_id (
              id,
              title,
              scheduled_at,
              location,
              points_reward,
              category:activity_categories(name)
            )
          `
          )
          .eq('profile_id', userId);

        if (error) throw error;

        const mapped: Reminder[] = (data ?? [])
          .map((row: any) => {
            const activity = row.activities;
            if (!activity || !activity.scheduled_at) return null;
            const when = new Date(activity.scheduled_at);
            if (when < now || when > cutoff) return null;
            return {
              id: row.id,
              activityId: activity.id,
              title: activity.title,
              scheduledAt: activity.scheduled_at,
              location: activity.location ?? null,
              pointsReward: activity.points_reward ?? 0,
              categoryName: activity.category?.name ?? null,
            };
          })
          .filter((x: Reminder | null): x is Reminder => x !== null)
          .sort(
            (a: Reminder, b: Reminder) =>
              new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          );

        if (!cancelled) {
          setReminders(mapped);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading reminders:', err);
        if (!cancelled) {
          setReminders([]);
          setIsLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return { reminders, isLoading };
}

/* -------------------------------------------------------------------------- */
/*                          Formatting helpers (UI)                           */
/* -------------------------------------------------------------------------- */

export function formatTimeUntil(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `in ${hours}h ${remainingMins}m` : `in ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

export function urgencyStyles(u: ReminderUrgency): {
  bar: string;
  dot: string;
  button: string;
} {
  switch (u) {
    case 'soon':
      return {
        bar: 'bg-rose-500',
        dot: 'bg-rose-500',
        button:
          'bg-rose-500 text-white hover:bg-rose-600',
      };
    case 'upcoming':
      return {
        bar: 'bg-amber-400',
        dot: 'bg-amber-400',
        button:
          'bg-amber-500 text-white hover:bg-amber-600',
      };
    case 'today':
      return {
        bar: 'bg-emerald-400',
        dot: 'bg-emerald-400',
        button:
          'bg-emerald-600 text-white hover:bg-emerald-700',
      };
    case 'later':
    default:
      return {
        bar: 'bg-slate-300',
        dot: 'bg-slate-400',
        button:
          'bg-slate-900 text-white hover:bg-slate-800',
      };
  }
}