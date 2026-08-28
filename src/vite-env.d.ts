/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_ENABLE_QR_VERIFICATION: string;
  readonly VITE_ENABLE_GPS_VERIFICATION: string;
  readonly VITE_ENABLE_SOCIAL_FEED: string;
  readonly VITE_ENABLE_CHALLENGES: string;
  readonly VITE_ENABLE_LEADERBOARDS: string;
  readonly VITE_RATE_LIMIT_REQUESTS: string;
  readonly VITE_RATE_LIMIT_WINDOW: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}