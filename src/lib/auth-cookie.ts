import { BRAND_COOKIE_NAME } from '@/lib/brand';

export const setAuthCookie = () => {
  document.cookie = `${BRAND_COOKIE_NAME}=1; path=/; max-age=2592000; samesite=lax`;
};

export const clearAuthCookie = () => {
  document.cookie = `${BRAND_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
