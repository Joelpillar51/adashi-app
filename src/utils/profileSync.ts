import { supabase } from '../config/supabase';
import { AuthError } from '@supabase/supabase-js';

export interface ProfileSyncResult {
  success: boolean;
  profile?: any;
  error?: string;
  action?: 'found' | 'created' | 'updated';
}

/**
 * Comprehensive profile synchronization utility
 * This function ensures a user has a valid profile in the database
 */
export async function syncUserProfile(userId: string, userEmail: string, metadata?: any): Promise<ProfileSyncResult> {
  try {
    console.log('Starting profile sync for user:', userId, userEmail);

    // Step 1: Try to fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Profile found:', existingProfile);
      return {
        success: true,
        profile: existingProfile,
        action: 'found'
      };
    }

    // Step 2: If profile doesn't exist, create it
    if (fetchError?.code === 'PGRST116') { // No rows returned
      console.log('Profile not found, creating new profile...');
      
      const { full_name, phone } = metadata || {};
      
      const { error: createError } = await supabase.rpc('upsert_profile', {
        user_id: userId,
        user_email: userEmail,
        user_full_name: full_name || null,
        user_phone: phone || null,
      });

      if (createError) {
        console.error('Failed to create profile:', createError);
        return {
          success: false,
          error: `Failed to create profile: ${createError.message}`
        };
      }

      // Step 3: Fetch the newly created profile
      const { data: newProfile, error: refetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (refetchError) {
        console.error('Failed to fetch newly created profile:', refetchError);
        return {
          success: false,
          error: `Profile created but could not be retrieved: ${refetchError.message}`
        };
      }

      console.log('Profile created successfully:', newProfile);
      return {
        success: true,
        profile: newProfile,
        action: 'created'
      };
    }

    // Step 4: Other errors
    console.error('Unexpected error fetching profile:', fetchError);
    return {
      success: false,
      error: `Failed to fetch profile: ${fetchError?.message || 'Unknown error'}`
    };

  } catch (error) {
    console.error('Profile sync error:', error);
    return {
      success: false,
      error: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if the required database functions exist
 */
export async function checkDatabaseSetup(): Promise<{ success: boolean; missing: string[] }> {
  const missing: string[] = [];

  try {
    // Check if upsert_profile function exists
    const { error: upsertError } = await supabase.rpc('upsert_profile', {
      user_id: '00000000-0000-0000-0000-000000000000',
      user_email: 'test@example.com',
      user_full_name: 'Test',
      user_phone: null,
    });

    // If it's not a permissions error, the function doesn't exist
    if (upsertError && !upsertError.message.includes('permission') && !upsertError.message.includes('policy')) {
      missing.push('upsert_profile function');
    }

    // Check if profiles table exists
    const { error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      missing.push('profiles table');
    }

    return {
      success: missing.length === 0,
      missing
    };

  } catch (error) {
    console.error('Database setup check error:', error);
    return {
      success: false,
      missing: ['database connection']
    };
  }
}

/**
 * Manual profile refresh utility for debugging
 */
export async function manualProfileRefresh(userId: string): Promise<ProfileSyncResult> {
  try {
    console.log('Manual profile refresh for user:', userId);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Manual refresh error:', error);
      return {
        success: false,
        error: `Refresh failed: ${error.message}`
      };
    }

    console.log('Manual refresh successful:', profile);
    return {
      success: true,
      profile,
      action: 'found'
    };

  } catch (error) {
    console.error('Manual refresh error:', error);
    return {
      success: false,
      error: `Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}