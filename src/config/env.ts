/**
 * Environment Configuration
 * Strictly sourced from .env (Vite environment variables)
 * Zero hardcoded localhost, URLs, or secrets.
 */

export const MARKETING_URL: string = (import.meta as any).env?.VITE_MARKETING_URL || '';
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL || '';
export const RAZORPAY_KEY_ID: string = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';
export const META_APP_ID: string = (import.meta as any).env?.VITE_META_APP_ID || '';
export const META_CONFIG_ID: string = (import.meta as any).env?.VITE_META_CONFIG_ID || '';
