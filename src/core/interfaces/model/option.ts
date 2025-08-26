import type { IUser } from './user'
import type { Option } from '@/types/api'

// Unified Option interface based on backend API structure
export interface IOption {
  id: string
  title: string
  topicId: string
  voteCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  // Additional fields for frontend use
  link?: string
  image?: string
  thumbnail?: string | null
  voteBy?: IUser[]
  userVotes?: Map<string, string>
}

// Legacy interface for backward compatibility - will be removed
export interface IOptionModel extends IOption {
  _id: string
  userVotes: Map<string, string>
  createdAt: string
  updatedAt: string
}

// Adapter function to convert from API Option to IOption
export function adaptApiOptionToIOption(apiOption: Option): IOption {
  return {
    id: apiOption._id,
    title: apiOption.title,
    topicId: apiOption.topicId,
    link: apiOption.link,
    image: apiOption.image,
    voteCount: apiOption.userVotes ? Object.keys(apiOption.userVotes as Record<string, string>).length : 0,
    createdBy: apiOption.createdBy,
    createdAt: apiOption.createdAt,
    updatedAt: apiOption.updatedAt,
    userVotes: new Map(Object.entries(apiOption.userVotes as Record<string, string>)),
    voteBy: [],
  }
}
