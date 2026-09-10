// src/features/activities/components/ActivityDetailModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Activity } from '../types/activity.types';

interface ActivityDetailModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: () => void;
  onFlag?: () => void;
}

export function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onAdd,
  onFlag,
}: ActivityDetailModalProps) {
  if (!activity) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <Badge className={getCategoryColor(activity.category?.name)}>
                {activity.category?.name || 'Uncategorized'}
              </Badge>
              {activity.distance_miles !== null && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {activity.distance_miles} mi away
                </Badge>
              )}
              {activity.is_featured && (
                <Badge className="ml-2 bg-amber-500 text-white">
                  ⭐ Featured
                </Badge>
              )}
            </div>
            <Badge variant="success" className="font-mono">
              +{activity.points} PTS
            </Badge>
          </div>

          <DialogTitle className="text-xl mt-2">{activity.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          {activity.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={activity.image_url} 
                alt={activity.title} 
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activity.description || 'No description provided.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="text-sm font-medium">{activity.organization?.name || 'Global'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium capitalize">{activity.source || 'Manual'}</p>
            </div>
            {activity.start_at && (
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{new Date(activity.start_at).toLocaleDateString()}</p>
              </div>
            )}
            {activity.duration && (
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{activity.duration} minutes</p>
              </div>
            )}
            {activity.attendees_count !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Attendees</p>
                <p className="text-sm font-medium">{activity.attendees_count}</p>
              </div>
            )}
            {activity.location_lat && (
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium truncate">
                  {activity.organization?.name || 'Global'}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {activity.interest_tags && activity.interest_tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interests</p>
              <div className="flex flex-wrap gap-1">
                {activity.interest_tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={onFlag}
              >
                <LucideIcon name="Flag" size={16} className="mr-1" />
                Flag
              </Button>
              {activity.external_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(activity.external_url, '_blank')}
                >
                  <LucideIcon name="ExternalLink" size={16} className="mr-1" />
                  View Original
                </Button>
              )}
            </div>
            <Button onClick={onAdd}>
              <LucideIcon name="Plus" size={16} className="mr-1" />
              Add Activity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}