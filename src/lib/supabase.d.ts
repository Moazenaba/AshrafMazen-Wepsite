import type { SupabaseClient } from '@supabase/supabase-js';

// Rows through PostgREST; auth through the full client, loaded on first use (see supabase.js)
export declare const supabase: Pick<SupabaseClient, 'from' | 'rpc' | 'auth'>;
export declare const supabaseUrl: string;
export declare const supabaseAnonKey: string;
export declare const isConfigured: boolean;
export declare function hasStoredSession(): boolean;
export declare function loadAuthClient(): Promise<SupabaseClient>;
