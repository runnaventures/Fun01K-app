// src/features/shared/activities/components/ActivityFeed.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Sparkles, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmployeeFeaturedFeed } from './EmployeeFeaturedFeed';
import { EmployeeSocialFeed } from './EmployeeSocialFeed';
import { EmployeePlacesFeed } from './EmployeePlacesFeed';
import { AdminFeaturedFeed } from './AdminFeaturedFeed';
import { AdminSocialFeed } from './AdminSocialFeed';
import { AdminPlacesFeed } from './AdminPlacesFeed';
import type { Activity } from '../types/activity.types';

interface ActivityFeedProps {
  tab?: 'featured' | 'social' | 'places';
  isAdmin?: boolean;
  onAddActivity?: () => void;
  isFormOpen?: boolean;
}

type TabId = 'featured' | 'social' | 'places';

export function ActivityFeed({
  tab = 'featured',
  isAdmin = false,
  onAddActivity,
  isFormOpen = false,
}: ActivityFeedProps) {
  const { user, userRole } = useAuth();
  const { organizationMember } = useOrganization();
  const [activeTab, setActiveTab] = useState<TabId>(tab);
  const [isLoading, setIsLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [joinedActivityIds, setJoinedActivityIds] = useState<string[]>([]);
  const [featuredCount, setFeaturedCount] = useState<number | null>(null);

  // Bumped after any admin write to force child feeds to refetch
  const [refreshKey, setRefreshKey] = useState(0);

  const isCompanyAdmin =
    isAdmin ||
    userRole === 'admin' ||
    userRole === 'company_owner' ||
    userRole === 'company_admin';
  const isPlatformOwner =
    userRole === 'platform_owner' || userRole === 'platform_admin';

  // --- Load user interests ---------------------------------------------
  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('interests')
          .eq('id', user.id)
          .maybeSingle();
        if (error && error.code !== '42703') throw error;
        setUserInterests(data?.interests || []);
      } catch (err) {
        console.error('Error loading interests:', err);
        setUserInterests([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [user]);

  // --- Load joined activities ------------------------------------------
  useEffect(() => {
    const run = async () => {
      if (!user || isCompanyAdmin) return;
      try {
        const { data, error } = await supabase
          .from('activity_participations')
          .select('activity_id')
          .eq('profile_id', user.id)
          .eq('status', 'joined');
        if (error) throw error;
        setJoinedActivityIds((data || []).map((r: any) => r.activity_id));
      } catch (err) {
        console.error('Error loading joined:', err);
      }
    };
    run();
  }, [user, isCompanyAdmin]);

  // --- Count featured activities (for tab badge) -----------------------
  useEffect(() => {
    const count = async () => {
      try {
        const organizationId = organizationMember?.organization_id;
        let query = supabase
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('is_featured', true)
          .in('status', ['published', 'active']);
        if (organizationId && !isPlatformOwner) {
          query = query.or(
            `organization_id.eq.${organizationId},organization_id.is.null`
          );
        }
        const { count: total } = await query;
        setFeaturedCount(total ?? 0);
      } catch {
        setFeaturedCount(null);
      }
    };
    count();
  }, [organizationMember?.organization_id, isPlatformOwner, refreshKey]);

  // --- Enrichment helper (used by featured + social feeds) -------------
  const enrichActivities = async (data: any[]) => {
    if (!data || data.length === 0) return data;
    const orgIds = [...new Set(data.map((a) => a.organization_id).filter(Boolean))];
    const catIds = [...new Set(data.map((a) => a.category_id).filter(Boolean))];
    const [orgRes, catRes] = await Promise.all([
      orgIds.length
        ? supabase.from('organizations').select('id, name').in('id', orgIds)
        : { data: [] },
      catIds.length
        ? supabase
            .from('activity_categories')
            .select('id, name, icon, color')
            .in('id', catIds)
        : { data: [] },
    ]);
    const orgMap = Object.fromEntries((orgRes.data || []).map((o: any) => [o.id, o]));
    const catMap = Object.fromEntries((catRes.data || []).map((c: any) => [c.id, c]));
    return data.map((item) => ({
      ...item,
      organization: orgMap[item.organization_id] || null,
      category: catMap[item.category_id] || null,
    }));
  };

  // --- Loaders passed down to child feeds ------------------------------
  const loadFeaturedActivities = async (): Promise<Activity[]> => {
    const organizationId = organizationMember?.organization_id;
    let query = supabase
      .from('activities')
      .select(`
        *,
        interest:interest_id(id, name, icon, color),
        sub_interest:sub_interest_id(id, name, slug)
      `)
      .eq('is_featured', true)
      .in('status', ['published', 'active'])
      .order('featured_at', { ascending: false })
      .limit(20);
    if (organizationId && !isPlatformOwner) {
      query = query.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return (await enrichActivities(data || [])) as Activity[];
  };

  const loadSocialActivities = async (
    searchTerm = '',
    selectedCity = 'Atlanta',
    selectedDomain = 'All'
  ): Promise<Activity[]> => {
    const organizationId = organizationMember?.organization_id;
    let query = supabase
      .from('activities')
      .select(`
        *,
        interest:interest_id(id, name, icon, color),
        sub_interest:sub_interest_id(id, name, slug)
      `)
      .in('status', ['published', 'active'])
      .order('created_at', { ascending: false })
      .limit(50);
    if (organizationId && !isPlatformOwner) {
      query = query.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      );
    }
    if (searchTerm) {
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }
    // Taxonomy-driven filter: match by interest NAME from the chips
    if (selectedDomain !== 'All') {
      const { data: interest } = await supabase
        .from('interests')
        .select('id')
        .ilike('name', selectedDomain)
        .maybeSingle();
      if (interest?.id) {
        query = query.eq('interest_id', interest.id);
      }
    }
    if (
      selectedCity &&
      selectedCity !== 'All Cities' &&
      selectedCity !== 'Remote/Virtual'
    ) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .ilike('name', `%${selectedCity}%`)
        .limit(10);
      if (orgs?.length) query = query.in('organization_id', orgs.map((o: any) => o.id));
    }
    const { data, error } = await query;
    if (error) throw error;
    return (await enrichActivities(data || [])) as Activity[];
  };

  // --- Action handlers passed to child feeds ---------------------------
  const handleJoinActivity = async (activityId: string) => {
    try {
      const { error } = await supabase.from('activity_participations').insert({
        activity_id: activityId,
        profile_id: user?.id,
        status: 'joined',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setJoinedActivityIds((prev) => [...prev, activityId]);
      alert('Successfully joined the activity!');
    } catch (err) {
      console.error('join failed', err);
      alert('Failed to join activity.');
    }
  };

  const handleAddActivity = async (activityId: string) => {
    try {
      await supabase.from('activity_participations').insert({
        activity_id: activityId,
        profile_id: user?.id,
        status: 'joined',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      alert('Added to your activities!');
    } catch (err) {
      console.error('add failed', err);
      alert('Failed to add activity.');
    }
  };

  const handleFlagActivity = async (activityId: string, reason: string) => {
    if (!reason) return;
    try {
      await supabase.from('activity_flags').insert({
        activity_id: activityId,
        profile_id: user?.id,
        reason,
        created_at: new Date().toISOString(),
      });
      alert('Activity flagged for review.');
    } catch (err) {
      console.error('flag failed', err);
      alert('Failed to flag activity.');
    }
  };

  // Bumps refreshKey after any write so children refetch
  const handleFeatureActivity = async (activityId: string) => {
    try {
      const { data: activity } = await supabase
        .from('activities')
        .select('is_featured')
        .eq('id', activityId)
        .single();
      const { error } = await supabase
        .from('activities')
        .update({
          is_featured: !activity?.is_featured,
          featured_at: !activity?.is_featured ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('feature toggle failed', err);
      alert('Failed to update feature status.');
    }
  };

  const handleArchiveActivity = async (activityId: string) => {
    if (!confirm('Archive this activity?')) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', activityId);
      if (error) throw error;
      alert('Activity archived.');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('archive failed', err);
      alert('Failed to archive activity.');
    }
  };

  if (isLoading) return <LoadingScreen />;

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    isNew?: boolean;
  }[] = [
    {
      id: 'featured',
      label: 'Featured',
      icon: <Sparkles className="h-4 w-4" />,
      badge: featuredCount ?? undefined,
    },
    {
      id: 'social',
      label: 'Social',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'places',
      label: 'Places',
      icon: <MapPin className="h-4 w-4" />,
      isNew: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-2xl border bg-white p-1 shadow-sm">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {t.badge}
                  </span>
                )}
                {t.isNew && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-indigo-100 text-indigo-700'
                    )}
                  >
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-slate-700">
            Employer Activity Hub
          </span>
        </div>
      </div>

      {activeTab === 'featured' &&
        (isCompanyAdmin ? (
          <AdminFeaturedFeed
            loadActivities={loadFeaturedActivities}
            onAddActivity={handleAddActivity}
            onFlagActivity={handleFlagActivity}
            onFeatureActivity={handleFeatureActivity}
            onArchiveActivity={handleArchiveActivity}
            onAddNewActivity={onAddActivity}
            isFormOpen={isFormOpen}
            userInterests={userInterests}
            joinedActivityIds={joinedActivityIds}
            refreshKey={refreshKey}
          />
        ) : (
          <EmployeeFeaturedFeed
            loadActivities={loadFeaturedActivities}
            onJoinActivity={handleJoinActivity}
            onFlagActivity={handleFlagActivity}
            userInterests={userInterests}
            joinedActivityIds={joinedActivityIds}
          />
        ))}

      {activeTab === 'social' &&
        (isCompanyAdmin ? (
          <AdminSocialFeed
            loadActivities={loadSocialActivities}
            onAddActivity={handleAddActivity}
            onFlagActivity={handleFlagActivity}
            onFeatureActivity={handleFeatureActivity}
            userInterests={userInterests}
            joinedActivityIds={joinedActivityIds}
            refreshKey={refreshKey}
          />
        ) : (
          <EmployeeSocialFeed
            loadActivities={loadSocialActivities}
            onJoinActivity={handleJoinActivity}
            onFlagActivity={handleFlagActivity}
            userInterests={userInterests}
            joinedActivityIds={joinedActivityIds}
          />
        ))}

      {activeTab === 'places' &&
        (isCompanyAdmin ? (
          <AdminPlacesFeed
            onFeatureActivity={handleFeatureActivity}
            refreshKey={refreshKey}
          />
        ) : (
          <EmployeePlacesFeed />
        ))}
    </div>
  );
}