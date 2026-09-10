/**
 * Centralized form/input validation for BillCom.
 * Mirrors BillingBackend/Validation/ValidationPatterns.cs
 * Keep all regexes in sync across smartbill-pro, marketing, superadmin, mobile, backend.
 */

export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Indian mobile: 10 digits starting 6-9 (after stripping +91, spaces, dashes)
  phoneIN: /^[6-9]\d{9}$/,
  phoneIntl: /^\+?[1-9]\d{7,14}$/,
  gstin: /^\d{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  pincodeIN: /^[1-9][0-9]{5}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  upiVpa: /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/,
  vehicleNo: /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/,
  username: /^[a-zA-Z0-9_]+$/,
  hexColor: /^#([A-Fa-f0-9]{6})$/,
  gstStateCode: /^([0-2][0-9]|3[0-7])$/,
  accountNumber: /^[0-9]{9,18}$/,
} as const;

export const normalizePhoneIN = (phone: string): string => {
  let p = (phone || '').replace(/[\s\-()]/g, '');
  if (p.startsWith('+91')) p = p.slice(3);
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  if (p.startsWith('0') && p.length === 11) p = p.slice(1);
  return p;
};

export const isValidEmail = (v: string): boolean => PATTERNS.email.test((v || '').trim());
export const isValidPhoneIN = (v: string): boolean => PATTERNS.phoneIN.test(normalizePhoneIN(v));
export const isValidPhoneIntl = (v: string): boolean =>
  PATTERNS.phoneIntl.test((v || '').replace(/[\s\-()]/g, ''));
export const isValidGstin = (v: string): boolean => PATTERNS.gstin.test((v || '').trim().toUpperCase());
export const isValidPan = (v: string): boolean => PATTERNS.pan.test((v || '').trim().toUpperCase());
export const isValidPincode = (v: string): boolean => PATTERNS.pincodeIN.test((v || '').trim());
export const isValidIfsc = (v: string): boolean => PATTERNS.ifsc.test((v || '').trim().toUpperCase());
export const isValidUpi = (v: string): boolean => PATTERNS.upiVpa.test((v || '').trim());
export const isValidVehicleNo = (v: string): boolean =>
  PATTERNS.vehicleNo.test((v || '').trim().toUpperCase().replace(/[\s\-]/g, ''));
export const isValidUsername = (v: string): boolean => PATTERNS.username.test((v || '').trim());
export const isValidAccountNumber = (v: string): boolean =>
  PATTERNS.accountNumber.test((v || '').trim());
export const isPositiveAmount = (v: unknown): boolean => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) && n > 0;
};
export const isNonNegativeAmount = (v: unknown): boolean => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) && n >= 0;
};
export const isValidTaxRate = (v: unknown): boolean => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) && n >= 0 && n <= 28;
};
export const isValidPassword = (v: string, min = 6): boolean => (v || '').length >= min;

// ---- Error-message helpers (return '' when valid) ----
export const required = (v: unknown, field = 'This field'): string =>
  v === null || v === undefined || String(v).trim() === '' ? `${field} is required.` : '';

export const emailError = (v: string, opts: { required?: boolean; field?: string } = {}): string => {
  const { required: req = false, field = 'Email' } = opts;
  if (!v?.trim()) return req ? `${field} is required.` : '';
  return isValidEmail(v) ? '' : 'Enter a valid email address.';
};

export const phoneINError = (v: string, opts: { required?: boolean; field?: string } = {}): string => {
  const { required: req = false, field = 'Phone' } = opts;
  if (!v?.trim()) return req ? `${field} is required.` : '';
  return isValidPhoneIN(v) ? '' : 'Enter a valid 10-digit mobile number starting with 6-9.';
};

export const gstinError = (v: string, opts: { required?: boolean } = {}): string => {
  const { required: req = false } = opts;
  if (!v?.trim()) return req ? 'GSTIN is required.' : '';
  return isValidGstin(v) ? '' : 'Enter a valid 15-character GSTIN (e.g. 37ABCDE1234F1Z5).';
};

export const panError = (v: string, opts: { required?: boolean } = {}): string => {
  const { required: req = false } = opts;
  if (!v?.trim()) return req ? 'PAN is required.' : '';
  return isValidPan(v) ? '' : 'Enter a valid 10-character PAN (e.g. ABCDE1234F).';
};

export const pincodeError = (v: string, opts: { required?: boolean } = {}): string => {
  const { required: req = false } = opts;
  if (!v?.trim()) return req ? 'PIN code is required.' : '';
  return isValidPincode(v) ? '' : 'Enter a valid 6-digit PIN code.';
};

export const ifscError = (v: string, opts: { required?: boolean } = {}): string => {
  const { required: req = false } = opts;
  if (!v?.trim()) return req ? 'IFSC is required.' : '';
  return isValidIfsc(v) ? '' : 'Enter a valid IFSC (e.g. HDFC0001234).';
};

export const upiError = (v: string, opts: { required?: boolean } = {}): string => {
  const { required: req = false } = opts;
  if (!v?.trim()) return req ? 'UPI ID is required.' : '';
  return isValidUpi(v) ? '' : 'Enter a valid UPI ID (e.g. shop@upi).';
};

export const amountError = (
  v: unknown,
  opts: { required?: boolean; allowZero?: boolean; field?: string } = {},
): string => {
  const { required: req = true, allowZero = false, field = 'Amount' } = opts;
  if (v === null || v === undefined || String(v).trim() === '')
    return req ? `${field} is required.` : '';
  const n = Number(v);
  if (!Number.isFinite(n)) return `${field} must be a number.`;
  if (allowZero ? n < 0 : n <= 0) return `${field} must be ${allowZero ? 'zero or more' : 'greater than zero'}.`;
  return '';
};

export type FormErrors = Record<string, string>;

export const hasErrors = (errors: FormErrors): boolean => Object.values(errors).some(Boolean);

export const firstError = (errors: FormErrors): string =>
  Object.values(errors).find(Boolean) ?? '';
