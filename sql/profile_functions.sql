-- Profile Management and Helper Functions for Adashi App
-- Execute this SQL in your Supabase Dashboard -> SQL Editor

-- Function to safely create or update profiles (already exists, but ensuring consistency)
CREATE OR REPLACE FUNCTION upsert_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone, avatar_url)
  VALUES (user_id, user_email, user_full_name, user_phone, user_avatar_url)
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile statistics
CREATE OR REPLACE FUNCTION update_profile_stats(
  user_id UUID,
  contributions_delta BIGINT DEFAULT 0,
  groups_delta INTEGER DEFAULT 0,
  cycles_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_contributions = GREATEST(0, total_contributions + contributions_delta),
    active_groups = GREATEST(0, active_groups + groups_delta),
    completed_cycles = GREATEST(0, completed_cycles + cycles_delta),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with calculated statistics
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  total_contributions BIGINT,
  active_groups INTEGER,
  completed_cycles INTEGER,
  notification_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  -- Calculated statistics
  current_month_contributions BIGINT,
  total_groups_joined INTEGER,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.total_contributions,
    p.active_groups,
    p.completed_cycles,
    p.notification_settings,
    p.created_at,
    p.updated_at,
    -- Current month contributions
    COALESCE(
      (SELECT SUM(amount) 
       FROM contributions 
       WHERE contributor_id = p.id 
       AND DATE_TRUNC('month', contribution_date) = DATE_TRUNC('month', CURRENT_DATE)
       AND status = 'paid'), 
      0
    ) as current_month_contributions,
    -- Total groups ever joined
    COALESCE(
      (SELECT COUNT(DISTINCT group_id) 
       FROM group_members 
       WHERE user_id = p.id), 
      0
    ) as total_groups_joined,
    -- Success rate (percentage of on-time payments)
    CASE 
      WHEN (SELECT COUNT(*) FROM contributions WHERE contributor_id = p.id) > 0 THEN
        ROUND(
          (SELECT COUNT(*) FROM contributions 
           WHERE contributor_id = p.id AND status = 'paid' AND contribution_date <= due_date) * 100.0 /
          (SELECT COUNT(*) FROM contributions WHERE contributor_id = p.id),
          2
        )
      ELSE 0
    END as success_rate
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification settings
CREATE OR REPLACE FUNCTION update_notification_settings(
  user_id UUID,
  settings JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    notification_settings = settings,
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's group memberships with details
CREATE OR REPLACE FUNCTION get_user_groups(user_id UUID)
RETURNS TABLE(
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  monthly_amount BIGINT,
  member_count INTEGER,
  status TEXT,
  role TEXT,
  rotation_position INTEGER,
  has_received_payout BOOLEAN,
  next_contribution_due DATE,
  total_contributed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as group_id,
    g.name as group_name,
    g.description as group_description,
    g.monthly_amount,
    g.member_count,
    g.status,
    gm.role,
    gm.rotation_position,
    gm.has_received_payout,
    -- Next contribution due date
    CASE 
      WHEN g.contribution_day IS NOT NULL THEN
        CASE 
          WHEN EXTRACT(DAY FROM CURRENT_DATE) <= g.contribution_day THEN
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' + INTERVAL '1 day' * g.contribution_day
          ELSE
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 month' - INTERVAL '1 day' + INTERVAL '1 day' * g.contribution_day
        END
      ELSE NULL
    END as next_contribution_due,
    -- Total contributed to this group
    COALESCE(
      (SELECT SUM(amount) 
       FROM contributions 
       WHERE contributor_id = user_id AND group_id = g.id AND status = 'paid'), 
      0
    ) as total_contributed
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = user_id AND gm.status = 'active'
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can join a group
CREATE OR REPLACE FUNCTION can_user_join_group(
  user_id UUID,
  group_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  group_member_count INTEGER;
  max_members INTEGER;
  is_already_member BOOLEAN;
  group_status TEXT;
BEGIN
  -- Check if group exists and get details
  SELECT member_count, status INTO max_members, group_status
  FROM groups 
  WHERE id = group_id;
  
  IF max_members IS NULL THEN
    RETURN FALSE; -- Group doesn't exist
  END IF;
  
  IF group_status != 'active' THEN
    RETURN FALSE; -- Group is not active
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM group_members 
    WHERE group_id = group_id AND user_id = user_id
  ) INTO is_already_member;
  
  IF is_already_member THEN
    RETURN FALSE; -- Already a member
  END IF;
  
  -- Check current member count
  SELECT COUNT(*) INTO group_member_count
  FROM group_members 
  WHERE group_id = group_id AND status = 'active';
  
  RETURN group_member_count < max_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next payout recipient
CREATE OR REPLACE FUNCTION get_next_payout_recipient(group_id UUID)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  rotation_position INTEGER,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    gm.rotation_position,
    p.email
  FROM group_members gm
  JOIN profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_id 
    AND gm.status = 'active'
    AND gm.has_received_payout = FALSE
    AND gm.rotation_position IS NOT NULL
  ORDER BY gm.rotation_position ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group contribution summary
CREATE OR REPLACE FUNCTION get_group_contribution_summary(
  group_id UUID,
  cycle_number INTEGER DEFAULT NULL
)
RETURNS TABLE(
  contributor_name TEXT,
  contributor_id UUID,
  amount BIGINT,
  status TEXT,
  contribution_date DATE,
  due_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name as contributor_name,
    c.contributor_id,
    c.amount,
    c.status,
    c.contribution_date,
    c.due_date,
    CASE 
      WHEN c.status != 'paid' AND c.due_date < CURRENT_DATE THEN
        EXTRACT(DAY FROM (CURRENT_DATE - c.due_date))::INTEGER
      ELSE 0
    END as days_overdue
  FROM contributions c
  JOIN profiles p ON c.contributor_id = p.id
  WHERE c.group_id = group_id
    AND (cycle_number IS NULL OR c.cycle_number = cycle_number)
  ORDER BY c.due_date DESC, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION upsert_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_profile_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_join_group TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_payout_recipient TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_contribution_summary TO authenticated;