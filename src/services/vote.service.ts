import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { IUser } from '@/core/interfaces/model/user'
import {
  type VotingStatusResponse,
  type VotingStatsResponse,
  queryKeys
} from '@/types/api'

/**
 * Voters response interface
 */
export interface VotersResponse {
  success: boolean
  message: string
  timestamp: string
  data: {
    voters: Array<{
      userId: string
      username: string
      email: string
      votedAt: string
    }>
    totalVotes: number
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request payload for vote/unvote operations
 */
export interface VoteRequest {
  topicId: string
  optionId: string
}

/**
 * Response from vote/unvote operations
 */
export interface VoteResponse {
  success: boolean
  message: string
  data: {
    optionId: string
    topicId: string
    voteCount: number
    userHasVoted: boolean
  }
  timestamp: string
}

/**
 * Individual option voting status
 */
export interface OptionVoteStatus {
  optionId: string
  voteCount: number
  userHasVoted: boolean
  voters: IUser[]
}

/**
 * Error response structure
 */
export interface VoteErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
  voteCount?: number
  userHasVoted?: boolean
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Get voting status for a topic
 */
export function useVoteStatus(topicId: string) {
  return useQuery({
    queryKey: queryKeys.votes.status(topicId),
    queryFn: () => getVoteStatus(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 30, // 30 seconds (short for real-time updates)
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Get voting statistics for a topic
 */
export function useVotingStats(topicId: string) {
  return useQuery({
    queryKey: queryKeys.votes.stats(topicId),
    queryFn: () => getVotingStats(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 3, // 3 minutes
  })
}

/**
 * TanStack Query hook for getting option voters (lazy loading)
 */
export function useOptionVoters(optionId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.votes.voters(optionId),
    queryFn: () => getOptionVoters(optionId),
    enabled: !!optionId && enabled,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  })
}

/**
 * Vote for an option
 */
export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ optionId, topicId }: { optionId: string; topicId: string }) =>
      vote(optionId, topicId),
    onSuccess: (_, { topicId }) => {
      // Invalidate vote-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.stats(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
    },
    onError: (error) => {
      console.error('Failed to vote:', error)
    },
  })
}

/**
 * Unvote an option
 */
export function useUnvote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ optionId, topicId }: { optionId: string; topicId: string }) =>
      unvote(optionId, topicId),
    onSuccess: (_, { topicId }) => {
      // Invalidate vote-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.stats(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
    },
    onError: (error) => {
      console.error('Failed to unvote:', error)
    },
  })
}

/**
 * Toggle vote for an option
 */
export function useToggleVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ optionId, topicId }: { optionId: string; topicId: string }) =>
      toggleVote(optionId, topicId),
    onSuccess: (_, { topicId }) => {
      // Invalidate vote-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.stats(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
    },
    onError: (error) => {
      console.error('Failed to toggle vote:', error)
    },
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Vote for a specific option within a topic
 */
export async function vote(optionId: string, topicId: string): Promise<VoteResponse> {
  try {
    const response = await api.post<VoteResponse>(`/api/options/${optionId}/vote`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

/**
 * Remove vote from a specific option within a topic
 */
export async function unvote(optionId: string, topicId: string): Promise<VoteResponse> {
  try {
    const response = await api.delete<VoteResponse>(`/api/options/${optionId}/vote`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get the current user's voting status for all options in a topic
 */
export async function getVoteStatus(topicId: string): Promise<VotingStatusResponse> {
  try {
    const response = await api.get<VotingStatusResponse>(`/api/vote/status/${topicId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get voting statistics for a topic
 */
export async function getVotingStats(topicId: string): Promise<VotingStatsResponse> {
  try {
    const response = await api.get<VotingStatsResponse>(`/api/vote/stats/${topicId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Get voters for a specific option
 */
export async function getOptionVoters(optionId: string): Promise<VotersResponse> {
  try {
    const response = await api.get<VotersResponse>(`/api/vote/voters/${optionId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Toggle vote for an option (vote if not voted, unvote if already voted)
 */
export async function toggleVote(optionId: string, topicId: string): Promise<VoteResponse> {
  try {
    const result = await vote(optionId, topicId)
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Check if the current user has voted for a specific option
 */
export async function hasUserVoted(optionId: string, topicId: string): Promise<boolean> {
  try {
    const voteStatus = await getVoteStatus(topicId)
    const option = voteStatus.data.options.find(opt => opt._id === optionId)
    return option?.hasUserVoted || false
  } catch (error) {
    throw error
  }
}

// ============================================================================
// LEGACY SERVICE OBJECT (for backward compatibility)
// ============================================================================

const voteService = {
  vote,
  unvote,
  getVoteStatus,
  getVotingStats,
  getOptionVoters,
  toggleVote,
  hasUserVoted
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useVoteStatus,
  useVotingStats,
  useOptionVoters,
  useVote,
  useUnvote,
  useToggleVote,

  // Legacy service object
  ...voteService
}
