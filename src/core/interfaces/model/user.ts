import type { EUserRole } from '@/core/constants/enum'

export interface IUser {
  id: string
  username: string
  email: string
  avatar?: string
  role: EUserRole
}
