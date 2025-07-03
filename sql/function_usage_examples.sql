-- Function Usage Examples for Adashi App
-- These are example queries showing how to use the database functions

-- ===========================================
-- PROFILE MANAGEMENT EXAMPLES
-- ===========================================

-- 1. Create or update a user profile after signup
SELECT upsert_profile(
  'user-uuid-here'::UUID,
  'john.doe@email.com',
  'John Doe',
  '+234 801 234 5678',
  'https://example.com/avatar.jpg'
);

-- 2. Update profile statistics (when user makes a contribution)
SELECT update_profile_stats(
  'user-uuid-here'::UUID,
  50000,  -- Add ₦500 (in kobo)
  0,      -- No change in active groups
  0       -- No change in completed cycles
);

-- 3. Get comprehensive user profile with calculated stats
SELECT * FROM get_user_profile_with_stats('user-uuid-here'::UUID);

-- 4. Update notification settings
SELECT update_notification_settings(
  'user-uuid-here'::UUID,
  '{"contributions": true, "groups": false, "payments": true, "general": true}'::JSONB
);

-- 5. Get user's group memberships with details
SELECT * FROM get_user_groups('user-uuid-here'::UUID);

-- ===========================================
-- GROUP MANAGEMENT EXAMPLES
-- ===========================================

-- 1. Create a new ROSCA group
SELECT create_group_with_owner(
  'Family Savings Circle',                    -- name
  'Monthly family savings group for house deposit', -- description
  8,                                         -- member count
  10000000,                                  -- ₦100,000 monthly (in kobo)
  15,                                        -- contribution day (15th of month)
  '2024-02-01'::DATE,                       -- start date
  'owner-uuid-here'::UUID,                  -- owner ID
  'First Bank',                             -- bank name
  '1234567890',                             -- account number
  'Family Savings Account'                  -- account name
);

-- 2. Add a member to a group
SELECT add_member_to_group(
  'group-uuid-here'::UUID,
  'new-member-uuid'::UUID,
  3  -- Optional: assign to position 3, or NULL for auto-assign
);

-- 3. Check if user can join a group
SELECT can_user_join_group(
  'user-uuid-here'::UUID,
  'group-uuid-here'::UUID
);

-- 4. Assign rotation positions (raffle method)
SELECT assign_rotation_positions(
  'group-uuid-here'::UUID,
  'raffle'
);

-- 5. Assign rotation positions (manual method)
SELECT assign_rotation_positions(
  'group-uuid-here'::UUID,
  'manual',
  '[
    {"user_id": "user1-uuid", "position": 1},
    {"user_id": "user2-uuid", "position": 2},
    {"user_id": "user3-uuid", "position": 3}
  ]'::JSONB
);

-- 6. Get next payout recipient
SELECT * FROM get_next_payout_recipient('group-uuid-here'::UUID);

-- 7. Get group financial summary
SELECT * FROM get_group_financial_summary('group-uuid-here'::UUID);

-- 8. Get group contribution summary for current cycle
SELECT * FROM get_group_contribution_summary(
  'group-uuid-here'::UUID,
  1  -- cycle number, or NULL for all cycles
);

-- ===========================================
-- CONTRIBUTION AND PAYMENT EXAMPLES
-- ===========================================

-- 1. Create monthly contribution records for all group members
SELECT process_monthly_contributions(
  'group-uuid-here'::UUID,
  1,                        -- cycle number
  '2024-02-15'::DATE       -- due date
);

-- 2. Record a payment when member makes contribution
SELECT record_payment(
  'contribution-uuid-here'::UUID,
  '2024-02-14'::DATE,      -- payment date
  'bank_transfer',         -- payment method
  'TXN123456789',         -- transaction reference
  'admin-uuid-here'::UUID -- verified by (optional)
);

-- 3. Distribute payout to next recipient
SELECT distribute_payout(
  'group-uuid-here'::UUID,
  1,                       -- cycle number
  'recipient-uuid-here'::UUID,
  80000000,               -- ₦800,000 payout (in kobo)
  '2024-02-20'::DATE,     -- payout date
  'admin-uuid-here'::UUID -- processed by
);

-- ===========================================
-- NOTIFICATION EXAMPLES
-- ===========================================

-- 1. Create a custom notification
SELECT create_notification(
  'user-uuid-here'::UUID,
  'Welcome to Adashi!',
  'Thank you for joining our savings community.',
  'system',
  NULL,  -- group_id
  NULL,  -- contribution_id
  NULL,  -- payout_id
  FALSE, -- action_required
  NULL,  -- action_url
  NOW() + INTERVAL '30 days' -- expires in 30 days
);

-- 2. Create contribution reminders (3 days before due)
SELECT create_contribution_reminders(
  'group-uuid-here'::UUID,
  3  -- days before due date
);

-- 3. Create overdue payment notifications
SELECT create_overdue_notifications(
  'group-uuid-here'::UUID  -- or NULL for all groups
);

-- 4. Create payout available notifications
SELECT create_payout_notifications('group-uuid-here'::UUID);

-- 5. Get user notifications with filtering
SELECT * FROM get_user_notifications(
  'user-uuid-here'::UUID,
  'contribution_due',  -- type filter (or NULL for all)
  TRUE,               -- unread only
  20,                 -- limit
  0                   -- offset
);

-- 6. Get notification counts by type
SELECT * FROM get_notification_counts('user-uuid-here'::UUID);

-- 7. Mark notifications as read
SELECT mark_notifications_read(
  'user-uuid-here'::UUID,
  ARRAY['notification1-uuid', 'notification2-uuid']::UUID[]
);

-- 8. Mark all notifications as read
SELECT mark_notifications_read('user-uuid-here'::UUID);

-- 9. Cleanup expired notifications (run periodically)
SELECT cleanup_expired_notifications();

-- ===========================================
-- COMPLEX QUERIES FOR APP FEATURES
-- ===========================================

-- Get dashboard overview for user
WITH user_stats AS (
  SELECT * FROM get_user_profile_with_stats('user-uuid-here'::UUID)
),
user_groups AS (
  SELECT * FROM get_user_groups('user-uuid-here'::UUID)
),
user_notifications AS (
  SELECT * FROM get_notification_counts('user-uuid-here'::UUID)
)
SELECT 
  us.total_contributions,
  us.active_groups,
  us.completed_cycles,
  us.current_month_contributions,
  us.success_rate,
  un.total_unread as unread_notifications,
  (SELECT COUNT(*) FROM user_groups WHERE status = 'active') as active_group_count,
  (SELECT SUM(total_contributed) FROM user_groups) as lifetime_contributions
FROM user_stats us
CROSS JOIN user_notifications un;

-- Get group dashboard with all details
WITH group_summary AS (
  SELECT * FROM get_group_financial_summary('group-uuid-here'::UUID)
),
recent_contributions AS (
  SELECT * FROM get_group_contribution_summary('group-uuid-here'::UUID, 1)
  ORDER BY due_date DESC
  LIMIT 5
),
next_recipient AS (
  SELECT * FROM get_next_payout_recipient('group-uuid-here'::UUID)
)
SELECT 
  g.name,
  g.description,
  g.member_count,
  g.monthly_amount,
  g.status,
  gs.total_collected,
  gs.collection_rate,
  gs.next_payout_amount,
  gs.next_recipient_name,
  nr.rotation_position as next_position
FROM groups g
CROSS JOIN group_summary gs
LEFT JOIN next_recipient nr ON TRUE
WHERE g.id = 'group-uuid-here'::UUID;

-- ===========================================
-- MAINTENANCE AND MONITORING QUERIES
-- ===========================================

-- Check system health - overdue contributions
SELECT 
  g.name as group_name,
  COUNT(*) as overdue_count,
  SUM(c.amount) as overdue_amount,
  AVG(EXTRACT(DAY FROM (CURRENT_DATE - c.due_date))) as avg_days_overdue
FROM contributions c
JOIN groups g ON c.group_id = g.id
WHERE c.status = 'pending' 
  AND c.due_date < CURRENT_DATE
GROUP BY g.id, g.name
ORDER BY overdue_amount DESC;

-- Monthly contribution summary by group
SELECT 
  g.name as group_name,
  DATE_TRUNC('month', c.contribution_date) as month,
  COUNT(CASE WHEN c.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_count,
  SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as total_collected,
  ROUND(
    COUNT(CASE WHEN c.status = 'paid' THEN 1 END) * 100.0 / COUNT(*), 2
  ) as success_rate
FROM contributions c
JOIN groups g ON c.group_id = g.id
WHERE c.contribution_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY g.id, g.name, DATE_TRUNC('month', c.contribution_date)
ORDER BY month DESC, group_name;

-- User engagement metrics
SELECT 
  p.full_name,
  p.active_groups,
  p.completed_cycles,
  p.total_contributions,
  COALESCE(recent_activity.last_contribution, 'Never') as last_contribution,
  COALESCE(recent_activity.contributions_this_month, 0) as contributions_this_month
FROM profiles p
LEFT JOIN (
  SELECT 
    contributor_id,
    MAX(contribution_date)::TEXT as last_contribution,
    COUNT(CASE WHEN DATE_TRUNC('month', contribution_date) = DATE_TRUNC('month', CURRENT_DATE) 
              AND status = 'paid' THEN 1 END) as contributions_this_month
  FROM contributions
  GROUP BY contributor_id
) recent_activity ON p.id = recent_activity.contributor_id
WHERE p.active_groups > 0
ORDER BY p.total_contributions DESC;