// src/features/platform-admin/hooks/useModeration.ts

import { useState, useEffect } from 'react';
import { ModerationState } from '../types/platform.types';

const defaultState: ModerationState = {
  flaggedActivityIds: {},
  featuredActivityIds: [],
  flaggedSocialEventIds: {},
  featuredSocialEventIds: [],
  hiddenSocialEventIds: [],
  deletedSocialEventIds: [],
  flaggedPlaceIds: {},
  featuredPlaceIds: [],
  hiddenPlaceIds: [],
  deletedPlaceIds: [],
};

export function useModeration() {
  const [state, setState] = useState<ModerationState>(() => {
    const saved = localStorage.getItem('moderationState');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('moderationState', JSON.stringify(state));
  }, [state]);

  const flagActivity = (id: string, reason?: string) => {
    setState((prev: ModerationState) => {
      const isFlagged = !!prev.flaggedActivityIds[id];
      if (isFlagged) {
        const { [id]: _, ...rest } = prev.flaggedActivityIds;
        return { ...prev, flaggedActivityIds: rest };
      }
      return {
        ...prev,
        flaggedActivityIds: { ...prev.flaggedActivityIds, [id]: reason || 'Flagged for review' },
      };
    });
  };

  const featureActivity = (id: string) => {
    setState((prev: ModerationState) => {
      const isFeatured = prev.featuredActivityIds.includes(id);
      return {
        ...prev,
        featuredActivityIds: isFeatured
          ? prev.featuredActivityIds.filter((i: string) => i !== id)
          : [...prev.featuredActivityIds, id],
      };
    });
  };

  const hideItem = (type: 'social' | 'place', id: string) => {
    // Implementation
  };

  return {
    state,
    flagActivity,
    featureActivity,
    hideItem,
  };
}