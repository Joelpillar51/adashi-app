# Supabase Setup Guide for Adashi

This guide will help you set up Supabase authentication and database for your Adashi app.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/sign in
3. Click "New Project"
4. Choose your organization and enter:
   - **Name**: `adashi-app`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to Nigeria (eu-west-1 or us-east-1)
5. Click "Create new project"

### 2. Get Your Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (something like `https://xyz.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Update Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database Tables

**🚨 CRITICAL STEP**: You must run the SQL files for the app to work properly.

**Quick Setup**: Follow the [SQL Setup Guide](./sql/README.md) which provides step-by-step instructions.

**SQL Files to Run** (in this order):
1. 📁 `sql/create_profiles_table_complete.sql` - Creates the database tables
2. 📁 `sql/profile_functions.sql` - Creates the required functions  
3. 📁 `sql/test_profile_setup.sql` - Verifies everything works

**How to Run**:
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy contents from each file in the `sql/` folder
3. Paste and click **"Run"** for each file

This creates a comprehensive profiles table with:
- ✅ User profile management
- ✅ ROSCA/Tontine statistics tracking
- ✅ Notification preferences
- ✅ Row Level Security
- ✅ Automatic profile creation via `upsert_profile` function

**Key Features:**
- `total_contributions`: Track total Naira contributions
- `active_groups`: Number of active ROSCA groups
- `completed_cycles`: Number of completed savings cycles
- `notification_settings`: JSON-based preference management

### 5. Configure Email Verification

1. Go to **Authentication** → **Settings**
2. Enable **Email confirmations**
3. Set **Confirm email** to `ON`
4. Users will receive OTP codes via email for account verification

### 6. Configure Google OAuth (Optional)

1. Go to **Authentication** → **Providers** in Supabase
2. Click on **Google**
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### 7. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates:
   - **Confirm signup**: Welcome to Adashi! Use this code to verify your account: {{ .Token }}
   - **Reset password**: Reset your Adashi password
   - **Magic link**: Sign in to Adashi

### 8. Test Your Setup

1. Restart your Expo development server
2. Try to:
   - Sign up with email/password
   - Verify email with OTP code
   - Sign in with email/password
   - Reset password
   - Sign in with Google (if configured)

## 🔧 Advanced Configuration

### Profile Statistics Management

The app includes a helper function to update user statistics:

```sql
-- Update user statistics (contributions in kobo, groups count, cycles count)
SELECT update_profile_stats(
  'user-uuid-here',
  50000, -- Add ₦500 (50000 kobo)
  1,     -- Add 1 active group  
  0      -- No completed cycles change
);
```

### URL Scheme Setup

For deep linking (password reset, OAuth), add this to your `app.json`:

```json
{
  "expo": {
    "scheme": "com.adashi.app",
    "name": "Adashi"
  }
}
```

### Database Schema Overview

**profiles table:**
- User authentication and profile data
- ROSCA participation statistics
- Notification preferences
- Automatic creation via `upsert_profile` function

**Future tables** (to be implemented):
- `groups`: ROSCA group management
- `group_members`: Member participation tracking
- `contributions`: Payment and contribution records
- `rotations`: Turn-based payout management

## 🚨 Security Best Practices

1. **Never commit** your Supabase keys to Git
2. Use **Row Level Security** for all tables (already configured)
3. Validate data on both client and server
4. Use proper **email verification** (OTP-based)
5. Implement **rate limiting** for auth endpoints
6. Profile updates require user authentication

## 🔍 Troubleshooting

### Common Issues:

1. **"must be owner of user table" error**
   - ✅ Fixed: Use `create_profiles_table_fixed.sql` instead
   - This version uses `upsert_profile` function instead of triggers

2. **Profile not created after signup**
   - Check Supabase logs for errors
   - Ensure `upsert_profile` function was created successfully
   - Verify email confirmation is working

3. **Authentication not persisting**
   - Check AsyncStorage permissions
   - Verify Supabase client configuration
   - Ensure proper session management

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review the [Supabase docs](https://supabase.com/docs)
3. Check our GitHub issues
4. Verify all SQL functions were created successfully

## 📁 SQL Files Reference

- `sql/create_profiles_table_fixed.sql` - **Use this one** (works without permission errors)
- `sql/create_profiles_table.sql` - Original version (may cause permission errors)

---

Your Adashi app is now ready with full Supabase authentication and profile management! 🎉