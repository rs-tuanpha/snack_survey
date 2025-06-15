import { collection, doc, getDoc } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'
import api from './axios.service'

interface LoginResponse {
  token: string
  isFirstLogin: boolean
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

/**
 * get all account document in fb
 * @return { Promise<IUser[]>}
 */
export const getAccounts = useCollection<IUser>(collection(db, 'accounts'))

export const getAccountList = async (): Promise<IUser[]> => {
  try {
    const res = await api.get<IUser[]>('/api/users')
    return res
  } catch {
    alert('An Error occure when fetching data!')
    return []
  }
}
