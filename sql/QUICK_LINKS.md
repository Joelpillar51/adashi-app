# Quick Access Links

## 📋 SQL Files for Copy/Paste

### Required Files (Run in Order):

#### 1. Create Profiles Table
**File**: `create_profiles_table_complete.sql`
- Creates the main profiles table
- Sets up Row Level Security
- Creates indexes and triggers

#### 2. Profile Functions  
**File**: `profile_functions.sql`
- Creates `upsert_profile()` function
- Creates `update_profile_stats()` function
- Creates profile management functions

#### 3. Test Setup
**File**: `test_profile_setup.sql`
- Verifies tables and functions exist
- Provides test queries
- Checks permissions

## 🔗 Direct File Access

When you're in GitHub, navigate to:
```
repository → sql → [filename]
```

Then click the file and copy the contents to paste into Supabase SQL Editor.

## ⚡ Quick Test

After running the files, test with this query:
```sql
-- Check if setup worked
SELECT proname FROM pg_proc WHERE proname = 'upsert_profile';
```

Should return: `upsert_profile`

## 🎯 Success Check

Run this to verify your profile system:
```sql
-- Get all available profile functions
SELECT proname as function_name
FROM pg_proc 
WHERE proname LIKE '%profile%'
ORDER BY proname;
```

Expected functions:
- `get_user_profile_with_stats`
- `update_profile_stats` 
- `upsert_profile`

## 📞 Still Having Issues?

1. Make sure you're in **SQL Editor** (not Table Editor)
2. Copy the **entire file contents** (not just parts)
3. Click **"Run"** after pasting each file
4. Check for any red error messages
5. Use the ProfileDebugScreen in the app to test