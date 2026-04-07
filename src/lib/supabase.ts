import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtcytswpopatmhzcbxnn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y3l0c3dwb3BhdG1oemNieG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTc4MDgsImV4cCI6MjA5MDk3MzgwOH0.QOiKuxLdvgFlYZWPdxNYB-KO633gp3bGnIZcJpPaFm4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});

export type Profile = {
  id: string;
  username: string | null;
  interests: string[] | null;
  gemini_api_key: string | null;
  created_at: string;
};
