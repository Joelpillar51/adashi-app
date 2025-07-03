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
          total_contributions: number;
          active_groups: number;
          completed_cycles: number;
          notification_settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          total_contributions?: number;
          active_groups?: number;
          completed_cycles?: number;
          notification_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          total_contributions?: number;
          active_groups?: number;
          completed_cycles?: number;
          notification_settings?: any;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          member_count: number;
          monthly_amount: number;
          contribution_day: number | null;
          start_date: string | null;
          status: 'active' | 'paused' | 'completed';
          current_cycle: number;
          current_recipient: string | null;
          bank_name: string | null;
          account_number: string | null;
          account_name: string | null;
          invite_code: string | null;
          requires_approval: boolean;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          member_count: number;
          monthly_amount: number;
          contribution_day?: number | null;
          start_date?: string | null;
          status?: 'active' | 'paused' | 'completed';
          current_cycle?: number;
          current_recipient?: string | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          invite_code?: string | null;
          requires_approval?: boolean;
          owner_id: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          member_count?: number;
          monthly_amount?: number;
          contribution_day?: number | null;
          start_date?: string | null;
          status?: 'active' | 'paused' | 'completed';
          current_cycle?: number;
          current_recipient?: string | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          invite_code?: string | null;
          requires_approval?: boolean;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          rotation_position: number | null;
          has_received_payout: boolean;
          payout_date: string | null;
          status: 'active' | 'pending' | 'suspended' | 'left';
          approval_status: 'pending' | 'approved' | 'rejected';
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          rotation_position?: number | null;
          has_received_payout?: boolean;
          payout_date?: string | null;
          status?: 'active' | 'pending' | 'suspended' | 'left';
          approval_status?: 'pending' | 'approved' | 'rejected';
        };
        Update: {
          role?: 'owner' | 'admin' | 'member';
          rotation_position?: number | null;
          has_received_payout?: boolean;
          payout_date?: string | null;
          status?: 'active' | 'pending' | 'suspended' | 'left';
          approval_status?: 'pending' | 'approved' | 'rejected';
          updated_at?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          group_id: string;
          contributor_id: string;
          amount: number;
          cycle_number: number;
          contribution_date: string;
          due_date: string;
          status: 'pending' | 'paid' | 'late' | 'missed';
          payment_method: 'bank_transfer' | 'cash' | 'mobile_money' | null;
          transaction_reference: string | null;
          bank_details: any | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          group_id: string;
          recipient_id: string;
          amount: number;
          cycle_number: number;
          payout_date: string;
          status: 'pending' | 'processed' | 'completed';
          recipient_bank_name: string | null;
          recipient_account_number: string | null;
          recipient_account_name: string | null;
          transaction_reference: string | null;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'contribution_due' | 'payment_received' | 'payout_available' | 'group_update' | 'system';
          group_id: string | null;
          contribution_id: string | null;
          payout_id: string | null;
          read: boolean;
          action_required: boolean;
          action_url: string | null;
          created_at: string;
          expires_at: string | null;
        };
      };
    };
    Functions: {
      // Profile management functions
      upsert_profile: {
        Args: {
          user_id: string;
          user_email: string;
          user_full_name?: string;
          user_phone?: string;
          user_avatar_url?: string;
        };
        Returns: void;
      };
      update_profile_stats: {
        Args: {
          user_id: string;
          contributions_delta?: number;
          groups_delta?: number;
          cycles_delta?: number;
        };
        Returns: void;
      };
      get_user_profile_with_stats: {
        Args: { user_id: string };
        Returns: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          total_contributions: number;
          active_groups: number;
          completed_cycles: number;
          notification_settings: any;
          created_at: string;
          updated_at: string;
          current_month_contributions: number;
          total_groups_joined: number;
          success_rate: number;
        }[];
      };
      get_user_groups: {
        Args: { user_id: string };
        Returns: {
          group_id: string;
          group_name: string;
          group_description: string | null;
          monthly_amount: number;
          member_count: number;
          status: string;
          role: string;
          rotation_position: number | null;
          has_received_payout: boolean;
          next_contribution_due: string | null;
          total_contributed: number;
        }[];
      };
      // Group management functions
      create_group_with_owner: {
        Args: {
          group_name: string;
          group_description: string;
          member_count: number;
          monthly_amount: number;
          contribution_day: number;
          start_date: string;
          owner_id: string;
          bank_name?: string;
          account_number?: string;
          account_name?: string;
        };
        Returns: string;
      };
      add_member_to_group: {
        Args: {
          group_id: string;
          user_id: string;
          assigned_position?: number;
        };
        Returns: boolean;
      };
      can_user_join_group: {
        Args: {
          user_id: string;
          group_id: string;
        };
        Returns: boolean;
      };
      get_group_financial_summary: {
        Args: { group_id: string };
        Returns: {
          total_expected: number;
          total_collected: number;
          total_pending: number;
          total_overdue: number;
          collection_rate: number;
          members_paid: number;
          members_pending: number;
          next_payout_amount: number;
          next_recipient_name: string;
        }[];
      };
      // Notification functions
      create_notification: {
        Args: {
          user_id: string;
          title: string;
          message: string;
          notification_type: string;
          group_id?: string;
          contribution_id?: string;
          payout_id?: string;
          action_required?: boolean;
          action_url?: string;
          expires_at?: string;
        };
        Returns: string;
      };
      get_user_notifications: {
        Args: {
          user_id: string;
          notification_type?: string;
          unread_only?: boolean;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          id: string;
          title: string;
          message: string;
          type: string;
          group_id: string | null;
          group_name: string | null;
          contribution_id: string | null;
          payout_id: string | null;
          read: boolean;
          action_required: boolean;
          action_url: string | null;
          created_at: string;
          expires_at: string | null;
        }[];
      };
      get_notification_counts: {
        Args: { user_id: string };
        Returns: {
          total_unread: number;
          contribution_due: number;
          payment_received: number;
          payout_available: number;
          group_update: number;
          system_notifications: number;
        }[];
      };
      mark_notifications_read: {
        Args: {
          user_id: string;
          notification_ids?: string[];
        };
        Returns: number;
      };
    };
  };
}

// Export typed table and function types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type Contribution = Database['public']['Tables']['contributions']['Row'];
export type Payout = Database['public']['Tables']['payouts']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Helper types for function returns
export type UserProfileWithStats = Database['public']['Functions']['get_user_profile_with_stats']['Returns'][0];
export type UserGroup = Database['public']['Functions']['get_user_groups']['Returns'][0];
export type GroupFinancialSummary = Database['public']['Functions']['get_group_financial_summary']['Returns'][0];
export type UserNotification = Database['public']['Functions']['get_user_notifications']['Returns'][0];
export type NotificationCounts = Database['public']['Functions']['get_notification_counts']['Returns'][0];