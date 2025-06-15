import type { IUser } from './user'

export interface IOptionModel {
  _id: string
  topic_id: string
  title: string
  link?: string
  image?: string
  created_by: string
  user_votes: Map<string, Date>
  vote_count: number
  createdAt: Date
  updatedAt: Date
}

export interface IOption {
  id: string
  title: string
  link: string
  thumbnail?: string | null
  voteBy: IUser[]
  topicId: string
  voteCount: number
}
