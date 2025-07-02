// Date utilities for West Africa Time (WAT) and Nigerian context

import { format, formatDistanceToNow, differenceInDays, addMonths, parseISO } from 'date-fns';

export const formatWATDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatWATDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy h:mm a');
};

export const formatTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const getDaysUntil = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(dateObj, new Date());
};

export const getNextPaymentDate = (lastPayment: Date | string, interval: number = 1): Date => {
  const lastDate = typeof lastPayment === 'string' ? parseISO(lastPayment) : lastPayment;
  return addMonths(lastDate, interval);
};

export const formatChatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diff = differenceInDays(now, dateObj);
  
  if (diff === 0) {
    return format(dateObj, 'h:mm a');
  } else if (diff === 1) {
    return 'Yesterday';
  } else if (diff < 7) {
    return format(dateObj, 'EEEE');
  } else {
    return format(dateObj, 'MMM dd');
  }
};

export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};