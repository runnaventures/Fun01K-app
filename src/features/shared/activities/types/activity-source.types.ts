// src/features/activities/types/activity-source.types.ts

export type ActivitySource = 'manual' | 'meetup' | 'google_places' | 'employee_suggestion';

export interface ExternalActivity {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  source: ActivitySource;
  source_id?: string;
  external_url?: string;
  date?: string;
  time?: string;
  location?: {
    name: string;
    address?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  attendees?: number;
  category?: string;
  tags?: string[];
  points_reward?: number;
}

export interface MeetupSearchParams {
  query: string;
  city: string;
  radius?: number;
  limit?: number;
}

export interface GooglePlacesSearchParams {
  query: string;
  location: string;
  radius?: number;
  type?: string;
  limit?: number;
}