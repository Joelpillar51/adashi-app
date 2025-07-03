# Database Setup Guide for Adashi

This folder contains all the SQL files needed to set up your Adashi database in Supabase. **Run these files in the exact order specified below.**

## 📋 Setup Order (IMPORTANT!)

### Step 1: Create Tables
Run these files first to create the database structure:

1. **`create_profiles_table_complete.sql`** - Creates the profiles table and basic setup
2. **`create_profiles_table_fixed.sql`** - Alternative profiles table (use if Step 1 fails)

### Step 2: Create Functions
Run these files to add database functions:

3. **`profile_functions.sql`** - Essential profile management functions
4. **`group_management_functions.sql`** - Group and ROSCA management functions  
5. **`notification_functions.sql`** - Notification system functions

### Step 3: Test and Verify
Use these files to test your setup:

6. **`test_profile_setup.sql`** - Verify everything is working
7. **`function_usage_examples.sql`** - Examples of how to use the functions

## 🚀 Quick Start

### For New Database Setup:
```sql
-- 1. First, run create_profiles_table_complete.sql
-- 2. Then run profile_functions.sql  
-- 3. Test with test_profile_setup.sql
```

### For Existing Database (if you get function errors):
```sql
-- 1. Run profile_functions.sql
-- 2. Test with test_profile_setup.sql
```

## 🔧 Common Issues and Solutions

### Error: "function upsert_profile does not exist"
**Solution:** Run `profile_functions.sql` first

### Error: "relation 'profiles' does not exist"  
**Solution:** Run `create_profiles_table_complete.sql` first

### Error: "permission denied"
**Solution:** Make sure you're running in Supabase SQL Editor with proper admin access

## 📁 File Descriptions

| File | Purpose | When to Use |
|------|---------|-------------|
| `create_profiles_table_complete.sql` | Creates profiles table with all columns | First time setup |
| `create_profiles_table_fixed.sql` | Alternative table creation (no triggers) | If main setup fails |
| `profile_functions.sql` | Core profile management functions | Essential - always run |
| `group_management_functions.sql` | ROSCA group management | When ready for groups |
| `notification_functions.sql` | Notification system | When ready for notifications |
| `test_profile_setup.sql` | Verification and testing | To check setup |
| `function_usage_examples.sql` | Usage examples and demos | For reference |

## 🎯 After Setup

Once you've run the SQL files:

1. **Test the functions** using the examples in `function_usage_examples.sql`
2. **Create a user profile** for your test account
3. **Verify the app** now shows real data instead of mock data

## 📞 Need Help?

If you encounter issues:

1. Check the **Supabase Logs** in your dashboard
2. Use the **ProfileDebugScreen** in the app (development mode)
3. Run the **test queries** to identify specific problems

## 🔄 Update Process

When new SQL files are added:

1. **Pull latest changes** from GitHub
2. **Check this README** for new files
3. **Run new files** in the order specified
4. **Test your setup** with the verification queries