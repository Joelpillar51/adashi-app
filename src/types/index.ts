// Core data models for ROSCA/Tontine app

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'member';
  joinDate: string;
  paymentStatus: 'current' | 'pending' | 'overdue';
  rotationPosition: number;
  totalContributed: number;
  isActive: boolean;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  monthlyAmount: number;
  currentRecipient: string;
  myPosition: number;
  nextPaymentDue: string;
  daysLeft: number;
  totalSaved: number;
  cycleProgress: number;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'paused' | 'completed';
  members: User[];
  createdAt: string;
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
  avatar?: string;
  groupId: string;
}

export interface Payment {
  id: string;
  groupName: string;
  groupId: string;
  amount: number;
  type: 'contribution' | 'collection' | 'penalty';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method: 'bank_transfer' | 'cash';
  recipient?: string;
  reference?: string;
  bankDetails?: BankAccount;
}

export interface TimelineItem {
  id: string;
  memberName: string;
  memberId: string;
  position: number;
  amount: number;
  dueDate: string;
  status: 'completed' | 'current' | 'upcoming';
  isPaid: boolean;
  collectionDate?: string;
  groupId: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  userId: string;
}

export interface NotificationBanner {
  id: string;
  type: 'payment_due' | 'collection_turn' | 'new_member' | 'reminder';
  title: string;
  message: string;
  groupId?: string;
  daysLeft?: number;
  amount?: number;
  isVisible: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment_reminder' | 'collection_ready' | 'group_invite' | 'payment_received' | 'system' | 'group_update' | 'penalty_applied' | 'member_joined' | 'member_left';
  groupId?: string;
  groupName?: string;
  isRead: boolean;
  createdAt: string;
  actionType?: 'navigate' | 'external_link' | 'none';
  actionData?: any;
  priority: 'high' | 'medium' | 'low';
  amount?: number;
  memberName?: string;
}

// Nigerian banks for reference
export const NIGERIAN_BANKS = [
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'Access Bank',
  'Zenith Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank',
  'Union Bank',
  'Polaris Bank',
  'Stanbic IBTC Bank',
  'First City Monument Bank (FCMB)',
  'Keystone Bank',
  'Unity Bank',
  'Heritage Bank',
] as const;