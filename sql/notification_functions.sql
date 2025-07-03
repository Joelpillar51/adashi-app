-- Notification Management Functions for Adashi App
-- Execute this SQL in your Supabase Dashboard -> SQL Editor

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id UUID,
  title TEXT,
  message TEXT,
  notification_type TEXT,
  group_id UUID DEFAULT NULL,
  contribution_id UUID DEFAULT NULL,
  payout_id UUID DEFAULT NULL,
  action_required BOOLEAN DEFAULT FALSE,
  action_url TEXT DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, title, message, type, group_id, contribution_id, payout_id,
    action_required, action_url, expires_at
  ) VALUES (
    user_id, title, message, notification_type, group_id, contribution_id, payout_id,
    action_required, action_url, expires_at
  ) RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create contribution reminder notifications
CREATE OR REPLACE FUNCTION create_contribution_reminders(
  group_id UUID,
  days_before_due INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  contribution_record RECORD;
  notification_count INTEGER := 0;
  reminder_date DATE;
BEGIN
  reminder_date := CURRENT_DATE + INTERVAL '1 day' * days_before_due;
  
  -- Create reminders for pending contributions due soon
  FOR contribution_record IN 
    SELECT 
      c.id as contribution_id,
      c.contributor_id,
      c.amount,
      c.due_date,
      g.name as group_name,
      p.full_name
    FROM contributions c
    JOIN groups g ON c.group_id = g.id
    JOIN profiles p ON c.contributor_id = p.id
    WHERE c.group_id = group_id
      AND c.status = 'pending'
      AND c.due_date = reminder_date
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = c.contributor_id 
          AND n.contribution_id = c.id 
          AND n.type = 'contribution_due'
          AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
      )
  LOOP
    PERFORM create_notification(
      contribution_record.contributor_id,
      'Contribution Due Soon',
      FORMAT('Your contribution of ₦%s for %s is due on %s',
        (contribution_record.amount / 100)::TEXT,
        contribution_record.group_name,
        TO_CHAR(contribution_record.due_date, 'Mon DD, YYYY')
      ),
      'contribution_due',
      group_id,
      contribution_record.contribution_id,
      NULL,
      TRUE,
      FORMAT('/groups/%s/contribute', group_id),
      NULL
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create overdue payment notifications
CREATE OR REPLACE FUNCTION create_overdue_notifications(
  group_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  contribution_record RECORD;
  notification_count INTEGER := 0;
  group_filter TEXT;
BEGIN
  -- Create notifications for overdue contributions
  FOR contribution_record IN 
    SELECT 
      c.id as contribution_id,
      c.contributor_id,
      c.amount,
      c.due_date,
      g.id as group_id,
      g.name as group_name,
      p.full_name,
      EXTRACT(DAY FROM (CURRENT_DATE - c.due_date)) as days_overdue
    FROM contributions c
    JOIN groups g ON c.group_id = g.id
    JOIN profiles p ON c.contributor_id = p.id
    WHERE c.status = 'pending'
      AND c.due_date < CURRENT_DATE
      AND (group_id IS NULL OR c.group_id = group_id)
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = c.contributor_id 
          AND n.contribution_id = c.id 
          AND n.type = 'contribution_due'
          AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
      )
  LOOP
    PERFORM create_notification(
      contribution_record.contributor_id,
      'Payment Overdue',
      FORMAT('Your contribution of ₦%s for %s was due %s days ago. Please make payment immediately.',
        (contribution_record.amount / 100)::TEXT,
        contribution_record.group_name,
        contribution_record.days_overdue::TEXT
      ),
      'contribution_due',
      contribution_record.group_id,
      contribution_record.contribution_id,
      NULL,
      TRUE,
      FORMAT('/groups/%s/contribute', contribution_record.group_id),
      NULL
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create payout available notifications
CREATE OR REPLACE FUNCTION create_payout_notifications(group_id UUID)
RETURNS INTEGER AS $$
DECLARE
  recipient_record RECORD;
  group_record RECORD;
  payout_amount BIGINT;
  notification_count INTEGER := 0;
BEGIN
  -- Get group details
  SELECT * INTO group_record FROM groups WHERE id = group_id;
  
  IF group_record.id IS NULL THEN
    RETURN 0;
  END IF;
  
  payout_amount := group_record.monthly_amount * group_record.member_count;
  
  -- Get next payout recipient
  SELECT * INTO recipient_record 
  FROM get_next_payout_recipient(group_id);
  
  IF recipient_record.user_id IS NOT NULL THEN
    PERFORM create_notification(
      recipient_record.user_id,
      'Payout Available!',
      FORMAT('Congratulations! Your payout of ₦%s from %s is ready for collection.',
        (payout_amount / 100)::TEXT,
        group_record.name
      ),
      'payout_available',
      group_id,
      NULL,
      NULL,
      TRUE,
      FORMAT('/groups/%s/payout', group_id),
      NULL
    );
    
    notification_count := 1;
  END IF;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  user_id UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NOT NULL THEN
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = user_id 
      AND id = ANY(notification_ids) 
      AND read = FALSE;
  ELSE
    -- Mark all user notifications as read
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = user_id 
      AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notifications with filtering
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id UUID,
  notification_type TEXT DEFAULT NULL,
  unread_only BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  group_id UUID,
  group_name TEXT,
  contribution_id UUID,
  payout_id UUID,
  read BOOLEAN,
  action_required BOOLEAN,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.group_id,
    g.name as group_name,
    n.contribution_id,
    n.payout_id,
    n.read,
    n.action_required,
    n.action_url,
    n.created_at,
    n.expires_at
  FROM notifications n
  LEFT JOIN groups g ON n.group_id = g.id
  WHERE n.user_id = user_id
    AND (notification_type IS NULL OR n.type = notification_type)
    AND (NOT unread_only OR n.read = FALSE)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification counts by type
CREATE OR REPLACE FUNCTION get_notification_counts(user_id UUID)
RETURNS TABLE(
  total_unread INTEGER,
  contribution_due INTEGER,
  payment_received INTEGER,
  payout_available INTEGER,
  group_update INTEGER,
  system_notifications INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_unread,
    COUNT(CASE WHEN type = 'contribution_due' THEN 1 END)::INTEGER as contribution_due,
    COUNT(CASE WHEN type = 'payment_received' THEN 1 END)::INTEGER as payment_received,
    COUNT(CASE WHEN type = 'payout_available' THEN 1 END)::INTEGER as payout_available,
    COUNT(CASE WHEN type = 'group_update' THEN 1 END)::INTEGER as group_update,
    COUNT(CASE WHEN type = 'system' THEN 1 END)::INTEGER as system_notifications
  FROM notifications
  WHERE user_id = user_id 
    AND read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_contribution_reminders TO authenticated;
GRANT EXECUTE ON FUNCTION create_overdue_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_payout_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_counts TO authenticated;