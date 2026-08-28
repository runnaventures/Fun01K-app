// Environment variables with type safety
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  app: {
    name: (import.meta.env.VITE_APP_NAME as string) || 'Fun01K',
    url: (import.meta.env.VITE_APP_URL as string) || 'http://localhost:5173',
  },
  features: {
    qrVerification: (import.meta.env.VITE_ENABLE_QR_VERIFICATION as string) === 'true',
    gpsVerification: (import.meta.env.VITE_ENABLE_GPS_VERIFICATION as string) === 'true',
    socialFeed: (import.meta.env.VITE_ENABLE_SOCIAL_FEED as string) === 'true',
    challenges: (import.meta.env.VITE_ENABLE_CHALLENGES as string) === 'true',
    leaderboards: (import.meta.env.VITE_ENABLE_LEADERBOARDS as string) === 'true',
  },
  rateLimits: {
    requests: parseInt((import.meta.env.VITE_RATE_LIMIT_REQUESTS as string) || '100'),
    window: parseInt((import.meta.env.VITE_RATE_LIMIT_WINDOW as string) || '60'),
  },
} as const;

// Validate required environment variables
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
for (const key of required) {
  if (!import.meta.env[key]) {
    console.warn(`Missing required environment variable: ${key}`);
  }
}