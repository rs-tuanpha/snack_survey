import type { IUser } from './user'

export interface IOption {
  id: string
  title: string
  link: string
  voteBy: IUser[]
}
