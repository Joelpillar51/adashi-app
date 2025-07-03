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

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  member_count INTEGER NOT NULL CHECK (member_count >= 3 AND member_count <= 20),
  monthly_amount BIGINT NOT NULL CHECK (monthly_amount >= 100000), -- Minimum ₦1,000 in kobo
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create group_members table
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  rotation_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, rotation_position)
);

-- Set up Row Level Security policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON groups
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
```

### 5. Configure Google OAuth (Optional)

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

### 6. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates:
   - **Confirm signup**: Welcome to Adashi
   - **Reset password**: Reset your Adashi password
   - **Magic link**: Sign in to Adashi

### 7. Test Your Setup

1. Restart your Expo development server
2. Try to:
   - Sign up with email/password
   - Sign in with email/password
   - Reset password
   - Sign in with Google (if configured)

## 🔧 Advanced Configuration

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

### Production Configuration

For production apps:

1. Set up custom domain for Supabase
2. Configure proper CORS settings
3. Set up database backups
4. Enable additional security features

## 🚨 Security Best Practices

1. **Never commit** your Supabase keys to Git
2. Use **Row Level Security** for all tables
3. Validate data on both client and server
4. Use proper **email verification**
5. Implement **rate limiting** for auth endpoints

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review the [Supabase docs](https://supabase.com/docs)
3. Check our GitHub issues

---

Your Adashi app is now ready with full Supabase authentication! 🎉