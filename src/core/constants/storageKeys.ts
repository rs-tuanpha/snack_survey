/**
 * Centralized storage keys for type-safe storage operations
 * This enum provides a single source of truth for all storage keys used across the application
 */

export enum StorageKeys {
  // ============================================================================
  // COOKIE KEYS (Secure, Short-term)
  // ============================================================================
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_DATA = 'user_data',

  // ============================================================================
  // LOCAL STORAGE KEYS (Persistent, Long-term)
  // ============================================================================
  USER = 'user',
  USER_LIST = 'user_list',
  THEME = 'theme',
  LANGUAGE = 'language',
  LAST_TOPIC_ID = 'lastTopicId',
  APP_PREFERENCES = 'app_preferences',
  VOTING_HISTORY = 'voting_history',
  AVAILABLE_USERS = 'available_users',

  // ============================================================================
  // SESSION STORAGE KEYS (Temporary, Session-only)
  // ============================================================================
  CURRENT_SESSION = 'current_session',
  TEMP_FORM_DATA = 'temp_form_data',
  NAVIGATION_STATE = 'navigation_state'
}

/**
 * Type for storage key values
 */
export type StorageKey = keyof typeof StorageKeys

/**
 * Storage type mapping for type safety
 */
export interface StorageTypeMap {
  [StorageKeys.ACCESS_TOKEN]: string
  [StorageKeys.REFRESH_TOKEN]: string
  [StorageKeys.USER_DATA]: any
  [StorageKeys.USER]: any
  [StorageKeys.USER_LIST]: any[]
  [StorageKeys.THEME]: 'light' | 'dark' | 'auto'
  [StorageKeys.LANGUAGE]: 'vi' | 'en'
  [StorageKeys.LAST_TOPIC_ID]: string
  [StorageKeys.APP_PREFERENCES]: Record<string, any>
  [StorageKeys.VOTING_HISTORY]: any[]
  [StorageKeys.AVAILABLE_USERS]: any[]
  [StorageKeys.CURRENT_SESSION]: any
  [StorageKeys.TEMP_FORM_DATA]: any
  [StorageKeys.NAVIGATION_STATE]: any
}

/**
 * Storage location mapping
 */
export enum StorageLocation {
  COOKIE = 'cookie',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage'
}

/**
 * Get storage location for a given key
 */
export function getStorageLocation(key: StorageKeys): StorageLocation {
  const cookieKeys = [
    StorageKeys.ACCESS_TOKEN,
    StorageKeys.REFRESH_TOKEN,
    StorageKeys.USER_DATA
  ]

  const sessionStorageKeys = [
    StorageKeys.CURRENT_SESSION,
    StorageKeys.TEMP_FORM_DATA,
    StorageKeys.NAVIGATION_STATE
  ]

  if (cookieKeys.includes(key)) {
    return StorageLocation.COOKIE
  }

  if (sessionStorageKeys.includes(key)) {
    return StorageLocation.SESSION_STORAGE
  }

  return StorageLocation.LOCAL_STORAGE
}
