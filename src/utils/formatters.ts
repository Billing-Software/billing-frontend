export const formatCurrency = (amount: number, currency = 'INR', locale = 'en-IN'): string => {
  // Check if currency is INR to show Rupees symbol nicely
  if (currency === 'INR') {
    return `₹${amount.toLocaleString(locale)}`;
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};

export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
