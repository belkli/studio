export const setAuthCookie = () => {
  document.cookie = 'harmonia-user=1; path=/; max-age=2592000; samesite=lax';
};

export const clearAuthCookie = () => {
  document.cookie = 'harmonia-user=; path=/; max-age=0; samesite=lax';
};
