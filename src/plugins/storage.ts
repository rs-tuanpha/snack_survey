/**
 * Storage Plugin for Vue 3
 * Handles storage initialization and hydration on app startup
 */

import type { App } from 'vue'
import { nextTick } from 'vue'
import { logger } from '@/core/utils/logger'
import { useAuthStore } from '@/stores/auth'
import { CookieKeys } from '@/core/utils/cookieUtils'
import { useUserStore } from '@/stores/user'
// StorageManager functionality moved to hooks
// This plugin is now simplified

/**
 * Hydrate auth store from cookies
 */
async function hydrateAuthStore() {
  try {
    logger.storage.info('Starting auth store hydration...')

    // Initialize auth store
    const authStore = useAuthStore()
    const userStore = useUserStore()

    // Use direct cookie utilities instead of useCookie hook (since we're not in a component)
    const { getCookieRaw } = await import('@/core/utils/cookieUtils')

    // Check for existing auth data in cookies
    const accessToken = getCookieRaw(CookieKeys.ACCESS_TOKEN)
    const refreshToken = getCookieRaw(CookieKeys.REFRESH_TOKEN)
    const userDataRaw = getCookieRaw(CookieKeys.USER_DATA)

    // Parse user data if exists
    let userData = null
    if (userDataRaw) {
      try {
        userData = JSON.parse(userDataRaw)
      } catch (error) {
        logger.storage.warn('Failed to parse user data from cookie:', error)
      }
    }

    // Check if we have valid auth data
    const hasAccessToken = accessToken && accessToken !== ''
    const hasUserData = userData && userData !== null

    if (hasAccessToken && hasUserData) {
      // Hydrate auth store with existing data
      authStore.setAuthData({
        accessToken,
        refreshToken: refreshToken || undefined,
        user: userData
      })

      userStore.setUser(userData)

      logger.storage.info('Auth store hydrated successfully from cookies', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData,
        userId: userData?.id
      })
    } else {
      // No valid auth data found, ensure store is in clean state
      authStore.clearToken()
      logger.storage.info('No valid auth data found, auth store cleared')
    }

    return true
  } catch (error) {
    logger.storage.error('Failed to hydrate auth store:', error)
    return false
  }
}

export interface StoragePluginOptions {
  /** Whether to automatically hydrate stores on app initialization */
  autoHydrate?: boolean
  /** Whether to enable storage debugging */
  debug?: boolean
  /** Custom hydration callback */
  onHydrationComplete?: () => void
  /** Custom hydration error callback */
  onHydrationError?: (error: Error) => void
}

/**
 * Storage plugin installation function
 */
export function installStoragePlugin(app: App, options: StoragePluginOptions = {}) {
  const {
    autoHydrate = true,
    debug = false,
    onHydrationComplete,
    onHydrationError
  } = options

  // Enable debug logging if requested
  if (debug) {
    logger.storage.info('Storage plugin debug mode enabled')
  }

  // Initialize storage manager
  app.config.globalProperties.$storage = {
    // Storage functionality moved to hooks
    isAvailable: () => typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined',
    getInfo: () => ({ localStorage: {}, sessionStorage: {}, cookies: {} }),
    clear: () => {
      localStorage.clear()
      sessionStorage.clear()
    }
  }

  // Auto-hydrate stores if enabled
  if (autoHydrate) {
    // Use nextTick to ensure all plugins are loaded
    nextTick(async () => {
      try {
        logger.storage.info('Starting automatic storage hydration...')

        // Hydrate auth store from cookies
        const authHydrated = await hydrateAuthStore()

        if (authHydrated) {
          logger.storage.info('Storage hydration completed successfully')
          onHydrationComplete?.()
        } else {
          throw new Error('Auth store hydration failed')
        }
      } catch (error) {
        logger.storage.error('Storage hydration failed:', error)
        onHydrationError?.(error as Error)
      }
    })
  }

  // Provide storage utilities to all components
  app.provide('storage', {
    // Storage functionality moved to hooks
    isAvailable: () => typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined',
    getInfo: () => ({ localStorage: {}, sessionStorage: {}, cookies: {} }),
    clear: () => {
      localStorage.clear()
      sessionStorage.clear()
    }
  })

  logger.storage.info('Storage plugin installed successfully')
}

/**
 * Default storage plugin options
 */
export const defaultStorageOptions: StoragePluginOptions = {
  autoHydrate: true,
  debug: process.env.NODE_ENV === 'development',
  onHydrationComplete: () => {
    logger.storage.info('Storage hydration completed')
  },
  onHydrationError: (error: Error) => {
    logger.storage.error('Storage hydration failed:', error)
  }
}

/**
 * Create storage plugin with default options
 */
export function createStoragePlugin(options?: Partial<StoragePluginOptions>) {
  return {
    install: (app: App) => {
      installStoragePlugin(app, { ...defaultStorageOptions, ...options })
    }
  }
}

// Export for use in main.ts
export default {
  install: installStoragePlugin
}
