// Nigerian Naira currency formatting utilities

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatNairaWithDecimals = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseNairaAmount = (value: string): number => {
  // Remove currency symbol and commas, then parse
  const cleaned = value.replace(/₦|,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCompactNaira = (amount: number): string => {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(1)}K`;
  }
  return formatNaira(amount);
};