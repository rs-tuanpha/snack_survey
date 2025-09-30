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
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
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
