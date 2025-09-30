import api from '@/core/api'
import { getCookieRaw, setCookieRaw, deleteCookieRaw, CookieKeys } from '@/core/utils/cookieUtils'

// Simple cookie utilities for service use - using type-safe CookieKeys
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
  }
}
import { logger } from '@/core/utils/logger'
import type { IUser } from '@/core/interfaces/model/user'
import type { ETopicTeam, EUserRole } from '@/core/constants/enum'
import { useCookie } from '@/core/hooks/useCookie'

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
    user: {
      id: string
      username: string
      email: string
      avatar: string
      role: EUserRole
      team: ETopicTeam
      isFirstLogin: boolean
    }
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
    const refreshTokenValue = useCookie(CookieKeys.REFRESH_TOKEN, '')
    if (!refreshTokenValue.exists()) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/refresh-token', {
      refreshToken: refreshTokenValue.value
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
    cookieUtils.remove('ACCESS_TOKEN')
    cookieUtils.remove('REFRESH_TOKEN')
    cookieUtils.remove('USER_DATA')

    logger.auth.info('Logout complete')
  } catch (error) {
    logger.auth.error('Logout error:', error)
  }
}

/**
 * Get current access token from storage
 */
const getCurrentToken = (): string | null => {
  return cookieUtils.get('ACCESS_TOKEN')
}

/**
 * Check if user is authenticated based on stored data
 */
const isAuthenticated = (): boolean => {
  const accessToken = cookieUtils.get('ACCESS_TOKEN')
  const user = cookieUtils.getJSON('USER_DATA')
  return !!(accessToken && user)
}

/**
 * Get current user data from storage
 */
const getCurrentUser = (): IUser | null => {
  return cookieUtils.getJSON('USER_DATA')
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
