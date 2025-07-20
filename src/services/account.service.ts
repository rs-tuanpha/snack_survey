import type { IUser } from '@/core/interfaces/model/user'
import api from './axios.service'

interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: {
      is_first_login: boolean
    }
    tokens: {
      accessToken: string
      refreshToken: string
    }
  }
}

/**
 * Login with email and password
 * @param email - User's email
 * @param password - User's password
 * @returns Promise<LoginResponse>
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/api/auth/login', { email, password })
    return response as any as LoginResponse
  } catch (error) {
    throw new Error('Login failed. Please check your credentials.')
  }
}

export const getAccountList = async (): Promise<IUser[]> => {
  try {
    const res = await api.get<{ users: IUser[] }>('/api/users?page=1&limit=100')
    return res.users
  } catch {
    alert('An Error occure when fetching data!')
    return []
  }
}
