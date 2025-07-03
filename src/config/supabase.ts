import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tlyosusifhbkqsecmogl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseW9zdXNpZmhia3FzZWNtb2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDI2NjMsImV4cCI6MjA2NzA3ODY2M30.LKoFrSVJeAhDGopti_DqBddm8Ap_Qe50Ukp5-mHPjEo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with React Native storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          member_count: number;
          monthly_amount: number;
          status: 'active' | 'paused' | 'completed';
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description: string;
          member_count: number;
          monthly_amount: number;
          owner_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          member_count?: number;
          monthly_amount?: number;
          status?: 'active' | 'paused' | 'completed';
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];