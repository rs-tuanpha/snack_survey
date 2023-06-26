import type { IUser } from './user'

export interface ITopic {
  id: string
  name: string
  description?: string
  date?: Date
  status?: boolean | null | string
  link?: boolean | null
  option?: boolean | null
  team?: string | null
  voteBy?: IUser[]
}
