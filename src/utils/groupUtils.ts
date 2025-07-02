// Utility functions for group management

export const generateGroupId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `group_${timestamp}_${random}`;
};

export const calculateCycleEndDate = (memberCount: number, startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + memberCount);
  return endDate;
};

export const generateRotationSchedule = (members: any[], monthlyAmount: number, startDate: Date = new Date()) => {
  return members.map((member, index) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + index);
    
    return {
      id: `timeline_${member.id}_${index}`,
      memberName: member.name,
      memberId: member.id,
      position: index + 1,
      amount: monthlyAmount * members.length,
      dueDate: dueDate.toISOString(),
      status: index === 0 ? 'current' : 'upcoming',
      isPaid: false,
      groupId: '', // Will be set when creating the group
    };
  });
};

export const getGroupInviteCode = (groupId: string): string => {
  // Generate a simple 6-character invite code based on group ID
  const hash = groupId.split('_').pop() || 'default';
  return hash.substring(0, 6).toUpperCase();
};

export const validateGroupName = (name: string): { isValid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Group name is required' };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Group name must be at least 3 characters' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Group name must be less than 50 characters' };
  }
  
  return { isValid: true };
};

export const validateMonthlyAmount = (amount: number): { isValid: boolean; error?: string } => {
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than ₦0' };
  }
  
  if (amount < 1000) {
    return { isValid: false, error: 'Minimum contribution is ₦1,000' };
  }
  
  if (amount > 10000000) { // 10 million
    return { isValid: false, error: 'Maximum contribution is ₦10,000,000' };
  }
  
  return { isValid: true };
};

export const validateMemberCount = (count: number): { isValid: boolean; error?: string } => {
  if (count < 2) {
    return { isValid: false, error: 'Group must have at least 2 members' };
  }
  
  if (count > 50) {
    return { isValid: false, error: 'Group cannot have more than 50 members' };
  }
  
  return { isValid: true };
};