// src/features/activities/components/AdminActivityFeed.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from '../types/activity.types';

interface AdminActivityFeedProps {
  tab?: 'featured' | 'social' | 'places';
  onAddActivity?: () => void;
}

const CATEGORIES = ['All Categories', 'Wellness', 'Sports', 'Social', 'Hobby', 'Learning'];

export function AdminActivityFeed({ tab = 'featured', onAddActivity }: AdminActivityFeedProps) {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const [activeTab, setActiveTab] = useState<'featured' | 'social' | 'places'>(tab);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Load activities
  useEffect(() => {
    if (activeTab === 'featured') {
      loadFeaturedActivities();
    }
  }, [activeTab, searchTerm, selectedCategory]);

  const loadFeaturedActivities = async () => {
    setIsLoading(true);
    try {
      const organizationId = organizationMember?.organization_id;
      
      let query = supabase
        .from('activities')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('featured_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== 'All Categories') {
        const { data: categoryData } = await supabase
          .from('activity_categories')
          .select('id')
          .ilike('name', `%${selectedCategory}%`)
          .maybeSingle();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with organization and category names
      if (data && data.length > 0) {
        const orgIds = [...new Set(data.map((a: any) => a.organization_id).filter(Boolean))];
        const catIds = [...new Set(data.map((a: any) => a.category_id).filter(Boolean))];
        
        const [orgResult, catResult] = await Promise.all([
          orgIds.length > 0 
            ? supabase.from('organizations').select('id, name').in('id', orgIds)
            : { data: [] },
          catIds.length > 0
            ? supabase.from('activity_categories').select('id, name').in('id', catIds)
            : { data: [] }
        ]);
        
        const orgMap = Object.fromEntries((orgResult.data || []).map((o: any) => [o.id, o]));
        const catMap = Object.fromEntries((catResult.data || []).map((c: any) => [c.id, c]));
        
        const enriched = data.map((item: any) => ({
          ...item,
          organization: orgMap[item.organization_id] || null,
          category: catMap[item.category_id] || null,
        }));
        
        setActivities(enriched);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading featured activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (activityId: string) => {
    if (!confirm('Archive this activity?')) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: 'archived' })
        .eq('id', activityId);
      if (error) throw error;
      loadFeaturedActivities();
    } catch (error) {
      console.error('Error archiving activity:', error);
    }
  };

  const getCategoryIcon = (categoryName?: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'wellness': return 'ðŸŒŸ';
      case 'sports': return 'âš½';
      case 'social': return 'ðŸ¤';
      case 'hobby': return 'ðŸŽ¨';
      case 'learning': return 'ðŸ“š';
      default: return 'ðŸ“Œ';
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'google_places': return <Badge variant="outline" className="text-xs">ðŸ“ Google Place</Badge>;
      case 'meetup': return <Badge variant="outline" className="text-xs">ðŸ‘¥ Meetup</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="featured" className="text-xs">
            Featured ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            Social
          </TabsTrigger>
          <TabsTrigger value="places" className="text-xs">
            Places
          </TabsTrigger>
        </TabsList>

        {/* FEATURED - Admin View */}
        <TabsContent value="featured" className="mt-4">
          {/* Add Activity Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Activities</h2>
              <p className="text-sm text-muted-foreground">
                Create immersive company challenges, social group gatherings, or peer wellness rituals.
              </p>
            </div>
            <Button onClick={onAddActivity}>
              <LucideIcon name="Plus" size={16} className="mr-1" />
              Add Activity
            </Button>
          </div>

          {/* Ready to Engage Banner */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 mb-6 border border-primary/10 text-center">
            <h3 className="text-lg font-semibold">Ready to Engage the Workspace?</h3>
            <p className="text-sm text-muted-foreground">
              Click the "Add Activity" button above to reveal quick presets or the personalized event creator,
              rewarding employees with social points.
            </p>
          </div>

          {/* Active Registry Header */}
          <div className="mb-4">
            <h3 className="font-semibold">Active Registry</h3>
            <p className="text-sm text-muted-foreground">
              Ongoing company challenges, team interactions, or peer wellness rituals.
              Click "Archive" to complete the event.
            </p>
            <p className="text-sm font-medium mt-1">{activities.length} Active Activities</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <LucideIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities by name, category, location..."
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Activities Cards Grid */}
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <p className="text-lg">No featured activities</p>
              <p className="text-sm">Create your first activity to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Left: Image / Icon */}
                      <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {activity.image_url ? (
                          <img 
                            src={activity.image_url} 
                            alt={activity.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-primary/5">
                            {getCategoryIcon(activity.category?.name)}
                          </div>
                        )}
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className="text-xs">
                            {getCategoryIcon(activity.category?.name)} {activity.category?.name || 'Uncategorized'}
                          </Badge>
                          {activity.is_featured && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                              ðŸŒŸ Spotlight
                            </Badge>
                          )}
                          {getSourceBadge(activity.source)}
                          <Badge variant="success" className="text-xs">Active</Badge>
                        </div>

                        <h4 className="font-semibold text-base">{activity.title}</h4>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <LucideIcon name="Coins" size={14} />
                            {activity.points} pts
                          </span>
                          {activity.attendees_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <LucideIcon name="Users" size={14} />
                              {activity.attendees_count} Attending
                            </span>
                          )}
                          {activity.start_at && (
                            <span className="flex items-center gap-1">
                              <LucideIcon name="Calendar" size={14} />
                              {new Date(activity.start_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {activity.description || 'No description'}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-2 mt-2 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleArchive(activity.id)}
                        >
                          Archive
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          <LucideIcon name="Edit2" size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="mt-4">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Social Activities</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="mt-4">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Places Discovery</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}