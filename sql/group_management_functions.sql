-- Group Management and Advanced Functions for Adashi App
-- Execute this SQL in your Supabase Dashboard -> SQL Editor

-- Function to create a new group with owner
CREATE OR REPLACE FUNCTION create_group_with_owner(
  group_name TEXT,
  group_description TEXT,
  member_count INTEGER,
  monthly_amount BIGINT,
  contribution_day INTEGER,
  start_date DATE,
  owner_id UUID,
  bank_name TEXT DEFAULT NULL,
  account_number TEXT DEFAULT NULL,
  account_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create the group
  INSERT INTO groups (
    name, description, member_count, monthly_amount, 
    contribution_day, start_date, owner_id,
    bank_name, account_number, account_name,
    invite_code, status
  ) VALUES (
    group_name, group_description, member_count, monthly_amount,
    contribution_day, start_date, owner_id,
    bank_name, account_number, account_name,
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), -- Generate invite code
    'active'
  ) RETURNING id INTO new_group_id;
  
  -- Add owner as first member
  INSERT INTO group_members (
    group_id, user_id, role, status, rotation_position
  ) VALUES (
    new_group_id, owner_id, 'owner', 'active', 1
  );
  
  -- Update owner's active groups count
  PERFORM update_profile_stats(owner_id, 0, 1, 0);
  
  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add member to group
CREATE OR REPLACE FUNCTION add_member_to_group(
  group_id UUID,
  user_id UUID,
  assigned_position INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  can_join BOOLEAN;
  next_position INTEGER;
BEGIN
  -- Check if user can join
  SELECT can_user_join_group(user_id, group_id) INTO can_join;
  
  IF NOT can_join THEN
    RETURN FALSE;
  END IF;
  
  -- Determine position
  IF assigned_position IS NULL THEN
    SELECT COALESCE(MAX(rotation_position), 0) + 1 
    INTO next_position
    FROM group_members 
    WHERE group_id = group_id;
  ELSE
    next_position := assigned_position;
  END IF;
  
  -- Add member
  INSERT INTO group_members (
    group_id, user_id, role, status, rotation_position
  ) VALUES (
    group_id, user_id, 'member', 'active', next_position
  );
  
  -- Update user's active groups count
  PERFORM update_profile_stats(user_id, 0, 1, 0);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process monthly contributions (create contribution records)
CREATE OR REPLACE FUNCTION process_monthly_contributions(
  group_id UUID,
  cycle_number INTEGER,
  due_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  member_record RECORD;
  group_amount BIGINT;
  contributions_created INTEGER := 0;
BEGIN
  -- Get group monthly amount
  SELECT monthly_amount INTO group_amount
  FROM groups 
  WHERE id = group_id;
  
  -- Create contribution records for all active members
  FOR member_record IN 
    SELECT user_id 
    FROM group_members 
    WHERE group_id = group_id AND status = 'active'
  LOOP
    INSERT INTO contributions (
      group_id, contributor_id, amount, cycle_number,
      contribution_date, due_date, status
    ) VALUES (
      group_id, member_record.user_id, group_amount, cycle_number,
      due_date, due_date, 'pending'
    );
    
    contributions_created := contributions_created + 1;
  END LOOP;
  
  RETURN contributions_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a payment
CREATE OR REPLACE FUNCTION record_payment(
  contribution_id UUID,
  payment_date DATE,
  payment_method TEXT,
  transaction_reference TEXT DEFAULT NULL,
  verified_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  contribution_record RECORD;
BEGIN
  -- Get contribution details
  SELECT * INTO contribution_record
  FROM contributions 
  WHERE id = contribution_id;
  
  IF contribution_record.id IS NULL THEN
    RETURN FALSE; -- Contribution doesn't exist
  END IF;
  
  -- Update contribution status
  UPDATE contributions 
  SET 
    status = 'paid',
    contribution_date = payment_date,
    payment_method = payment_method,
    transaction_reference = transaction_reference,
    verified_by = verified_by,
    verified_at = CASE WHEN verified_by IS NOT NULL THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = contribution_id;
  
  -- Update contributor's total contributions
  PERFORM update_profile_stats(
    contribution_record.contributor_id, 
    contribution_record.amount, 
    0, 
    0
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute payout
CREATE OR REPLACE FUNCTION distribute_payout(
  group_id UUID,
  cycle_number INTEGER,
  recipient_id UUID,
  payout_amount BIGINT,
  payout_date DATE,
  processed_by UUID
)
RETURNS UUID AS $$
DECLARE
  new_payout_id UUID;
  recipient_bank_record RECORD;
BEGIN
  -- Get recipient bank details from profile or group
  SELECT 
    p.full_name,
    COALESCE(p.bank_name, g.bank_name) as bank_name,
    COALESCE(p.account_number, g.account_number) as account_number,
    COALESCE(p.account_name, g.account_name) as account_name
  INTO recipient_bank_record
  FROM profiles p
  CROSS JOIN groups g
  WHERE p.id = recipient_id AND g.id = group_id;
  
  -- Create payout record
  INSERT INTO payouts (
    group_id, recipient_id, amount, cycle_number, payout_date,
    status, recipient_bank_name, recipient_account_number, 
    recipient_account_name, processed_by, processed_at
  ) VALUES (
    group_id, recipient_id, payout_amount, cycle_number, payout_date,
    'processed', recipient_bank_record.bank_name, 
    recipient_bank_record.account_number, recipient_bank_record.account_name,
    processed_by, NOW()
  ) RETURNING id INTO new_payout_id;
  
  -- Mark member as having received payout
  UPDATE group_members 
  SET 
    has_received_payout = TRUE,
    payout_date = payout_date,
    updated_at = NOW()
  WHERE group_id = group_id AND user_id = recipient_id;
  
  -- Check if all members have received payout (cycle complete)
  IF NOT EXISTS(
    SELECT 1 FROM group_members 
    WHERE group_id = group_id AND status = 'active' AND has_received_payout = FALSE
  ) THEN
    -- All members have received payout, increment completed cycles
    UPDATE profiles 
    SET completed_cycles = completed_cycles + 1
    WHERE id IN (
      SELECT user_id FROM group_members WHERE group_id = group_id AND status = 'active'
    );
    
    -- Reset for next cycle
    UPDATE group_members 
    SET has_received_payout = FALSE
    WHERE group_id = group_id AND status = 'active';
  END IF;
  
  RETURN new_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign rotation positions (manual or raffle)
CREATE OR REPLACE FUNCTION assign_rotation_positions(
  group_id UUID,
  assignment_method TEXT DEFAULT 'raffle', -- 'manual' or 'raffle'
  position_assignments JSONB DEFAULT NULL -- For manual assignment: [{"user_id": "uuid", "position": 1}, ...]
)
RETURNS BOOLEAN AS $$
DECLARE
  member_record RECORD;
  position_counter INTEGER := 1;
  member_ids UUID[];
  shuffled_positions INTEGER[];
  i INTEGER;
BEGIN
  IF assignment_method = 'manual' AND position_assignments IS NOT NULL THEN
    -- Manual assignment
    FOR member_record IN 
      SELECT * FROM jsonb_to_recordset(position_assignments) 
      AS x(user_id UUID, position INTEGER)
    LOOP
      UPDATE group_members 
      SET rotation_position = member_record.position
      WHERE group_id = group_id AND user_id = member_record.user_id;
    END LOOP;
    
  ELSE
    -- Raffle assignment (random)
    -- Get all member IDs
    SELECT ARRAY_AGG(user_id ORDER BY RANDOM()) INTO member_ids
    FROM group_members 
    WHERE group_id = group_id AND status = 'active';
    
    -- Assign positions sequentially to randomized members
    FOR i IN 1..ARRAY_LENGTH(member_ids, 1) LOOP
      UPDATE group_members 
      SET rotation_position = i
      WHERE group_id = group_id AND user_id = member_ids[i];
    END LOOP;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group financial summary
CREATE OR REPLACE FUNCTION get_group_financial_summary(group_id UUID)
RETURNS TABLE(
  total_expected BIGINT,
  total_collected BIGINT,
  total_pending BIGINT,
  total_overdue BIGINT,
  collection_rate NUMERIC,
  members_paid INTEGER,
  members_pending INTEGER,
  next_payout_amount BIGINT,
  next_recipient_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH contribution_stats AS (
    SELECT 
      COUNT(*) as total_contributions,
      SUM(amount) as total_expected,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
      SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END) as total_overdue,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as members_paid,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as members_pending
    FROM contributions 
    WHERE group_id = group_id
  ),
  next_recipient AS (
    SELECT 
      p.full_name,
      g.monthly_amount * g.member_count as payout_amount
    FROM get_next_payout_recipient(group_id) npr
    JOIN profiles p ON npr.user_id = p.id
    CROSS JOIN groups g WHERE g.id = group_id
    LIMIT 1
  )
  SELECT 
    cs.total_expected,
    cs.total_collected,
    cs.total_pending,
    cs.total_overdue,
    CASE WHEN cs.total_expected > 0 THEN 
      ROUND((cs.total_collected * 100.0 / cs.total_expected), 2)
    ELSE 0 END as collection_rate,
    cs.members_paid,
    cs.members_pending,
    COALESCE(nr.payout_amount, 0) as next_payout_amount,
    COALESCE(nr.full_name, 'TBD') as next_recipient_name
  FROM contribution_stats cs
  LEFT JOIN next_recipient nr ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_group_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION add_member_to_group TO authenticated;
GRANT EXECUTE ON FUNCTION process_monthly_contributions TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment TO authenticated;
GRANT EXECUTE ON FUNCTION distribute_payout TO authenticated;
GRANT EXECUTE ON FUNCTION assign_rotation_positions TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_financial_summary TO authenticated;