/**
 * Indian number-to-words converter
 * Converts numbers to Indian format words (Lakhs, Crores)
 * e.g. 124500 → "One Lakh Twenty-Four Thousand Five Hundred Rupees Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowHundred(n: number): string {
  if (n < 20) return ones[n];
  const t = tens[Math.floor(n / 10)];
  const o = ones[n % 10];
  return o ? `${t}-${o}` : t;
}

function convertBelowThousand(n: number): string {
  if (n < 100) return convertBelowHundred(n);
  const h = ones[Math.floor(n / 100)];
  const remainder = n % 100;
  const rest = remainder ? ' ' + convertBelowHundred(remainder) : '';
  return `${h} Hundred${rest}`;
}

/**
 * Convert a number to Indian-style words
 * Indian system: Ones, Thousands, Lakhs, Crores
 * 1,00,00,000 = One Crore
 * 1,00,000 = One Lakh
 * 1,000 = One Thousand
 */
export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'Zero';
  if (amount < 0) return 'Minus ' + numberToIndianWords(Math.abs(amount));

  // Handle decimals (paise)
  const intPart = Math.floor(amount);
  const decimalPart = Math.round((amount - intPart) * 100);

  let words = '';

  if (intPart === 0) {
    words = 'Zero';
  } else {
    const crores = Math.floor(intPart / 10000000);
    const lakhs = Math.floor((intPart % 10000000) / 100000);
    const thousands = Math.floor((intPart % 100000) / 1000);
    const hundreds = intPart % 1000;

    const parts: string[] = [];

    if (crores > 0) {
      parts.push(convertBelowHundred(crores) + ' Crore');
    }
    if (lakhs > 0) {
      parts.push(convertBelowHundred(lakhs) + ' Lakh');
    }
    if (thousands > 0) {
      parts.push(convertBelowHundred(thousands) + ' Thousand');
    }
    if (hundreds > 0) {
      parts.push(convertBelowThousand(hundreds));
    }

    words = parts.join(' ');
  }

  let result = words + ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + convertBelowHundred(decimalPart) + ' Paise';
  }

  result += ' Only';

  return result;
}

/**
 * Format number in Indian numbering system (with commas)
 * e.g. 1234567 → "12,34,567"
 */
export function formatIndianNumber(n: number): string {
  const parts = n.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Remove sign for formatting
  const isNegative = intPart.startsWith('-');
  if (isNegative) intPart = intPart.slice(1);

  if (intPart.length <= 3) {
    return (isNegative ? '-' : '') + intPart + '.' + decPart;
  }

  // Last 3 digits
  let result = intPart.slice(-3);
  let remaining = intPart.slice(0, -3);

  // Group remaining in pairs
  while (remaining.length > 0) {
    const chunk = remaining.slice(-2);
    result = chunk + ',' + result;
    remaining = remaining.slice(0, -2);
  }

  return (isNegative ? '-' : '') + result + '.' + decPart;
}
