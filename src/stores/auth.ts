import { defineStore } from 'pinia'
import authService from '@/services/auth.service'
import { getUsersList } from '@/services/user.service'
import { AuthStorage, AppStorage, type AuthData } from '@/core/utils/storage'
import { logger } from '@/core/utils/logger'
import type { IUser } from '@/core/interfaces/model/user'
import type { ILoginPayload } from '@/services/auth.service'
import { ETopicTeam, EUserRole } from '@/core/constants/enum'

interface IAuthState {
  user: IUser | null
  accessToken: string | null
  refreshTokenValue: string | null
  availableUsers: IUser[]
  loadingUsers: boolean
  isInitialized: boolean
}

const initState: IAuthState = {
  user: null,
  accessToken: null,
  refreshTokenValue: null,
  availableUsers: [],
  loadingUsers: false,
  isInitialized: false
}

export const useAuthStore = defineStore('auth', {
  state: (): IAuthState => {
    return { ...initState }
  },
  
  getters: {
    // Enhanced authentication check
    isAuthenticated: (state): boolean => {
      return !!(state.accessToken && state.user)
    },
    
    // Get user display name
    userDisplayName: (state): string => {
      return state.user?.username || state.user?.email || 'Unknown User'
    },
    
    // Check if user has specific role
    hasRole: (state) => (role: string): boolean => {
      return state.user?.role === role
    },
    
    // Backward compatibility getter for refreshToken
    refreshToken: (state): string | null => {
      return state.refreshTokenValue
    }
  },
  
  actions: {
    /**
     * Initialize authentication state from stored data
     * Should be called when app starts
     */
    async initializeAuth(): Promise<void> {
      try {
        logger.auth.debug('Initializing authentication state...')
        
        // Try to restore auth data from cookies
        const authData = AuthStorage.getAuthData()
        
        if (authData && authData.accessToken && authData.user) {
          logger.auth.info('Found stored auth data, restoring state...')
          
          // Restore state from stored data
          this.user = authData.user
          this.accessToken = authData.accessToken
          this.refreshTokenValue = authData.refreshToken || null
          
          logger.auth.info('Authentication state restored successfully')
        } else {
          logger.auth.debug('No stored auth data found')
        }
        
        // Try to restore available users from localStorage
        const storedUsers = AppStorage.getAvailableUsers()
        if (storedUsers.length > 0) {
          this.availableUsers = storedUsers
          logger.auth.info(`Restored ${storedUsers.length} available users`)
        }
        
        this.isInitialized = true
        logger.auth.info('Auth store initialization complete')
        
      } catch (error) {
        logger.auth.error('Failed to initialize auth state:', error)
        this.isInitialized = true // Mark as initialized even if failed
      }
    },

    /**
     * Persist current authentication data to storage
     */
    persistAuthData(): void {
      try {
        if (this.accessToken && this.user) {
          const authData: AuthData = {
            accessToken: this.accessToken,
            refreshToken: this.refreshTokenValue || undefined,
            user: this.user
          }
          
          AuthStorage.setAuthData(authData)
          logger.auth.debug('Auth data persisted to storage')
        }
      } catch (error) {
        logger.auth.error('Failed to persist auth data:', error)
      }
    },

    /**
     * Enhanced login with cookie storage
     */
    async login(payload: ILoginPayload) {
      try {
        logger.auth.debug('Attempting login...')
        const response = await authService.login(payload)
        
        if (response) {
          // Update store state
          this.user = response.data.user
          this.accessToken = response.data.tokens.accessToken
          this.refreshTokenValue = response.data.tokens.refreshToken || null
          
          // Persist to cookies
          this.persistAuthData()
          
          logger.auth.info('Login successful, auth data stored')
        }
        
        return response
      } catch (error) {
        logger.auth.error('Login failed:', error)
        throw error
      }
    },

    /**
     * Enhanced logout with complete cleanup
     */
    logout(): void {
      try {
        logger.auth.debug('Logging out...')
        
        // Call service logout (if needed)
        authService.logout()
        
        // Clear store state
        this.user = null
        this.accessToken = null
        this.refreshTokenValue = null
        
        // Clear all stored auth data
        AuthStorage.clearAuthData()
        
        logger.auth.info('Logout complete, all auth data cleared')
      } catch (error) {
        logger.auth.error('Error during logout:', error)
        // Still clear state even if storage clear fails
        this.user = null
        this.accessToken = null
        this.refreshTokenValue = null
      }
    },

    /**
     * Enhanced token refresh with cookie sync
     */
    async refreshAccessToken() {
      try {
        logger.auth.debug('Refreshing token...')
        const response = await authService.refreshToken()
        
        if (response?.data) {
          // Update store state
          this.accessToken = response.data.accessToken
          if (response.data.refreshToken) {
            this.refreshTokenValue = response.data.refreshToken
          }
          
          // Persist updated tokens to cookies
          this.persistAuthData()
          
          logger.auth.info('Token refreshed successfully')
        }
        
        return response
      } catch (error) {
        logger.auth.error('Failed to refresh token:', error)
        // Logout if refresh fails
        this.logout()
        throw error
      }
    },

    /**
     * Update user data and persist to storage
     */
    updateUserData(user: IUser): void {
      try {
        this.user = user
        this.persistAuthData()
        logger.auth.debug('User data updated and persisted')
      } catch (error) {
        logger.auth.error('Failed to update user data:', error)
      }
    },

    /**
     * Enhanced token management with cookie sync
     */
    setTokens(accessToken: string, refreshToken?: string): void {
      try {
        this.accessToken = accessToken
        this.refreshTokenValue = refreshToken || null
        
        // Persist to cookies
        this.persistAuthData()
        
        logger.auth.debug('Tokens updated and persisted')
      } catch (error) {
        logger.auth.error('Failed to set tokens:', error)
      }
    },

    /**
     * Clear tokens and storage
     */
    clearTokens(): void {
      try {
        this.accessToken = null
        this.refreshTokenValue = null
        
        // Clear from storage
        AuthStorage.clearAuthData()
        
        logger.auth.debug('Tokens cleared')
      } catch (error) {
        logger.auth.error('Failed to clear tokens:', error)
      }
    },

    /**
     * Enhanced available users management with localStorage
     */
    async fetchAvailableUsers(): Promise<IUser[]> {
      try {
        this.loadingUsers = true
        logger.auth.debug('Fetching available users...')
        
        // Use new user service with pagination
        const users = await getUsersList({ page: 1, limit: 100 })
        
        // Convert User[] to IUser[] for compatibility
        const iUsers: IUser[] = users.map(user => ({
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          role: user.role as EUserRole,
          team: user.team as ETopicTeam
        }))
        
        this.availableUsers = iUsers
        
        // Persist to localStorage
        AppStorage.setAvailableUsers(iUsers)
        
        logger.auth.info(`Fetched and stored ${iUsers.length} available users`)
        return iUsers
      } catch (error) {
        logger.auth.error('Failed to fetch users:', error)
        this.availableUsers = []
        throw error
      } finally {
        this.loadingUsers = false
      }
    },

    /**
     * Get available users from storage (without API call)
     */
    getStoredAvailableUsers(): IUser[] {
      try {
        const storedUsers = AppStorage.getAvailableUsers()
        if (storedUsers.length > 0) {
          this.availableUsers = storedUsers
        }
        return this.availableUsers
      } catch (error) {
        console.error('❌ Failed to get stored users:', error)
        return []
      }
    },

    /**
     * Check if user has voted for specific option
     */
    hasUserVoted(): boolean {
      // This would need to be implemented based on your voting logic
      // For now, return false as placeholder
      return false
    },

    /**
     * Get authentication status from storage (without store state)
     */
    getStoredAuthStatus(): boolean {
      return AuthStorage.isAuthenticated()
    },

    /**
     * Force re-initialization of auth state
     */
    async reinitialize(): Promise<void> {
      this.isInitialized = false
      await this.initializeAuth()
    },

    /**
     * Backward compatibility method for refreshToken
     * @deprecated Use refreshAccessToken instead
     */
    async refreshToken() {
      return this.refreshAccessToken()
    }
  }
})
