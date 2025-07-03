-- Test Profile Setup - Run this to verify your profile system is working
-- Execute this in your Supabase Dashboard -> SQL Editor

-- 1. Check if profiles table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check if upsert_profile function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'upsert_profile';

-- 3. Test creating a sample profile (replace with a real user ID)
-- SELECT upsert_profile(
--   'test-user-id'::UUID,
--   'test@example.com',
--   'Test User',
--   '+234 801 234 5678'
-- );

-- 4. Check Row Level Security policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Check if there are any profiles in the table
SELECT 
  id,
  email,
  full_name,
  phone,
  total_contributions,
  active_groups,
  completed_cycles,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;