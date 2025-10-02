import { ETopicRequireField, ETopicTeam, ETopicVoteType } from '@/core/constants/enum'
import type { Topic } from '@/types/api'

// Unified Topic interface based on backend API structure
export interface ITopic {
  _id: string
  title: string
  description?: string
  votingType: ETopicVoteType
  isActive: boolean
  team: ETopicTeam
  createdAt: string | Date
  updatedAt: string | Date
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
export function adaptApiTopicToITopic(apiTopic: Topic): ITopic {
  return {
    _id: apiTopic._id,
    title: apiTopic.title,
    description: apiTopic.description,
    votingType: apiTopic.voteType as ETopicVoteType, // Map voteType to votingType
    isMutable: apiTopic.isMutable,
    isActive: apiTopic.isActive,
    team: apiTopic.team as ETopicTeam,
    createdAt: apiTopic.createdAt ?? "",
    updatedAt: apiTopic.updatedAt,
    startDate: apiTopic.startDate,
    endDate: apiTopic.endDate
  }
}
