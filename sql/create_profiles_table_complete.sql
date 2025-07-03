-- Complete Profiles Table Setup for Adashi App
-- Run this FIRST if you get "relation 'profiles' does not exist" error

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Profile statistics (for ROSCA/Tontine tracking)
  total_contributions BIGINT DEFAULT 0,
  active_groups INTEGER DEFAULT 0,
  completed_cycles INTEGER DEFAULT 0,
  
  -- Preferences
  notification_settings JSONB DEFAULT '{
    "contributions": true,
    "groups": true,
    "payments": true,
    "general": true
  }',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users cannot delete their profile (optional - remove if you want to allow deletion)
CREATE POLICY "Users cannot delete profiles" ON profiles
  FOR DELETE USING (false);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE profiles TO anon, authenticated;