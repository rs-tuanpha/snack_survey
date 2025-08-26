import type { ETopicTeam, EUserRole } from '@/core/constants/enum'

export interface IUser {
  id: string
  username: string
  email: string
  avatar?: string
  team?: ETopicTeam
  role?: EUserRole
}
