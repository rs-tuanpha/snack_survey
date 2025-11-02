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
import type { IUser } from '@/core/interfaces/model/user'
import type { EUserRole } from '@/core/constants/enum'
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
    // Use fetch for login to avoid circular dependency with api interceptor
    const response = await fetch(`${process.env.VUE_APP_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Login failed: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }
      
      throw new Error(errorMessage)
    }

    const responseData: ILoginResponse = await response.json()
    
    // Validate response structure
    if (!responseData.success || !responseData.data || !responseData.data.tokens || !responseData.data.user) {
      throw new Error('Invalid response from server')
    }

    return responseData
}

/**
 * Refresh access token - returns new tokens without storing them
 * Storage is handled by the auth store
 */
const refreshToken = async (): Promise<IRefreshTokenResponse> => {
    // Get refresh token from storage
    const refreshTokenValue = useCookie(CookieKeys.REFRESH_TOKEN, '')
    
    if (!refreshTokenValue.exists() || !refreshTokenValue.value) {
      throw new Error('No refresh token available')
    }

    // Remove quotes if present (cookies sometimes wrap values in quotes)
    const cleanRefreshToken = (typeof refreshTokenValue.value === 'string' ? refreshTokenValue.value : String(refreshTokenValue.value))?.replace(/"/g, '') || '';

    const response = await api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/refresh-token', {
      refreshToken: cleanRefreshToken
    })

    // Validate response structure
    if (!response.data || !response.data.accessToken) {
      throw new Error('Invalid refresh token response')
    }

    return response as IRefreshTokenResponse
}

/**
 * Validate token without making API call
 * @param token JWT token to validate
 * @returns Boolean indicating if token is valid
 */
const validateToken = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return false
    }

    // Decode token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    return payload.exp > currentTime
  } catch (error) {
    return false
  }
}

/**
 * Logout user - clears storage
 * This is called by auth store during logout
 */
const logout = (): void => {
  try {
    // Clear auth data from storage
    cookieUtils.remove('ACCESS_TOKEN')
    cookieUtils.remove('REFRESH_TOKEN')
    cookieUtils.remove('USER_DATA')
  } catch (error) {
    console.error('Logout error:', error)
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
  getCurrentUser,
  validateToken
}
