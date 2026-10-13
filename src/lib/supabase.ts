import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  'https://svvgziqcdahkgyugqlvk.supabase.co';

export const SUPABASE_ANON_KEY = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmd6aXFjZGFoa2d5dWdxbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTk5MzAsImV4cCI6MjEwNzM3NTkzMH0.p8YQDI_Px3wsaWDJAVxqI7x9luw51NTfYS3wX3x4fY4';

export const SUPABASE_SERVICE_ROLE_KEY = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmd6aXFjZGFoa2d5dWdxbHZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTc5OTkzMCwiZXhwIjoyMTA3Mzc1OTMwfQ.lp1wXGSMHuWidi91_92ECvhj84hqQBcO4lbT56LqouE';

// Standard client for frontend / anon operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Admin client with service_role for backend operations (bypasses RLS safely on server)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
