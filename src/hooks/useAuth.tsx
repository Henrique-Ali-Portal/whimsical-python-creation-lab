
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile fetched:', data);
      
      // Type cast the role to ensure it matches our UserProfile interface
      const profileData: UserProfile = {
        ...data,
        role: data.role as 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON'
      };
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting to sign in with username:', username);
      
      // First, find the user by username to get their email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error('Profile not found for username:', username, profileError);
        throw new Error('Invalid username or password');
      }

      console.log('Found email for username:', profileData.email);

      // Use the email to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data.user?.id);
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, metadata: { username: string; full_name: string }) => {
    console.log('Signing up user:', metadata.username);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: undefined, // Disable email confirmation
      },
    });
    
    if (error) {
      console.error('Sign up error:', error);
    } else {
      console.log('Sign up successful:', data.user?.id);
    }
    
    return { data, error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    
    try {
      // First clear local state immediately
      setUser(null);
      setProfile(null);
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // If there's an AuthSessionMissingError, we can ignore it since the user is already signed out
      if (error && error.message !== 'Auth session missing!') {
        console.error('Sign out error:', error);
        return { error };
      }
      
      console.log('Sign out successful');
      return { error: null };
    } catch (error: any) {
      // Handle any other errors gracefully
      if (error.message === 'Auth session missing!') {
        console.log('Session already expired, sign out complete');
        return { error: null };
      }
      
      console.error('Sign out error:', error);
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
