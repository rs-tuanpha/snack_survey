import { defineStore } from 'pinia'
import { logger } from '@/core/utils/logger'
import { EUserRole } from '@/core/constants/enum'
import { getCookieRaw, setCookieRaw, deleteCookieRaw, CookieKeys } from '@/core/utils/cookieUtils'
import type { IUser } from '@/core/interfaces/model/user'

// Simple cookie utilities for store use - using type-safe CookieKeys
const cookieUtils = {
  get: (key: keyof typeof CookieKeys): string | null => getCookieRaw(CookieKeys[key]),
  set: (key: keyof typeof CookieKeys, value: string, days = 7): void => setCookieRaw(CookieKeys[key], value, days),
  remove: (key: keyof typeof CookieKeys): void => deleteCookieRaw(CookieKeys[key]),
  getJSON: <T>(key: keyof typeof CookieKeys): T | null => {
    const value = getCookieRaw(CookieKeys[key])
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },
  setJSON: (key: keyof typeof CookieKeys, value: any, days = 7): void => {
    setCookieRaw(CookieKeys[key], JSON.stringify(value), days)
  }
}

interface IAuthState {
  isAuthenticated: boolean
  role: EUserRole
  accessToken: string | null
  refreshToken: string | null
  user: IUser | null
}

const initState: IAuthState = {
  isAuthenticated: false,
  role: EUserRole.USER,
  accessToken: null,
  refreshToken: null,
  user: null
}

export const useAuthStore = defineStore('auth', {
  state: (): IAuthState => {
    return { ...initState }
  },

  getters: {
    // Enhanced authentication check
    isAuthenticated: (state): boolean => {
      return state.isAuthenticated && !!state.accessToken
    },

    // Check if user has specific role
    hasRole:
      (state) =>
      (role: EUserRole): boolean => {
        return state.role === role
      },

    // Get current user
    getCurrentUser: (state): IUser | null => {
      return state.user
    },

    // Check if user is admin
    isAdmin: (state): boolean => {
      return state.role === EUserRole.ADMIN
    }
  },

  actions: {
    /**
     * Set authentication data and persist to cookies
     */
    setAuthData(authData: {
      accessToken: string
      refreshToken?: string
      user: IUser
    }): void {
      this.accessToken = authData.accessToken
      this.refreshToken = authData.refreshToken || null
      this.user = authData.user
      this.role = authData.user.role
      this.isAuthenticated = true

      // Persist to cookies
      cookieUtils.set('ACCESS_TOKEN', authData.accessToken)
      if (authData.refreshToken) {
        cookieUtils.set('REFRESH_TOKEN', authData.refreshToken)
      }
      cookieUtils.setJSON('USER_DATA', authData.user)

      logger.auth.debug('Auth data set and persisted to cookies', {
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        userId: this.user?.id,
        role: this.role
      })
    },

    /**
     * Set access token and persist to cookies
     */
    setToken(accessToken: string): void {
      this.accessToken = accessToken
      this.isAuthenticated = true

      // Update token in cookies
      cookieUtils.set('ACCESS_TOKEN', accessToken)

      logger.auth.debug('Token updated and persisted to cookies', this.accessToken)
    },

    /**
     * Set refresh token and persist to cookies
     */
    setRefreshToken(refreshToken: string): void {
      this.refreshToken = refreshToken

      // Update refresh token in cookies
      cookieUtils.set('REFRESH_TOKEN', refreshToken)

      logger.auth.debug('Refresh token updated and persisted to cookies')
    },

    /**
     * Set user role
     */
    setRole(role: EUserRole): void {
      this.role = role

      // Update user data in cookies if user exists
      if (this.user) {
        this.user.role = role
        cookieUtils.setJSON('USER_DATA', this.user)
      }

      logger.auth.debug('Role updated and persisted to cookies', this.role)
    },

    /**
     * Set user data and persist to cookies
     */
    setUser(user: IUser): void {
      this.user = user
      this.role = user.role

      // Update user data in cookies
      cookieUtils.setJSON('USER_DATA', user)

      logger.auth.debug('User data updated and persisted to cookies', user)
    },

    /**
     * Update access token (for token refresh)
     */
    updateAccessToken(accessToken: string): void {
      this.accessToken = accessToken
      cookieUtils.set('ACCESS_TOKEN', accessToken)
      logger.auth.debug('Access token refreshed and persisted')
    },

    /**
     * Clear all authentication data
     */
    clearToken(): void {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.isAuthenticated = false
      this.role = EUserRole.USER

      // Clear from cookies
      cookieUtils.remove('ACCESS_TOKEN')
      cookieUtils.remove('REFRESH_TOKEN')
      cookieUtils.remove('USER_DATA')

      logger.auth.debug('All auth data cleared from store and cookies')
    },

    /**
     * Initialize from storage
     */
    initializeFromStorage(): void {
      try {
        const accessToken = cookieUtils.get('ACCESS_TOKEN')
        const refreshToken = cookieUtils.get('REFRESH_TOKEN')
        const user = cookieUtils.getJSON<IUser>('USER_DATA')

        const authData = accessToken && user ? {
          accessToken,
          refreshToken: refreshToken || undefined,
          user
        } : null

        if (authData && authData.accessToken && authData.user) {
          this.accessToken = authData.accessToken
          this.refreshToken = authData.refreshToken || null
          this.user = authData.user
          this.role = authData.user.role
          this.isAuthenticated = true

          logger.auth.debug('Auth store hydrated from cookies', {
            hasAccessToken: !!this.accessToken,
            hasRefreshToken: !!this.refreshToken,
            userId: this.user?.id,
            role: this.role
          })
        } else {
          logger.auth.debug('No auth data found in cookies')
        }
      } catch (error) {
        logger.auth.error('Failed to hydrate auth store:', error)
      }
    },

    /**
     * Check if user has permission for specific action
     */
    hasPermission(permission: string): boolean {
      // Implement permission logic based on role
      switch (this.role) {
        case EUserRole.ADMIN:
          return true // Admin has all permissions
        case EUserRole.USER:
          return ['read', 'write'].includes(permission)
        default:
          return false
      }
    },

    /**
     * Refresh authentication (call API to refresh token)
     */
    async refreshAuth(): Promise<boolean> {
      try {
        if (!this.refreshToken) {
          logger.auth.warn('No refresh token available')
          return false
        }

        // This would typically call an API to refresh the token
        // For now, we'll just return true if we have a refresh token
        logger.auth.debug('Auth refresh attempted')
        return true
      } catch (error) {
        logger.auth.error('Failed to refresh auth:', error)
        this.clearToken()
        return false
      }
    }
  }
})
