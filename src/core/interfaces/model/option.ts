import type { IUser } from './user'

export interface IOption {
  id: string
  title: string
  link: string
  thumbnail?: string | null
  voteBy: IUser[]
  topicId: string
  voteCount: number
}
