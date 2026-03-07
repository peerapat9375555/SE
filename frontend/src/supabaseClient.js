import { createClient } from '@supabase/supabase-js'

// Try to grab from Vite env vars, fallback to hardcoded if not set yet
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsocwhsekrnpwuejankb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzb2N3aHNla3JucHd1ZWphbmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Njk1MDUsImV4cCI6MjA4NzM0NTUwNX0.CPvVpSyXhxSHPhH2Hm_ZHsXdeoxb23pybVhYxhoUwE8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration in .env.production");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
