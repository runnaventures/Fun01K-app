// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

// ⚠️ TEMPORARY: cast to `any` so the entire client is loose-typed.
// This makes every `supabase.from('...')` return `any`-typed builders,
// eliminating the "type 'never'" errors caused by our placeholder Database type.
//
// Remove the `as any` cast once real types are generated with:
//   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
) as any;

export type { Database };