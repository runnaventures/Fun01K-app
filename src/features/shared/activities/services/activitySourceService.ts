// src/features/activities/services/activitySourceService.ts

import { ExternalActivity } from '../types/activity-source.types';

// Mock data for demonstration
const MOCK_MEETUP_EVENTS: ExternalActivity[] = [
  {
    id: 'meetup-1',
    title: 'Atlanta AI Developers & Founders Guild',
    description: 'Hands-on live coding with Gemini 2.0, AI agents, and function calling. Network over craft beers and talk shop with fellow Atlanta tech engineers.',
    source: 'meetup',
    external_url: 'https://www.meetup.com/',
    date: '2024-08-13',
    time: '8:30 PM',
    location: {
      name: 'Tech Square Auditorium',
      address: '75 5th St, Atlanta, GA',
      city: 'Atlanta',
    },
    attendees: 78,
    category: 'Learning',
    tags: ['AI', 'Machine Learning', 'Tech'],
    points_reward: 58,
  },
  {
    id: 'meetup-2',
    title: 'Atlanta BeltLine Trail Runners & Coffee Club',
    description: 'Join fellow runners for a 5K along the BeltLine followed by coffee and conversation.',
    source: 'meetup',
    external_url: 'https://www.meetup.com/',
    date: '2024-08-14',
    time: '7:00 AM',
    location: {
      name: 'BeltLine Eastside Trail',
      address: '10th St NE, Atlanta, GA',
      city: 'Atlanta',
    },
    attendees: 45,
    category: 'Sports',
    tags: ['Running', 'Fitness', 'Social'],
    points_reward: 45,
  },
];

const MOCK_GOOGLE_PLACES: ExternalActivity[] = [
  {
    id: 'place-1',
    title: 'Piedmont Park & Clara Meer Lake',
    description: 'Historic urban park & greenway with walking trails, a lake, and sports facilities.',
    source: 'google_places',
    external_url: 'https://maps.google.com/',
    location: {
      name: 'Piedmont Park',
      address: '1320 Monroe Dr NE, Atlanta, GA 30306',
      city: 'Atlanta',
      lat: 33.7866,
      lng: -84.3733,
    },
    category: 'Wellness',
    tags: ['Park', 'Lake', 'Walking'],
    points_reward: 40,
  },
  {
    id: 'place-2',
    title: 'Ponce City Market Rooftop & Food Hall',
    description: 'Historic landmark with a food hall, rooftop amusement park, and shopping.',
    source: 'google_places',
    external_url: 'https://maps.google.com/',
    location: {
      name: 'Ponce City Market',
      address: '675 Ponce De Leon Ave NE, Atlanta, GA 30308',
      city: 'Atlanta',
      lat: 33.7727,
      lng: -84.3658,
    },
    category: 'Social',
    tags: ['Food', 'Shopping', 'Rooftop'],
    points_reward: 35,
  },
];

export const activitySourceService = {
  searchMeetup: async (params: any): Promise<ExternalActivity[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let results = [...MOCK_MEETUP_EVENTS];
    
    // Filter by city
    if (params.city && params.city !== 'All Cities') {
      results = results.filter(e => e.location?.city === params.city);
    }
    
    // Filter by category
    if (params.category && params.category !== 'all') {
      results = results.filter(e => e.category?.toLowerCase() === params.category.toLowerCase());
    }
    
    // Filter by search
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return results;
  },

  searchGooglePlaces: async (params: any): Promise<ExternalActivity[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let results = [...MOCK_GOOGLE_PLACES];
    
    // Filter by city
    if (params.city && params.city !== 'All Cities') {
      results = results.filter(e => e.location?.city === params.city);
    }
    
    // Filter by venue type
    if (params.category && params.category !== 'all') {
      results = results.filter(e => e.category?.toLowerCase() === params.category.toLowerCase());
    }
    
    // Filter by search
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return results;
  },

  searchAllSources: async (query: string, source: string, location: string): Promise<ExternalActivity[]> => {
    let results: ExternalActivity[] = [];
    
    if (source === 'meetup' || source === 'all') {
      const meetupResults = await activitySourceService.searchMeetup({
        query,
        city: location,
        category: 'all',
      });
      results = [...results, ...meetupResults];
    }
    
    if (source === 'google_places' || source === 'all') {
      const placesResults = await activitySourceService.searchGooglePlaces({
        query,
        city: location,
        category: 'all',
      });
      results = [...results, ...placesResults];
    }
    
    // Remove duplicates by id
    const seen = new Set();
    return results.filter(item => {
      const key = `${item.source}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};