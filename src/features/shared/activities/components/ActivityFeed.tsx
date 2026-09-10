// src/features/activities/components/ActivityFeed.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
// Employee Components
import { EmployeeFeaturedFeed } from './EmployeeFeaturedFeed';
import { EmployeeSocialFeed } from './EmployeeSocialFeed';
import { EmployeePlacesFeed } from './EmployeePlacesFeed';
// Admin Components
import { AdminFeaturedFeed } from './AdminFeaturedFeed';
import { AdminSocialFeed } from './AdminSocialFeed';
import { AdminPlacesFeed } from './AdminPlacesFeed';
import { Activity } from '../types/activity.types';

interface ActivityFeedProps {
  tab?: 'featured' | 'social' | 'places';
  isAdmin?: boolean;
  onAddActivity?: () => void;
}

export function ActivityFeed({ tab = 'featured', isAdmin = false, onAddActivity }: ActivityFeedProps) {
  const { user, userRole } = useAuth();
  const { organizationMember } = useOrganization();
  const [activeTab, setActiveTab] = useState<'featured' | 'social' | 'places'>(tab);
  const [isLoading, setIsLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [joinedActivityIds, setJoinedActivityIds] = useState<string[]>([]);
  
  // Determine user type
  const isCompanyAdmin = isAdmin || userRole === 'admin' || userRole === 'company_owner' || userRole === 'company_admin';
  const isPlatformOwner = userRole === 'platform_owner' || userRole === 'platform_admin';

  // Load user interests for personalization
  useEffect(() => {
    const loadUserInterests = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('interests')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          if (error.code === '42703' || error.message?.includes('column')) {
            setUserInterests([]);
            return;
          }
          throw error;
        }
        setUserInterests(data?.interests || []);
      } catch (error) {
        console.error('Error loading user interests:', error);
        setUserInterests([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserInterests();
  }, [user]);

  // Load joined activity IDs for the employee
  useEffect(() => {
    const loadJoinedActivities = async () => {
      if (!user || isCompanyAdmin) return;
      try {
        const { data, error } = await supabase
          .from('activity_participations')
          .select('activity_id')
          .eq('profile_id', user.id)
          .eq('status', 'joined');
        
        if (error) throw error;
        setJoinedActivityIds(data?.map((item: any) => item.activity_id) || []);
      } catch (error) {
        console.error('Error loading joined activities:', error);
        setJoinedActivityIds([]);
      }
    };
    loadJoinedActivities();
  }, [user, isCompanyAdmin]);

  // Enrich activities with organization and category names
  const enrichActivities = async (data: any[]) => {
    if (!data || data.length === 0) return data;
    
    const orgIds = [...new Set(data.map(a => a.organization_id).filter(Boolean))];
    const catIds = [...new Set(data.map(a => a.category_id).filter(Boolean))];
    
    const [orgResult, catResult] = await Promise.all([
      orgIds.length > 0 
        ? supabase.from('organizations').select('id, name').in('id', orgIds)
        : { data: [] },
      catIds.length > 0
        ? supabase.from('activity_categories').select('id, name, icon, color').in('id', catIds)
        : { data: [] }
    ]);
    
    const orgMap = Object.fromEntries((orgResult.data || []).map((o: any) => [o.id, o]));
    const catMap = Object.fromEntries((catResult.data || []).map((c: any) => [c.id, c]));
    
    return data.map(item => ({
      ...item,
      organization: orgMap[item.organization_id] || null,
      category: catMap[item.category_id] || null,
      location: orgMap[item.organization_id]?.name || null,
    }));
  };

  // Load featured activities
  const loadFeaturedActivities = async (): Promise<Activity[]> => {
    try {
      const organizationId = organizationMember?.organization_id;
      
      let query = supabase
        .from('activities')
        .select('*')
        .in('status', ['published', 'active'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (organizationId && !isPlatformOwner) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return await enrichActivities(data || []);
    } catch (error) {
      console.error('Error loading featured activities:', error);
      return [];
    }
  };

  // Load social activities
  const loadSocialActivities = async (
    searchTerm: string = '',
    selectedCity: string = 'Atlanta',
    selectedDomain: string = 'All'
  ): Promise<Activity[]> => {
    try {
      const organizationId = organizationMember?.organization_id;
      
      let query = supabase
        .from('activities')
        .select('*')
        .in('status', ['published', 'active'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (organizationId && !isPlatformOwner) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedDomain !== 'All') {
        const { data: categoryData } = await supabase
          .from('activity_categories')
          .select('id')
          .ilike('name', `%${selectedDomain}%`)
          .maybeSingle();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      if (selectedCity !== 'All Cities' && selectedCity !== 'Remote/Virtual') {
        const { data: orgsInCity } = await supabase
          .from('organizations')
          .select('id')
          .ilike('name', `%${selectedCity}%`)
          .limit(10);
        
        if (orgsInCity && orgsInCity.length > 0) {
          const orgIds = orgsInCity.map((o: any) => o.id);
          query = query.in('organization_id', orgIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return await enrichActivities(data || []);
    } catch (error) {
      console.error('Error loading social activities:', error);
      return [];
    }
  };

  // Load places activities
  const loadPlacesActivities = async (
    searchTerm: string = '',
    selectedCity: string = 'Atlanta',
    venueType: string = 'All'
  ): Promise<Activity[]> => {
    try {
      const organizationId = organizationMember?.organization_id;
      
      let query = supabase
        .from('activities')
        .select('*')
        .in('status', ['published', 'active'])
        .eq('source', 'google_places')
        .order('created_at', { ascending: false })
        .limit(30);

      if (organizationId && !isPlatformOwner) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (venueType !== 'All') {
        const { data: categoryData } = await supabase
          .from('activity_categories')
          .select('id')
          .ilike('name', `%${venueType}%`)
          .maybeSingle();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      if (selectedCity !== 'All Cities') {
        const { data: orgsInCity } = await supabase
          .from('organizations')
          .select('id')
          .ilike('name', `%${selectedCity}%`)
          .limit(10);
        
        if (orgsInCity && orgsInCity.length > 0) {
          const orgIds = orgsInCity.map((o: any) => o.id);
          query = query.in('organization_id', orgIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return await enrichActivities(data || []);
    } catch (error) {
      console.error('Error loading places activities:', error);
      return [];
    }
  };

  // Handle join activity (Employee)
  const handleJoinActivity = async (activityId: string) => {
    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('activity_participations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (existing) {
        alert('You have already joined this activity!');
        return;
      }

      const { error } = await supabase
        .from('activity_participations')
        .insert({
          activity_id: activityId,
          profile_id: user?.id,
          status: 'joined',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      if (error) throw error;
      
      setJoinedActivityIds([...joinedActivityIds, activityId]);
      
      const { data: activity } = await supabase
        .from('activities')
        .select('attendees_count')
        .eq('id', activityId)
        .single();
      
      if (activity) {
        await supabase
          .from('activities')
          .update({ 
            attendees_count: (activity.attendees_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', activityId);
      }
      
      alert('Successfully joined the activity! ðŸŽ‰');
    } catch (error) {
      console.error('Error joining activity:', error);
      alert('Failed to join activity. Please try again.');
    }
  };

  // Handle add activity (Admin)
  const handleAddActivity = async (activityId: string) => {
    try {
      const { data: existing } = await supabase
        .from('activity_participations')
        .select('id')
        .eq('activity_id', activityId)
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (existing) {
        alert('You have already joined this activity!');
        return;
      }

      const { error } = await supabase
        .from('activity_participations')
        .insert({
          activity_id: activityId,
          profile_id: user?.id,
          status: 'joined',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      if (error) throw error;
      
      const { data: activity } = await supabase
        .from('activities')
        .select('attendees_count')
        .eq('id', activityId)
        .single();
      
      if (activity) {
        await supabase
          .from('activities')
          .update({ 
            attendees_count: (activity.attendees_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', activityId);
      }
      
      alert('Successfully added to the activity! ðŸŽ‰');
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity. Please try again.');
    }
  };

  // Handle flag activity
  const handleFlagActivity = async (activityId: string, reason: string) => {
    if (!reason) return;
    try {
      const { error } = await supabase
        .from('activity_flags')
        .insert({
          activity_id: activityId,
          profile_id: user?.id,
          reason: reason,
          created_at: new Date().toISOString(),
        });
      if (error) throw error;
      alert('Activity flagged for review. Thank you for your feedback!');
    } catch (error) {
      console.error('Error flagging activity:', error);
      alert('Failed to flag activity. Please try again.');
    }
  };

  // Handle feature activity (Admin only)
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
      alert(activity?.is_featured ? 'Activity unfeatured.' : 'Activity featured successfully! â­');
    } catch (error) {
      console.error('Error featuring activity:', error);
      alert('Failed to feature activity. Please try again.');
    }
  };

  // Handle archive activity (Admin only)
  const handleArchiveActivity = async (activityId: string) => {
    if (!confirm('Archive this activity? It will no longer be visible to employees.')) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId);
      if (error) throw error;
      alert('Activity archived successfully.');
    } catch (error) {
      console.error('Error archiving activity:', error);
      alert('Failed to archive activity. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="featured" className="text-xs">
            Featured
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            Social
          </TabsTrigger>
          <TabsTrigger value="places" className="text-xs">
            Places
            <span className="ml-1 text-[10px] text-emerald-500">NEW</span>
          </TabsTrigger>
        </TabsList>

        {/* Featured Tab */}
        <TabsContent value="featured" className="mt-4">
          {isCompanyAdmin ? (
            <AdminFeaturedFeed
              loadActivities={loadFeaturedActivities}
              onAddActivity={handleAddActivity}
              onFeatureActivity={handleFeatureActivity}
              onArchiveActivity={handleArchiveActivity}
              onAddNewActivity={onAddActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
            />
          ) : (
            <EmployeeFeaturedFeed
              loadActivities={loadFeaturedActivities}
              onJoinActivity={handleJoinActivity}
              onFlagActivity={handleFlagActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
              joinedActivityIds={joinedActivityIds}
            />
          )}
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="mt-4">
          {isCompanyAdmin ? (
            <AdminSocialFeed
              loadActivities={loadSocialActivities}
              onAddActivity={handleAddActivity}
              onFlagActivity={handleFlagActivity}
              onFeatureActivity={handleFeatureActivity}
              onAddNewActivity={onAddActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
            />
          ) : (
            <EmployeeSocialFeed
              loadActivities={loadSocialActivities}
              onJoinActivity={handleJoinActivity}
              onFlagActivity={handleFlagActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
              joinedActivityIds={joinedActivityIds}
            />
          )}
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="mt-4">
          {isCompanyAdmin ? (
            <AdminPlacesFeed
              loadActivities={loadPlacesActivities}
              onAddActivity={handleAddActivity}
              onFlagActivity={handleFlagActivity}
              onFeatureActivity={handleFeatureActivity}
              onAddNewActivity={onAddActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
            />
          ) : (
            <EmployeePlacesFeed
              loadActivities={loadPlacesActivities}
              onJoinActivity={handleJoinActivity}
              onFlagActivity={handleFlagActivity}
              userInterests={userInterests}
              organizationId={organizationMember?.organization_id}
              joinedActivityIds={joinedActivityIds}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}