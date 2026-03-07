import { createClient } from '@supabase/supabase-js'

// Try to grab from Vite env vars, fallback to hardcoded if not set yet
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration in .env.production");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
