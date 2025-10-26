import { defineStore } from 'pinia'
import { EUserRole } from '@/core/constants/enum'
import { getCookieRaw, setCookieRaw, deleteCookieRaw, CookieKeys } from '@/core/utils/cookieUtils'
import type { IUser } from '@/core/interfaces/model/user'

// Simple cookie utilities for store use - using type-safe CookieKeys
const cookieUtils = {
  get: (key: keyof typeof CookieKeys): string | null => getCookieRaw(CookieKeys[key]),
  set: (key: keyof typeof CookieKeys, value: string, days = 7): void =>
    setCookieRaw(CookieKeys[key], value, days),
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
  state: () => {
    return { ...initState }
  },

  getters: {
    // Enhanced authentication check
    checkAuthenticated: (state): boolean => {
      return state.isAuthenticated && !!state.accessToken
    },

    // Check if token is valid (not expired)
    isTokenValid: (state): boolean => {
      if (!state.accessToken) return false

      try {
        // Decode token to check expiration
        const payload = JSON.parse(atob(state.accessToken.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        return payload.exp > currentTime
      } catch (error) {
        console.warn('Failed to validate token:', error)
        return false
      }
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
    setAuthData(authData: { accessToken: string; refreshToken?: string; user: IUser }): void {
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
    },

    /**
     * Set access token and persist to cookies
     */
    setToken(accessToken: string): void {
      this.accessToken = accessToken
      this.isAuthenticated = true

      // Update token in cookies
      cookieUtils.set('ACCESS_TOKEN', accessToken)
    },

    /**
     * Set refresh token and persist to cookies
     */
    setRefreshToken(refreshToken: string): void {
      this.refreshToken = refreshToken

      // Update refresh token in cookies
      cookieUtils.set('REFRESH_TOKEN', refreshToken)
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
    },

    /**
     * Set user data and persist to cookies
     */
    setUser(user: IUser): void {
      this.user = user
      this.role = user.role

      // Update user data in cookies
      cookieUtils.setJSON('USER_DATA', user)
    },

    /**
     * Update access token (for token refresh)
     */
    updateAccessToken(accessToken: string): void {
      this.accessToken = accessToken
      cookieUtils.set('ACCESS_TOKEN', accessToken)
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
    },

    /**
     * Initialize from storage - simplified version
     */
    initializeFromStorage(): void {
      try {
        
        // Use the same cookie reading method as useCookie hook
        const accessToken = cookieUtils.get('ACCESS_TOKEN')
        const refreshToken = cookieUtils.get('REFRESH_TOKEN')
        
        // For user data, read raw and parse manually to match useCookie behavior
        const userDataRaw = cookieUtils.get('USER_DATA')
        let user: IUser | null = null
        
        if (userDataRaw) {
          try {
            user = JSON.parse(userDataRaw) as IUser
          } catch (parseError) {
            console.error('Failed to parse user data from cookie:', parseError)
          }
        }


        // Validate auth data
        if (!accessToken || !user || !user.id || !user.email || !user.username) {
          this.clearToken()
          return
        }

        // Set auth data
        this.accessToken = accessToken
        this.refreshToken = refreshToken || null
        this.user = user
        this.role = user.role
        this.isAuthenticated = true

      } catch (error) {
        console.error('❌ Failed to hydrate auth store:', error)
        this.clearToken()
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
          return false
        }

        // Import auth service dynamically to avoid circular dependency
        const authService = await import('@/services/auth.service')
        const response = await authService.default.refreshToken()

        if (response.data && response.data.accessToken) {
          this.updateAccessToken(response.data.accessToken)
          if (response.data.refreshToken) {
            this.setRefreshToken(response.data.refreshToken)
          }
          return true
        } else {
          this.clearToken()
          return false
        }
      } catch (error) {
        console.error('Failed to refresh authentication:', error)
        this.clearToken()
        return false
      }
    }
  }
})
