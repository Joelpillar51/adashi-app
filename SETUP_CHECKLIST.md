# Adashi Setup Checklist

## ✅ Quick Setup Checklist

### 1. Clone and Install
- [ ] Clone repository
- [ ] Run `bun install` or `npm install`
- [ ] Copy `.env.example` to `.env`

### 2. Supabase Setup
- [ ] Create Supabase project
- [ ] Get project URL and anon key
- [ ] Add credentials to `.env` file:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
  ```

### 3. Database Setup (CRITICAL)
Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

- [ ] **Step 1**: Run `sql/create_profiles_table_complete.sql`
- [ ] **Step 2**: Run `sql/profile_functions.sql`
- [ ] **Step 3**: Run `sql/test_profile_setup.sql` (to verify)

### 4. Test Your Setup
- [ ] Start the app: `bun start` or `expo start`
- [ ] Create a new account
- [ ] Verify profile appears in Supabase profiles table
- [ ] Check app shows real user name (not mock data)

### 5. Debug if Needed
If things don't work:
- [ ] Use the ProfileDebugScreen in the app (tap "Full Debug" on Overview)
- [ ] Check Supabase logs
- [ ] Verify all SQL functions were created

## 🚨 Common Issues

### "function upsert_profile does not exist"
**Fix**: Run `sql/profile_functions.sql` in Supabase SQL Editor

### "relation 'profiles' does not exist"  
**Fix**: Run `sql/create_profiles_table_complete.sql` first

### App shows mock data instead of real user
**Fix**: Complete database setup, then use ProfileDebugScreen to sync

### Profile not created after signup
**Fix**: Use "Sync Profile" button in ProfileDebugScreen

## 📁 Key Files

| What you need | File location |
|---------------|---------------|
| Environment setup | `.env.example` → `.env` |
| Database setup | `sql/README.md` |
| SQL files | `sql/` folder |
| Detailed guide | `SUPABASE_SETUP.md` |
| Debug tools | ProfileDebugScreen in app |

## 🎯 Success Indicators

You'll know setup is complete when:
- ✅ App displays real user name in header
- ✅ Profile data appears in Supabase profiles table  
- ✅ No "function does not exist" errors
- ✅ ProfileDebugScreen shows all green checkmarks

## 📞 Need Help?

1. Check the `sql/README.md` for detailed database setup
2. Use ProfileDebugScreen in the app for troubleshooting
3. Check Supabase dashboard logs for errors
4. Verify you followed the setup order correctly