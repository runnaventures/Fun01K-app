// src/lib/base-service.ts

import { supabase } from './supabase';

/**
 * Base service with type-safe query builders
 * All methods return properly typed data
 */
export class BaseService {
  protected supabase = supabase;

  protected async query<T = any>(
    builder: any
  ): Promise<{ data: T | null; error: any }> {
    const result = await builder;
    return {
      data: result.data as T | null,
      error: result.error,
    };
  }

  protected async queryList<T = any>(
    builder: any
  ): Promise<{ data: T[]; error: any }> {
    const result = await builder;
    return {
      data: result.data as T[] || [],
      error: result.error,
    };
  }

  protected async querySingle<T = any>(
    builder: any
  ): Promise<{ data: T | null; error: any }> {
    const result = await builder;
    return {
      data: result.data as T | null,
      error: result.error,
    };
  }
}