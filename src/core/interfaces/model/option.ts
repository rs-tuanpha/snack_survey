import { IAccountVoteDto } from './user'

export interface IOptionModel {
  link: string | null
  name: string
  option_id: number
  topic_id: number
}

export interface IOptionVoteCountDto extends IOptionModel {
  vote_count: number
}

export interface IOptionRealtimeDto {
  link: string | null
  name: string
  option_id: number
  topic_id: number
  voteBy: IAccountVoteDto[]
}
