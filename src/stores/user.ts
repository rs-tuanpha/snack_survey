import type { IUser } from '@/core/interfaces/model/user'
import { logger } from '@/core/utils/logger'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

// Simple localStorage utilities for store use
const localStorageUtils = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      logger.error('Failed to set localStorage:', String(error))
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      logger.error('Failed to remove localStorage:', String(error))
    }
  }
}

interface IUserState {
  user: IUser | null
  userList: IUser[]
  availableUsers: IUser[]
  loading: boolean
  lastFetchTime: number | null
}

const initState: IUserState = {
  user: null,
  userList: [],
  availableUsers: [],
  loading: false,
  lastFetchTime: null
}

export const useUserStore = defineStore('user', {
  state: (): IUserState => {
    return { ...initState }
  },

  getters: {
    // Get current user
    getUser: (state): IUser | null => state.user,

    // Get all users
    getAllUsers: (state): IUser[] => state.userList,

    // Get available users
    getAvailableUsers: (state): IUser[] => state.availableUsers,

    // Check if loading
    isLoading: (state): boolean => state.loading,

    // Check if user list is stale (older than 5 minutes)
    isUserListStale: (state): boolean => {
      if (!state.lastFetchTime) return true
      return Date.now() - state.lastFetchTime > 5 * 60 * 1000 // 5 minutes
    }
  },

  actions: {
    /**
     * Set current user
     */
    setUser(user: IUser | null): void {
      this.user = user
      if (user) {
        localStorageUtils.set('user', user)
      } else {
        localStorageUtils.remove('user')
      }
      logger.debug('User set:', user?.id || 'null')
    },

    /**
     * Set user list
     */
    setUserList(users: IUser[]): void {
      this.userList = users
      this.lastFetchTime = Date.now()
      logger.debug('User list set:', users.length.toString())
    },

    /**
     * Set available users
     */
    setAvailableUsers(users: IUser[]): void {
      this.availableUsers = users
      this.lastFetchTime = Date.now()
      localStorageUtils.set('available_users', users)
      logger.debug('Available users set:', users.length.toString())
    },

    /**
     * Add a new user
     */
    addUser(user: IUser): void {
      this.userList.push(user)
      this.availableUsers.push(user)
      logger.debug('User added:', user.id)
    },

    /**
     * Update an existing user
     */
    updateUser(updatedUser: IUser): void {
      // Update in userList
      const userIndex = this.userList.findIndex(u => u.id === updatedUser.id)
      if (userIndex !== -1) {
        this.userList[userIndex] = updatedUser
      }

      // Update in availableUsers
      const availableIndex = this.availableUsers.findIndex(u => u.id === updatedUser.id)
      if (availableIndex !== -1) {
        this.availableUsers[availableIndex] = updatedUser
      }

      // Update current user if it's the same
      if (this.user?.id === updatedUser.id) {
        this.user = updatedUser
        localStorageUtils.set('user', updatedUser)
      }

      logger.debug('User updated:', updatedUser.id)
    },

    /**
     * Remove a user
     */
    removeUser(userId: string): void {
      this.userList = this.userList.filter(u => u.id !== userId)
      this.availableUsers = this.availableUsers.filter(u => u.id !== userId)

      // Clear current user if it's the same
      if (this.user?.id === userId) {
        this.user = null
        localStorageUtils.remove('user')
      }

      logger.debug('User removed:', userId)
    },

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
      this.loading = loading
    },

    /**
     * Clear all users
     */
    clearUsers(): void {
      this.user = null
      this.userList = []
      this.availableUsers = []
      this.lastFetchTime = null
      localStorageUtils.remove('user')
      localStorageUtils.remove('available_users')
      logger.debug('All users cleared', '')
    },

    /**
     * Initialize from storage
     */
    initializeFromStorage(): void {
      try {
        // Priority 1: Get from authStore (đã load từ cookie)
        const authStore = useAuthStore()
        if (authStore.user) {
          this.user = authStore.user
          localStorageUtils.set('user', authStore.user)
          logger.debug('User synced from authStore:', authStore.user.id)
          return
        }

        // Priority 2: Fallback to localStorage
        const userData = localStorageUtils.get<IUser | null>('user', null)
        if (userData) {
          this.user = userData
        }

        const availableUsers = localStorageUtils.get<IUser[]>('available_users', [])
        if (availableUsers.length > 0) {
          this.availableUsers = availableUsers
        }

        logger.debug('User store initialized from storage', '')
      } catch (error) {
        logger.error('Failed to initialize from storage:', String(error))
      }
    }
  }
})
