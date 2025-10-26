// 1. define cookie keys
export const CookieKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;

// 2. define type union from object
export type CookieKey = typeof CookieKeys[keyof typeof CookieKeys];

// 3. (Optional) map key -> value type
export interface CookieValueMap {
  [CookieKeys.ACCESS_TOKEN]: string;
  [CookieKeys.REFRESH_TOKEN]: string;
  [CookieKeys.USER_DATA]: string;
}

export function getCookieRaw(name: CookieKey): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
  } catch (error) {
    console.error('Error reading cookie:', error);
    return null;
  }
}

export function setCookieRaw(name: CookieKey, value: string, days = 7): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function deleteCookieRaw(name: CookieKey): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ✅ New: clear all cookies defined in CookieKeys
export function clearAllCookies(keys: readonly CookieKey[]): void {
  keys.forEach((key) => {
    deleteCookieRaw(key);
  });
}

/**
 * Get all authentication-related cookies for debugging
 * @returns Object containing all auth cookies
 */
export function getAllAuthCookies(): Record<string, string | null> {
  return {
    [CookieKeys.ACCESS_TOKEN]: getCookieRaw(CookieKeys.ACCESS_TOKEN),
    [CookieKeys.REFRESH_TOKEN]: getCookieRaw(CookieKeys.REFRESH_TOKEN),
    [CookieKeys.USER_DATA]: getCookieRaw(CookieKeys.USER_DATA),
  };
}

/**
 * Check if valid authentication data exists in cookies
 * @returns Boolean indicating if valid auth data exists
 */
export function hasValidAuthData(): boolean {
  const accessToken = getCookieRaw(CookieKeys.ACCESS_TOKEN);
  const userData = getCookieRaw(CookieKeys.USER_DATA);
  
  if (!accessToken || !userData) {
    return false;
  }

  try {
    const user = JSON.parse(userData);
    return !!(user && user.id && user.email && user.username);
  } catch (error) {
    console.warn('Failed to parse user data from cookie:', error);
    return false;
  }
}

/**
 * Get user data from cookie with error handling
 * @returns Parsed user data or null if invalid
 */
export function getUserDataFromCookie(): any | null {
  try {
    const userDataRaw = getCookieRaw(CookieKeys.USER_DATA);
    if (!userDataRaw) {
      return null;
    }
    
    const userData = JSON.parse(userDataRaw);
    if (!userData || !userData.id || !userData.email || !userData.username) {
      return null;
    }
    
    return userData;
  } catch (error) {
    console.warn('Failed to get user data from cookie:', error);
    return null;
  }
}

/**
 * Check if access token exists and is not empty
 * @returns Boolean indicating if access token exists
 */
export function hasAccessToken(): boolean {
  const token = getCookieRaw(CookieKeys.ACCESS_TOKEN);
  return !!(token && token.trim() !== '');
}

/**
 * Check if refresh token exists and is not empty
 * @returns Boolean indicating if refresh token exists
 */
export function hasRefreshToken(): boolean {
  const token = getCookieRaw(CookieKeys.REFRESH_TOKEN);
  return !!(token && token.trim() !== '');
}
