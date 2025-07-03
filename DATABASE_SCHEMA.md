# Database Schema Documentation

This document outlines the complete database schema for the Adashi ROSCA/Tontine app.

## 📊 Current Implementation

### profiles Table

Complete user profile management with ROSCA statistics tracking.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- ROSCA Statistics
  total_contributions BIGINT DEFAULT 0,     -- Total contributions in kobo (₦1 = 100 kobo)
  active_groups INTEGER DEFAULT 0,         -- Number of active ROSCA groups
  completed_cycles INTEGER DEFAULT 0,      -- Number of completed cycles
  
  -- User Preferences
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
```

**Key Features:**
- ✅ Automatic profile creation via `upsert_profile()` function
- ✅ Row Level Security (users can only access their own data)
- ✅ ROSCA-specific statistics tracking
- ✅ JSON-based notification preferences
- ✅ Automatic timestamp management

**Indexes:**
- `profiles_email_idx` - Fast email lookups
- `profiles_phone_idx` - Phone number queries
- `profiles_created_at_idx` - Date-based queries

**Functions:**
- `upsert_profile()` - Safe profile creation/updates
- `update_profile_stats()` - Increment/decrement statistics
- `update_updated_at_column()` - Auto-update timestamps

## 🚀 Planned Implementation (Future Phases)

### groups Table

ROSCA group management and settings.

```sql
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Group Configuration
  member_count INTEGER NOT NULL CHECK (member_count >= 3 AND member_count <= 20),
  monthly_amount BIGINT NOT NULL CHECK (monthly_amount >= 100000), -- Min ₦1,000
  contribution_day INTEGER CHECK (contribution_day >= 1 AND contribution_day <= 31),
  start_date DATE,
  
  -- Group Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  current_cycle INTEGER DEFAULT 0,
  current_recipient UUID REFERENCES auth.users(id),
  
  -- Bank Details (for collections)
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  
  -- Access Control
  invite_code TEXT UNIQUE,
  requires_approval BOOLEAN DEFAULT true,
  
  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### group_members Table

Track user participation in ROSCA groups.

```sql
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Member Role
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  
  -- Rotation Management
  rotation_position INTEGER,
  has_received_payout BOOLEAN DEFAULT false,
  payout_date DATE,
  
  -- Member Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'left')),
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  
  -- Metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, rotation_position)
);
```

### contributions Table

Track all financial contributions and payments.

```sql
CREATE TABLE contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  contributor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  amount BIGINT NOT NULL, -- Amount in kobo
  cycle_number INTEGER NOT NULL,
  contribution_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Payment Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'missed')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'mobile_money')),
  
  -- Transaction Details
  transaction_reference TEXT,
  bank_details JSONB, -- Bank transaction info
  
  -- Verification
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### payouts Table

Track ROSCA payout distributions.

```sql
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payout Details
  amount BIGINT NOT NULL, -- Total payout amount in kobo
  cycle_number INTEGER NOT NULL,
  payout_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed')),
  
  -- Bank Details
  recipient_bank_name TEXT,
  recipient_account_number TEXT,
  recipient_account_name TEXT,
  
  -- Transaction
  transaction_reference TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### notifications Table

In-app notification management.

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contribution_due', 'payment_received', 'payout_available', 'group_update', 'system')),
  
  -- Related Records
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
  payout_id UUID REFERENCES payouts(id) ON DELETE CASCADE,
  
  -- Status
  read BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

## 🔐 Security Implementation

### Row Level Security Policies

All tables implement comprehensive RLS policies:

```sql
-- Users can only access their own data
CREATE POLICY "users_own_data" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Users can only see groups they belong to
CREATE POLICY "group_member_access" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Group owners can manage their groups
CREATE POLICY "owner_group_management" ON groups
  FOR UPDATE USING (auth.uid() = owner_id);
```

### Data Validation

- Currency stored in kobo (smallest unit) to avoid decimal issues
- Check constraints for valid ranges (member count, amounts)
- Unique constraints to prevent duplicates
- Foreign key constraints for data integrity

## 📈 Performance Optimizations

### Indexes

```sql
-- User lookups
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_phone_idx ON profiles(phone);

-- Group queries
CREATE INDEX groups_owner_idx ON groups(owner_id);
CREATE INDEX groups_status_idx ON groups(status);
CREATE INDEX groups_invite_code_idx ON groups(invite_code);

-- Member queries
CREATE INDEX group_members_user_idx ON group_members(user_id);
CREATE INDEX group_members_group_idx ON group_members(group_id);
CREATE INDEX group_members_position_idx ON group_members(group_id, rotation_position);

-- Contribution queries
CREATE INDEX contributions_group_cycle_idx ON contributions(group_id, cycle_number);
CREATE INDEX contributions_contributor_idx ON contributions(contributor_id);
CREATE INDEX contributions_status_idx ON contributions(status);
CREATE INDEX contributions_due_date_idx ON contributions(due_date);

-- Notification queries
CREATE INDEX notifications_user_unread_idx ON notifications(user_id, read) WHERE NOT read;
CREATE INDEX notifications_created_idx ON notifications(created_at);
```

## 🔄 Migration Strategy

### Phase 1: Core Authentication ✅
- profiles table with basic user data
- Supabase Auth integration
- OTP email verification

### Phase 2: Group Management (Next)
- groups and group_members tables
- Group creation and invitation system
- Member management

### Phase 3: Financial Tracking
- contributions and payouts tables
- Payment processing integration
- Financial reporting

### Phase 4: Advanced Features
- notifications table
- Real-time updates
- Advanced analytics

## 🛠️ Helper Functions

### Profile Management
```sql
-- Safely create or update profiles
SELECT upsert_profile('user-id', 'email@example.com', 'Full Name', '+234-123-456');

-- Update statistics
SELECT update_profile_stats('user-id', 50000, 1, 0); -- Add ₦500, 1 group, 0 cycles
```

### Future Functions (Planned)
```sql
-- Group management
SELECT create_group_with_owner();
SELECT add_member_to_group();
SELECT process_monthly_contributions();
SELECT distribute_payout();

-- Notification management
SELECT create_notification();
SELECT mark_notifications_read();
SELECT cleanup_expired_notifications();
```

---

This schema provides a solid foundation for a comprehensive ROSCA/Tontine management system with Nigerian financial context and security best practices.