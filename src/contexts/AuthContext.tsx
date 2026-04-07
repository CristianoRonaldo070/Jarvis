import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Supabase
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, username: null, interests: null, gemini_api_key: null })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile);
        } else {
          console.error('Error creating profile:', insertError);
        }
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set up auth state change listener — this handles initial session + changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('[Auth] State change:', event, !!newSession);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock on init
          setTimeout(async () => {
            if (mounted) {
              await fetchProfile(newSession.user.id);
              if (mounted) setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Safety timeout — ensure loading always becomes false
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Safety timeout — forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: 'Not authenticated' };

    try {
      // First try update (for existing profiles)
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);

        // If update fails, try upsert as fallback (profile might not exist)
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...updates }, { onConflict: 'id' });

        if (upsertError) {
          console.error('Profile upsert error:', upsertError);
          return { error: upsertError.message };
        }
      }

      // Refresh profile to get latest data
      await fetchProfile(user.id);
      return { error: null };
    } catch (err: any) {
      console.error('Profile update exception:', err);
      return { error: err.message || 'Failed to update profile' };
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
