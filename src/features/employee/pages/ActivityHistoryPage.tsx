// src/features/activities/pages/ActivityHistoryPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { useNavigate } from 'react-router-dom';

interface JoinedActivity {
  id: string;
  activity_id: string;
  status: string;
  joined_at: string;
  completed_at: string | null;
  activity: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    image_url: string | null;
    status: string;
    category: { name: string } | null;
  };
}

export default function ActivityHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<JoinedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_participations')
        .select(`
          id,
          activity_id,
          status,
          joined_at,
          completed_at,
          activity:activity_id (
            id,
            title,
            description,
            points,
            image_url,
            status,
            category:category_id (name)
          )
        `)
        .eq('profile_id', user?.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity history:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'joined':
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Joined</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity History</h1>
        <p className="text-muted-foreground">View all the activities you've joined</p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No activities joined yet</p>
            <p className="text-sm text-muted-foreground">Start exploring and join your first activity!</p>
            <Button onClick={() => navigate('/employee/activities')} className="mt-4">
              Browse Activities
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {item.activity.image_url && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={item.activity.image_url} 
                    alt={item.activity.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{item.activity.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.activity.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <Badge variant="success" className="font-mono text-xs">
                    +{item.activity.points} PTS
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </span>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => navigate(`/employee/activities/${item.activity_id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}