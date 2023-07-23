import type { ETopicRequireField, ETopicTeam } from '@/core/constants/enum'
import type { IUser } from './user'

export interface ITopic {
  id: string
  name: string
  description?: string
  date?: Date
  status?: boolean | null | string
  link?: boolean | null
  requireField?: `${ETopicRequireField}`
  option?: boolean | null
  team?: `${ETopicTeam}`
  voteBy?: IUser[]
  updatedAt?: Date
}
