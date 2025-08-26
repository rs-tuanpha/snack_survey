import api from '@/core/api'
import { AuthStorage } from '@/core/utils/storage'
import { logger } from '@/core/utils/logger'
import type { IUser } from '@/core/interfaces/model/user'

export interface IRegisterPayload {
  email: string
  password: string
  username: string
}

export interface ILoginPayload {
  email: string
  password: string
}

interface ILoginResponse {
  data: {
    tokens: {
      accessToken: string
      refreshToken: string
    },
    user: IUser
  },
  message: string
  success: boolean
}

interface IRefreshTokenResponse {
  data: {
    accessToken: string
    refreshToken?: string
  }
}

/**
 * Register a new user
 */
const register = (data: IRegisterPayload) => {
  return api.post('/api/auth/register', data)
}

/**
 * Login user - returns auth data without storing it
 * Storage is handled by the auth store
 */
const login = async (data: ILoginPayload): Promise<ILoginResponse> => {
  try {
    logger.auth.debug('Attempting login...')
    
    // Use fetch for login to avoid circular dependency with api interceptor
    const response = await fetch(`${process.env.VUE_APP_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`)
    }
    
    const responseData: ILoginResponse = await response.json()
    logger.auth.info('Login successful')
    
    // Return data without storing - let auth store handle persistence
    return responseData
  } catch (error) {
    logger.auth.error('Login failed:', error)
    throw error
  }
}

/**
 * Refresh access token - returns new tokens without storing them
 * Storage is handled by the auth store
 */
const refreshToken = async (): Promise<IRefreshTokenResponse> => {
  try {
    logger.auth.debug('Refreshing token...')
    
    // Get refresh token from storage
    const refreshTokenValue = AuthStorage.getRefreshToken()
    if (!refreshTokenValue) {
      throw new Error('No refresh token available')
    }
    
    const response = await api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/refresh-token', {
      refreshToken: refreshTokenValue
    })
    
    logger.auth.info('Token refresh successful')
    
    // Return data without storing - let auth store handle persistence
    return response as IRefreshTokenResponse
  } catch (error) {
    logger.auth.error('Token refresh failed:', error)
    throw error
  }
}

/**
 * Logout user - clears storage
 * This is called by auth store during logout
 */
const logout = (): void => {
  try {
    logger.auth.debug('Logging out...')
    
    // Clear auth data from storage
    AuthStorage.clearAuthData()
    
    logger.auth.info('Logout complete')
  } catch (error) {
    logger.auth.error('Logout error:', error)
  }
}

/**
 * Get current access token from storage
 */
const getCurrentToken = (): string | null => {
  return AuthStorage.getAccessToken()
}

/**
 * Check if user is authenticated based on stored data
 */
const isAuthenticated = (): boolean => {
  return AuthStorage.isAuthenticated()
}

/**
 * Get current user data from storage
 */
const getCurrentUser = (): IUser | null => {
  return AuthStorage.getUserData()
}

export default {
  register,
  login,
  refreshToken,
  logout,
  getCurrentToken,
  isAuthenticated,
  getCurrentUser
}
