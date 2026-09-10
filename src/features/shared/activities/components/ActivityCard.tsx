// src/features/activities/components/ActivityCard.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Activity } from '../types/activity.types';

interface ActivityCardProps {
  activity: Activity;
  isFeatured?: boolean;
  interestMatch?: boolean;
  onAdd?: () => void;
  onFlag?: () => void;
  onFeature?: () => void;
  showFeature?: boolean;
}

export function ActivityCard({
  activity,
  isFeatured = false,
  interestMatch = false,
  onAdd,
  onFlag,
  onFeature,
  showFeature = false,
}: ActivityCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  const getCategoryColor = (categoryName?: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'sports': return 'bg-blue-100 text-blue-700';
      case 'wellness': return 'bg-emerald-100 text-emerald-700';
      case 'learning': return 'bg-purple-100 text-purple-700';
      case 'social': return 'bg-amber-100 text-amber-700';
      case 'hobby': return 'bg-pink-100 text-pink-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'meetup': return 'Users';
      case 'google_places': return 'MapPin';
      case 'employee_suggestion': return 'Lightbulb';
      default: return 'Calendar';
    }
  };

  const handleAdd = () => {
    setIsAdded(true);
    if (onAdd) onAdd();
    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <Card className={`relative hover:shadow-md transition-all duration-200 ${
      isFeatured ? 'border-amber-400 ring-2 ring-amber-200/50' : ''
    } ${interestMatch ? 'border-primary/30' : ''}`}>
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
            <LucideIcon name="Star" size={12} className="fill-white" />
            Featured
          </span>
        </div>
      )}

      {/* Interest Match Badge */}
      {interestMatch && !isFeatured && (
        <div className="absolute -top-2 -left-2 z-10">
          <span className="px-2 py-0.5 bg-primary/80 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
            <LucideIcon name="Sparkles" size={12} />
            Recommended
          </span>
        </div>
      )}

      {/* Status Badge */}
      {activity.status === 'published' && !isFeatured && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
            Published
          </span>
        </div>
      )}

      {activity.status === 'active' && !isFeatured && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
            Active
          </span>
        </div>
      )}

      {/* Source Badge */}
      {activity.source && activity.source !== 'manual' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-medium rounded-full flex items-center gap-1 backdrop-blur-sm">
            <LucideIcon name={getSourceIcon(activity.source) as any} size={10} />
            {activity.source.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={getCategoryColor(activity.category?.name)}>
                {activity.category?.name || 'Uncategorized'}
              </Badge>
              {activity.distance_miles !== null && activity.distance_miles !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {activity.distance_miles} mi away
                </Badge>
              )}
            </div>
            <CardTitle className="text-base line-clamp-2">{activity.title}</CardTitle>
          </div>
          <Badge variant="success" className="font-mono shrink-0 ml-2">
            +{activity.points} PTS
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {activity.description || 'No description'}
        </p>

        {/* Location & Date */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {activity.location_lat && (
            <span className="flex items-center gap-1">
              <LucideIcon name="MapPin" size={12} />
              {activity.organization?.name || 'Global'}
            </span>
          )}
          {activity.start_at && (
            <span className="flex items-center gap-1">
              <LucideIcon name="Calendar" size={12} />
              {new Date(activity.start_at).toLocaleDateString()}
            </span>
          )}
          {activity.attendees_count !== undefined && (
            <span className="flex items-center gap-1">
              <LucideIcon name="Users" size={12} />
              {activity.attendees_count} attending
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <LucideIcon name="Info" size={14} className="mr-1" />
              Details
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onFlag}
            >
              <LucideIcon name="Flag" size={14} className="mr-1" />
              Flag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {showFeature && onFeature && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onFeature}
              >
                <LucideIcon name="Star" size={14} className="mr-1" />
                Feature
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              className={`text-xs ${isAdded ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
              onClick={handleAdd}
              disabled={isAdded}
            >
              {isAdded ? (
                <>
                  <LucideIcon name="Check" size={14} className="mr-1" />
                  Added
                </>
              ) : (
                <>
                  <LucideIcon name="Plus" size={14} className="mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}