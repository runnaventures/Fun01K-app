// src/features/activities/components/AdminActivityCard.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Activity } from '../types/activity.types';

interface AdminActivityCardProps {
  activity: Activity;
  onAdd: () => void;
  onFeature: () => void;
  onArchive: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  isSpotlight?: boolean;
}

export function AdminActivityCard({
  activity,
  onAdd,
  onFeature,
  onArchive,
  onEdit,
  onRefresh,
  isSpotlight = false,
}: AdminActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const getCategoryIcon = (categoryName?: string) => {
    const icons: Record<string, string> = {
      'sports': '⚽',
      'wellness': '🧘',
      'learning': '📚',
      'social': '🤝',
      'creative': '🎨',
      'professional': '💼',
      'community': '🌍',
      'outdoor': '🏔️',
    };
    return icons[categoryName?.toLowerCase() || ''] || '📌';
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'google_places': return { label: 'Google Place', icon: 'MapPin', color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
      case 'meetup': return { label: 'Meetup', icon: 'Users', color: 'bg-red-500/10 text-red-600 border-red-200' };
      default: return null;
    }
  };

  const sourceInfo = getSourceLabel(activity.source);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', activity.id);
      if (!error) onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br ${
      isSpotlight 
        ? 'from-amber-50 via-white to-amber-50/50 border-2 border-amber-300 shadow-amber-200/30' 
        : 'from-white to-slate-50/50 border border-slate-200'
    }`}>
      {/* Image Section */}
      {activity.image_url ? (
        <div className="relative h-52 overflow-hidden">
          <img 
            src={activity.image_url} 
            alt={activity.title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Spotlight Badge */}
          {isSpotlight && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                <LucideIcon name="Star" size={14} className="fill-amber-900" />
                SPOTLIGHT
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm ${getCategoryColor(activity.category?.name)} bg-white/90`}>
              {getCategoryIcon(activity.category?.name)} {activity.category?.name || 'Uncategorized'}
            </span>
          </div>

          {/* Points Badge */}
          <div className="absolute bottom-4 right-4">
            <span className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-1.5">
              <LucideIcon name="Coins" size={16} />
              +{activity.points} PTS
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-40 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl">{getCategoryIcon(activity.category?.name)}</span>
            <p className="text-xs text-muted-foreground mt-2">{activity.category?.name || 'Uncategorized'}</p>
          </div>
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getCategoryColor(activity.category?.name)}`}>
              {getCategoryIcon(activity.category?.name)} {activity.category?.name || 'Uncategorized'}
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

      {/* Content Section */}
      <CardContent className="p-5 space-y-3">
        {/* Title & Meta */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base text-slate-900 line-clamp-2 flex-1">
              {activity.title}
            </h3>
          </div>
          
          {/* Meta Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {sourceInfo && (
              <Badge variant="outline" className={`text-[10px] font-medium ${sourceInfo.color}`}>
                <LucideIcon name={sourceInfo.icon as any} size={10} className="mr-1" />
                {sourceInfo.label}
              </Badge>
            )}
            {activity.status === 'published' && (
              <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200">
                Published
              </Badge>
            )}
            {activity.status === 'active' && (
              <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                Active
              </Badge>
            )}
            {activity.is_global && (
              <Badge variant="outline" className="text-[10px] text-purple-600 bg-purple-50 border-purple-200">
                🌍 Global
              </Badge>
            )}
            {activity.location && (
              <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200">
                <LucideIcon name="MapPin" size={10} className="mr-1" />
                {activity.location.length > 20 ? activity.location.substring(0, 20) + '...' : activity.location}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm text-slate-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {activity.description || 'No description available'}
        </p>

        {activity.description && activity.description.length > 100 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Date & Attendees */}
        <div className="space-y-1.5 text-sm text-slate-500">
          {activity.start_at && (
            <div className="flex items-center gap-2">
              <LucideIcon name="Calendar" size={14} className="text-slate-400" />
              <span>{new Date(activity.start_at).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}</span>
            </div>
          )}
          {activity.attendees_count !== undefined && activity.attendees_count > 0 && (
            <div className="flex items-center gap-2">
              <LucideIcon name="Users" size={14} className="text-slate-400" />
              <span>{activity.attendees_count} attending</span>
            </div>
          )}
        </div>

        {/* Organization */}
        {activity.organization && (
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <LucideIcon name="Building2" size={12} />
            {activity.organization.name}
          </div>
        )}

        {/* Admin Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={onEdit}
              >
                <LucideIcon name="Edit2" size={14} className="mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${activity.is_featured ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'}`}
                onClick={onFeature}
              >
                <LucideIcon name="Star" size={14} className="mr-1" />
                {activity.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={onArchive}
              >
                <LucideIcon name="Archive" size={14} className="mr-1" />
                Archive
              </Button>
            </div>
            <Button
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50"
              onClick={onAdd}
            >
              <LucideIcon name="Plus" size={14} className="mr-1.5" />
              Add
            </Button>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={activity.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="px-2 py-1 text-xs border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}