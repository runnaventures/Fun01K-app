// src/features/activities/pages/ActivityDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Activity } from '@/features/shared/activities/types/activity.types';

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          organization:organization_id(id, name),
          category:category_id(id, name, icon, color),
          type:type_id(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setActivity(data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!activity) return;
    setIsJoining(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        alert('Please login to join this activity');
        return;
      }

      const { error } = await supabase
        .from('activity_participations')
        .insert({
          activity_id: activity.id,
          profile_id: userId,
          status: 'joined',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Successfully joined the activity! 🎉');
      navigate('/employee/activities');
    } catch (error) {
      console.error('Error joining activity:', error);
      alert('Failed to join activity. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Activity not found</h2>
        <p className="text-muted-foreground">The activity you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/employee/activities')} className="mt-4">
          Back to Activities
        </Button>
      </div>
    );
  }

  const getCategoryColor = (categoryName?: string) => {
    const colors: Record<string, string> = {
      'sports': 'bg-blue-500/10 text-blue-600 border-blue-200',
      'wellness': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      'learning': 'bg-purple-500/10 text-purple-600 border-purple-200',
      'social': 'bg-amber-500/10 text-amber-600 border-amber-200',
      'creative': 'bg-pink-500/10 text-pink-600 border-pink-200',
      'professional': 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      'community': 'bg-teal-500/10 text-teal-600 border-teal-200',
      'outdoor': 'bg-orange-500/10 text-orange-600 border-orange-200',
    };
    return colors[categoryName?.toLowerCase() || ''] || 'bg-slate-500/10 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/employee/activities')} className="mb-4">
        <LucideIcon name="ArrowLeft" size={16} className="mr-2" />
        Back to Activities
      </Button>

      <Card className="overflow-hidden">
        {activity.image_url && (
          <div className="relative h-64 overflow-hidden">
            <img 
              src={activity.image_url} 
              alt={activity.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm ${getCategoryColor(activity.category?.name)} bg-white/90`}>
                {activity.category?.name || 'Uncategorized'}
              </span>
            </div>
            <div className="absolute bottom-4 right-4">
              <span className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-1.5">
                <LucideIcon name="Coins" size={16} />
                +{activity.points} PTS
              </span>
            </div>
          </div>
        )}

        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          
          <div className="flex flex-wrap gap-2">
            {activity.status === 'published' && (
              <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                Published
              </Badge>
            )}
            {activity.status === 'active' && (
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                Active
              </Badge>
            )}
            {activity.is_featured && (
              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                <LucideIcon name="Star" size={12} className="mr-1 fill-amber-500" />
                Featured
              </Badge>
            )}
            {activity.is_global && (
              <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                🌍 Global
              </Badge>
            )}
          </div>

          <p className="text-slate-600 whitespace-pre-wrap">{activity.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {activity.location && (
              <div className="flex items-start gap-2">
                <LucideIcon name="MapPin" size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{activity.location}</p>
                </div>
              </div>
            )}
            {activity.start_at && (
              <div className="flex items-start gap-2">
                <LucideIcon name="Calendar" size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.start_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    {' at '}
                    {new Date(activity.start_at).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-start gap-2">
                <LucideIcon name="Clock" size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{activity.duration} minutes</p>
                </div>
              </div>
            )}
            {activity.attendees_count !== undefined && (
              <div className="flex items-start gap-2">
                <LucideIcon name="Users" size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Attendees</p>
                  <p className="text-sm text-muted-foreground">{activity.attendees_count} people attending</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button 
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <LucideIcon name="UserPlus" size={16} className="mr-2" />
                  Join Activity
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}