import { ETopicRequireField, type ETopicTeam, type ETopicVoteType } from '@/core/constants/enum'
import type { IUser } from './user'

export interface ITopicModel {
  _id: string
  title: string
  description?: string
  start_date: Date
  end_date: Date
  vote_type: ETopicVoteType
  option_required_field: ETopicRequireField
  is_mutable: boolean
  is_active: boolean
  team: ETopicTeam
  created_by: string
  updatedAt: Date
}

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

export function adaptTopicModelToTopic(model: ITopicModel): ITopic {
  return {
    id: model._id,
    name: model.title,
    description: model.description,
    date: model.start_date,
    status: model.is_active ? 'active' : 'inactive',
    link: model.option_required_field === ETopicRequireField.LINK,
    requireField: model.option_required_field,
    option: model.is_mutable,
    team: model.team,
    voteBy: [], // Assuming voteBy is not directly mapped from ITopicModel
    updatedAt: model.updatedAt
  }
}
