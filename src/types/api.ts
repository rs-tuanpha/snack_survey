/**
 * TypeScript interfaces for API requests and responses
 * Generated from swagger.json documentation
 */

import type { ETopicRequireField, EUserRole } from '@/core/constants/enum'

// Types are now inline to match Swagger schema exactly

// Base response structure
export interface BaseResponse {
  success: boolean
  message: string
  timestamp: string
}

// Topic related types - Updated to match Swagger schema
export interface Topic {
  _id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  voteType: 'single' | 'multiple'
  isActive: boolean
  isMutable: boolean
  optionRequiredField: ETopicRequireField
  createdBy: string
  totalVotes?: number
  totalParticipants?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTopicRequest {
  title: string
  description?: string
  startDate: string
  endDate: string
  voteType: 'single' | 'multiple'
  isActive?: boolean
  isMutable?: boolean
}

export interface UpdateTopicRequest {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  voteType?: 'single' | 'multiple'
  isActive?: boolean
  isMutable?: boolean
}

export interface TopicResponse extends BaseResponse {
  data: Topic
}

export interface TopicListResponse extends BaseResponse {
  data: Topic[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Option related types - Updated to match Swagger schema
export interface Option {
  _id: string
  title: string
  link?: string
  image?: string
  topicId: string
  createdBy: string
  voteCount: number // ✅ New: direct vote count field
  lastVoteTime?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOptionRequest {
  title: string
  link?: string
  image?: string
  topicId: string
}

export interface UpdateOptionRequest {
  title?: string
  link?: string
  image?: string
}

export interface OptionResponse extends BaseResponse {
  data: Option
}

export interface OptionListResponse extends BaseResponse {
  data: Option[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface OptionCreationResponse extends BaseResponse {
  data: Option
}

export interface OptionUpdateResponse extends BaseResponse {
  data: Option
}

export interface OptionDeletionResponse extends BaseResponse {
  data: {
    deletedOptionId: string
  }
}

export interface OptionVoteResponse extends BaseResponse {
  data: {
    optionId: string
    topicId: string
    voteCount: number
    userHasVoted: boolean
  }
}

// User related types - Updated to match Swagger schema
export interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  role: EUserRole
  isActive?: boolean
  isFirstLogin?: boolean
  createdAt: string
  updatedAt: string
}

export interface UserResponse extends BaseResponse {
  data: User
}

export interface UserListResponse extends BaseResponse {
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  avatar?: string
}

export interface UpdateUserRoleRequest {
  role: 'user' | 'admin'
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  avatar?: string
  role?: EUserRole
  isActive?: boolean
}

export interface UpdateUserStatusRequest {
  isActive: boolean
}

export interface AdminResetPasswordRequest {
  newPassword?: string
}

// Authentication types - Updated to match Swagger schema
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  avatar?: string
  role?: EUserRole
}

export interface AuthResponse extends BaseResponse {
  data: {
    user: User
    tokens: {
      accessToken: string
      refreshToken: string
    }
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VoteStatusData {
  options: Array<string>;
}

// Vote related types - Updated to match new Backend API
export interface VotingStatusResponse extends BaseResponse {
  data: VoteStatusData
}

export interface VotingStatsResponse extends BaseResponse {
  data: {
    topic_id: string
    total_votes: number
    total_participants: number
    active_users: number
    voting_rate: number
    time_remaining?: number | null
  }
}

// Error types
export interface ErrorResponse extends BaseResponse {
  success: false
  error: string
  details?: any
}

export interface ValidationError extends BaseResponse {
  success: false
  errors: Array<{
    field: string
    messages: string[]
  }>
  path?: string
}

// Query parameter types - Updated to match Swagger schema
export interface TopicListQuery {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  startDateFrom?: string
  startDateTo?: string
  sort_by?: 'createdAt' | 'title' | 'startDate' | 'endDate'
  sort_order?: 'asc' | 'desc'
}

export interface OptionListQuery {
  page?: number
  limit?: number
  search?: string
  sort_by?: 'createdAt' | 'title' | 'vote_count'
  sort_order?: 'asc' | 'desc'
}

// TanStack Query Keys for type safety
export const queryKeys = {
  topics: {
    all: ['topics'] as const,
    lists: () => [...queryKeys.topics.all, 'list'] as const,
    list: (params: TopicListQuery) => [...queryKeys.topics.lists(), params] as const,
    details: () => [...queryKeys.topics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.topics.details(), id] as const,
    open: () => [...queryKeys.topics.all, 'open'] as const,
    closed: () => [...queryKeys.topics.all, 'closed'] as const,
  },
  options: {
    all: ['options'] as const,
    lists: () => [...queryKeys.options.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.options.lists(), filters] as const,
    byTopic: (topicId: string) => [...queryKeys.options.all, 'topic', topicId] as const,
    rank: (topicId: string) => [...queryKeys.options.all, 'rank', topicId] as const,
    details: () => [...queryKeys.options.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.options.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },
  votes: {
    all: ['votes'] as const,
    status: (topicId: string) => [...queryKeys.votes.all, 'status', topicId] as const,
    stats: (topicId: string) => [...queryKeys.votes.all, 'stats', topicId] as const,
    voters: (optionId: string) => [...queryKeys.votes.all, 'voters', optionId] as const,
  },
} as const
