import jsCookie from 'js-cookie'
import { logger } from '@/core/utils/logger'
import type { IUser } from '@/core/interfaces/model/user'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthData {
  accessToken: string
  refreshToken?: string
  user: IUser
}

export interface CookieOptions {
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  expires?: number
  httpOnly?: boolean
  path?: string
  domain?: string
}

// ============================================================================
// SESSION STORAGE
// ============================================================================

/**
 * Handle get/set/remove Session Storage
 */
export const Session = {
  get: <T = any>(key: string, fallbackValue = {}): T => {
    if (typeof sessionStorage === 'undefined') {
      return fallbackValue as T
    }
    const data = sessionStorage.getItem(key)

    try {
      return (JSON.parse(data as string) || fallbackValue) as T
    } catch (error) {
      return (data || fallbackValue) as T
    }
  },
  set: (key: string, value?: string | object) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(value))
    }
  },
  remove: (key: string) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key)
    }
  }
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

/**
 * Handle get/set/remove Local Storage
 */
export const LocalStorage = {
  get: <T = any>(key: string, fallbackValue = {}): T => {
    if (typeof localStorage === 'undefined') {
      return fallbackValue as T
    }
    const data = localStorage.getItem(key)
    try {
      return (JSON.parse(data as string) ?? fallbackValue) as T
    } catch (e) {
      return (data || fallbackValue) as T
    }
  },
  set: (key: string, value?: string | object) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value))
    }
  },
  remove: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
}

// ============================================================================
// COOKIE CONFIGURATION
// ============================================================================

/**
 * Default cookie options for authentication data
 */
const AUTH_COOKIE_OPTIONS: CookieOptions = {
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  expires: 7,          // 7 days
  httpOnly: false,     // Allow JS access (needed for frontend)
  path: '/',           // Available site-wide
}

/**
 * Default cookie options for app preferences
 */
const APP_COOKIE_OPTIONS: CookieOptions = {
  secure: true,
  sameSite: 'lax',     // Less strict for app preferences
  expires: 30,         // 30 days
  httpOnly: false,
  path: '/',
}

// ============================================================================
// ENHANCED COOKIE UTILITIES
// ============================================================================

/**
 * Enhanced Cookie utilities with secure configuration
 */
export const Cookies = {
  // Basic cookie operations with default secure options
  get: (name: string): string | undefined => {
    return jsCookie.get(name)
  },

  set: (name: string, value: string | object, options?: CookieOptions): void => {
    const cookieOptions = { ...AUTH_COOKIE_OPTIONS, ...options }
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    jsCookie.set(name, stringValue, cookieOptions)
  },

  remove: (name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void => {
    const cookieOptions = { ...AUTH_COOKIE_OPTIONS, ...options }
    jsCookie.remove(name, cookieOptions)
  },

  // Get parsed JSON from cookie
  getJSON: <T = any>(name: string, fallbackValue: T | null = null): T | null => {
    const value = jsCookie.get(name)
    if (!value) return fallbackValue
    
    try {
      return JSON.parse(value) as T
    } catch (error) {
      logger.storage.warn(`Failed to parse cookie ${name}:`, error)
      return fallbackValue
    }
  },

  // Set JSON object to cookie
  setJSON: (name: string, value: any, options?: CookieOptions): void => {
    Cookies.set(name, value, options)
  },

  // Check if cookie exists
  exists: (name: string): boolean => {
    return jsCookie.get(name) !== undefined
  },

  // Get all cookies
  getAll: (): { [key: string]: string } => {
    return jsCookie.get()
  }
}

// ============================================================================
// AUTHENTICATION STORAGE HELPERS
// ============================================================================

/**
 * Authentication-specific storage helpers
 */
export const AuthStorage = {
  // Cookie keys
  KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
  } as const,

  // Store authentication data in cookies
  setAuthData: (authData: AuthData): void => {
    try {
      Cookies.set(AuthStorage.KEYS.ACCESS_TOKEN, authData.accessToken, AUTH_COOKIE_OPTIONS)
      if (authData.refreshToken) {
        Cookies.set(AuthStorage.KEYS.REFRESH_TOKEN, authData.refreshToken, AUTH_COOKIE_OPTIONS)
      }
      
      Cookies.setJSON(AuthStorage.KEYS.USER_DATA, authData.user, AUTH_COOKIE_OPTIONS)
    } catch (error) {
      console.error('Failed to store auth data:', error)
    }
  },

  // Get authentication data from cookies
  getAuthData: (): Partial<AuthData> | null => {
    try {
      const accessToken = Cookies.get(AuthStorage.KEYS.ACCESS_TOKEN)
      const refreshToken = Cookies.get(AuthStorage.KEYS.REFRESH_TOKEN)
      const user = Cookies.getJSON<IUser>(AuthStorage.KEYS.USER_DATA)

      if (!accessToken || !user) {
        return null
      }

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        user
      }
    } catch (error) {
      console.error('Failed to get auth data:', error)
      return null
    }
  },

  // Update access token
  updateAccessToken: (accessToken: string): void => {
    Cookies.set(AuthStorage.KEYS.ACCESS_TOKEN, accessToken, AUTH_COOKIE_OPTIONS)
  },

  // Update refresh token
  updateRefreshToken: (refreshToken: string): void => {
    Cookies.set(AuthStorage.KEYS.REFRESH_TOKEN, refreshToken, AUTH_COOKIE_OPTIONS)
  },

  // Update user data
  updateUserData: (user: IUser): void => {
    Cookies.setJSON(AuthStorage.KEYS.USER_DATA, user, AUTH_COOKIE_OPTIONS)
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const accessToken = Cookies.get(AuthStorage.KEYS.ACCESS_TOKEN)
    const user = Cookies.getJSON<IUser>(AuthStorage.KEYS.USER_DATA)
    return !!(accessToken && user)
  },

  // Clear all authentication data
  clearAuthData: (): void => {
    Cookies.remove(AuthStorage.KEYS.ACCESS_TOKEN)
    Cookies.remove(AuthStorage.KEYS.REFRESH_TOKEN)
    Cookies.remove(AuthStorage.KEYS.USER_DATA)
  },

  // Get access token only
  getAccessToken: (): string | null => {
    return Cookies.get(AuthStorage.KEYS.ACCESS_TOKEN) || null
  },

  // Get refresh token only
  getRefreshToken: (): string | null => {
    return Cookies.get(AuthStorage.KEYS.REFRESH_TOKEN) || null
  },

  // Get user data only
  getUserData: (): IUser | null => {
    return Cookies.getJSON<IUser>(AuthStorage.KEYS.USER_DATA)
  }
}

// ============================================================================
// APP PREFERENCES STORAGE HELPERS
// ============================================================================

/**
 * App preferences storage helpers (using localStorage)
 */
export const AppStorage = {
  // Keys for app preferences
  KEYS: {
    AVAILABLE_USERS: 'available_users',
    APP_PREFERENCES: 'app_preferences',
    VOTING_HISTORY: 'voting_history',
  } as const,

  // Store available users list
  setAvailableUsers: (users: IUser[]): void => {
    LocalStorage.set(AppStorage.KEYS.AVAILABLE_USERS, users)
  },

  // Get available users list
  getAvailableUsers: (): IUser[] => {
    return LocalStorage.get<IUser[]>(AppStorage.KEYS.AVAILABLE_USERS, [])
  },

  // Store app preferences
  setAppPreferences: (preferences: Record<string, any>): void => {
    LocalStorage.set(AppStorage.KEYS.APP_PREFERENCES, preferences)
  },

  // Get app preferences
  getAppPreferences: (): Record<string, any> => {
    return LocalStorage.get<Record<string, any>>(AppStorage.KEYS.APP_PREFERENCES, {})
  },

  // Store voting history
  setVotingHistory: (history: any[]): void => {
    LocalStorage.set(AppStorage.KEYS.VOTING_HISTORY, history)
  },

  // Get voting history
  getVotingHistory: (): any[] => {
    return LocalStorage.get<any[]>(AppStorage.KEYS.VOTING_HISTORY, [])
  },

  // Clear all app data
  clearAppData: (): void => {
    LocalStorage.remove(AppStorage.KEYS.AVAILABLE_USERS)
    LocalStorage.remove(AppStorage.KEYS.APP_PREFERENCES)
    LocalStorage.remove(AppStorage.KEYS.VOTING_HISTORY)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all storage (cookies, localStorage, sessionStorage)
 */
export const clearAllStorage = (): void => {
  AuthStorage.clearAuthData()
  AppStorage.clearAppData()
  
  // Clear all localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  
  // Clear all sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
}

/**
 * Check if storage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
  } catch (error) {
    return false
  }
}

/**
 * Get storage size information
 */
export const getStorageInfo = (): {
  localStorage: { used: number; available: number }
  sessionStorage: { used: number; available: number }
  cookies: { count: number }
} => {
  const localStorageUsed = typeof localStorage !== 'undefined' 
    ? JSON.stringify(localStorage).length 
    : 0
    
  const sessionStorageUsed = typeof sessionStorage !== 'undefined' 
    ? JSON.stringify(sessionStorage).length 
    : 0
    
  const cookieCount = Object.keys(Cookies.getAll()).length

  return {
    localStorage: {
      used: localStorageUsed,
      available: 5 * 1024 * 1024 - localStorageUsed // 5MB limit
    },
    sessionStorage: {
      used: sessionStorageUsed,
      available: 5 * 1024 * 1024 - sessionStorageUsed // 5MB limit
    },
    cookies: {
      count: cookieCount
    }
  }
}
