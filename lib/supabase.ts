import { createClient } from '@supabase/supabase-js';

// Strip trailing /rest/v1/ if present — we need the project root URL
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { flowType: 'implicit' },
    })
  : null;
