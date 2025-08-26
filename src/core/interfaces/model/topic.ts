import { ETopicRequireField, ETopicTeam, ETopicVoteType } from '@/core/constants/enum'
import type { IUser } from './user'

// Unified Topic interface based on backend API structure
export interface ITopic {
  _id: string
  title: string
  description?: string
  votingType: ETopicVoteType
  timeLimit?: number
  isActive: boolean
  team: ETopicTeam
  createdAt: string | Date
  updatedAt: string | Date
  // Additional fields for frontend use
  voteBy?: IUser[]
  optionRequiredField?: ETopicRequireField
  isMutable?: boolean
  startDate?: string | Date
  endDate?: string | Date
}

// Legacy interface for backward compatibility - will be removed
export interface ITopicModel extends ITopic {
  startDate: Date
  endDate: Date
  voteType: ETopicVoteType
  optionRequiredField: ETopicRequireField
  isMutable: boolean
  createdBy: string
  updatedAt: Date
}

// Adapter function to convert from API Topic to ITopic
export function adaptApiTopicToITopic(apiTopic: {
  _id: string
  title: string
  description?: string
  votingType: ETopicVoteType
  timeLimit?: number
  isActive: boolean
  team: ETopicTeam
  createdAt: string
  updatedAt: string
  startDate?: string | Date
  endDate?: string | Date
}): ITopic {
  return {
    _id: apiTopic._id,
    title: apiTopic.title,
    description: apiTopic.description,
    votingType: apiTopic.votingType,
    timeLimit: apiTopic.timeLimit,
    isActive: apiTopic.isActive,
    team: apiTopic.team,
    createdAt: apiTopic.createdAt,
    updatedAt: apiTopic.updatedAt,
    voteBy: [],
    startDate: apiTopic.startDate,
    endDate: apiTopic.endDate
  }
}
