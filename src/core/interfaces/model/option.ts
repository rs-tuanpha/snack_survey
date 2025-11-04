import type { Option } from '@/types/api'

// Unified Option interface based on backend API structure
export interface IOption {
  _id: string
  title: string
  topicId: string
  voteCount: number
  hasUserVoted?: boolean // ✅ New field for user vote status
  createdBy: string
  createdAt: string
  updatedAt: string
  // Additional fields for frontend use
  link?: string
  image?: string
}

// Adapter function to convert from API Option to IOption
export function adaptApiOptionToIOption(apiOption: Option): IOption {
  return {
    _id: apiOption._id,
    title: apiOption.title,
    topicId: apiOption.topicId,
    link: apiOption.link,
    image: apiOption.image,
    voteCount: apiOption.voteCount || 0, // ✅ Use direct voteCount field
    hasUserVoted: false, // ✅ Use hasUserVoted field
    createdBy: apiOption.createdBy,
    createdAt: apiOption.createdAt,
    updatedAt: apiOption.updatedAt,
  }
}
