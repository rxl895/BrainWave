import { supabase } from '../lib/supabase';
import type { AuthError, User, PostgrestError } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  error: AuthError | PostgrestError | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  full_name: string;
}

export const authService = {
  // Login with email and password
  async login({ email, password }: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user ?? null,
      error: error,
    };
  },

  // Register new user
  async register({ email, password, full_name }: RegisterData): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (!error && data?.user) {
      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            full_name,
            preferences: {},
          },
        ]);

      if (profileError) {
        return {
          user: null,
          error: profileError,
        };
      }
    }

    return {
      user: data?.user ?? null,
      error,
    };
  },

  // Login with Google
  async loginWithGoogle(): Promise<void> {
    const { origin } = window.location;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  },

  // Login with Facebook
  async loginWithFacebook(): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Logout
  async logout(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  },

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  // Update user profile
  async updateProfile(profile: Partial<{
    full_name: string;
    avatar_url: string;
  }>): Promise<{ error: AuthError | PostgrestError | null }> {
    const { error } = await supabase.auth.updateUser({
      data: profile,
    });

    if (!error) {
      const user = await this.getCurrentUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('users')
          .update(profile)
          .eq('id', user.id);
        return { error: profileError };
      }
    }

    return { error };
  },
}; 