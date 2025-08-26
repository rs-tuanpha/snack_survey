import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { IUser } from '@/core/interfaces/model/user'
import type { 
  VotingStatusResponse,
  VotingStatsResponse,
  queryKeys
} from '@/types/api'

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
    console.log(`Voting for option: ${optionId} in topic: ${topicId}`)
    
    const requestData: VoteRequest = {
      topicId,
      optionId
    }
    
    const response = await api.post<VoteResponse>('/vote', requestData)
    
    console.log(`Vote successful for option ${optionId}:`, {
      voteCount: response.data.data.voteCount,
      userHasVoted: response.data.data.userHasVoted
    })

    return response.data
  } catch (error: any) {
    console.error(`Failed to vote for option ${optionId} in topic ${topicId}:`, error)
    
    // Handle specific vote error responses
    if (error.response?.data) {
      const errorData = error.response.data as VoteErrorResponse
      console.error('Vote error details:', {
        message: errorData.message,
        statusCode: errorData.statusCode,
        voteCount: errorData.voteCount,
        userHasVoted: errorData.userHasVoted
      })
    }
    
    throw error
  }
}

/**
 * Remove vote from a specific option within a topic
 */
export async function unvote(optionId: string, topicId: string): Promise<VoteResponse> {
  try {
    console.log(`Removing vote for option: ${optionId} in topic: ${topicId}`)
    
    // The backend automatically handles vote toggle logic
    // Same endpoint as vote(), server determines if it's vote or unvote based on current state
    const result = await vote(optionId, topicId)
    
    console.log(`Unvote successful for option ${optionId}:`, {
      voteCount: result.data.voteCount,
      userHasVoted: result.data.userHasVoted
    })
    
    return result
  } catch (error) {
    console.error(`Failed to unvote option ${optionId} in topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Get the current user's voting status for all options in a topic
 */
export async function getVoteStatus(topicId: string): Promise<VotingStatusResponse> {
  try {
    console.log(`Getting vote status for topic: ${topicId}`)
    
    const response = await api.get<VotingStatusResponse>(`/vote/status/${topicId}`)
    
    console.log(`Vote status retrieved for topic ${topicId}:`, {
      totalVotes: response.data.data.total_votes,
      optionsCount: response.data.data.voted_options.length
    })

    return response.data
  } catch (error) {
    console.error(`Failed to get vote status for topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Get voting statistics for a topic
 */
export async function getVotingStats(topicId: string): Promise<VotingStatsResponse> {
  try {
    console.log(`Getting voting stats for topic: ${topicId}`)
    
    const response = await api.get<VotingStatsResponse>(`/api/vote/stats/${topicId}`)
    
    console.log(`Voting stats retrieved for topic ${topicId}:`, {
      totalVotes: response.data.data.total_votes,
      totalParticipants: response.data.data.total_participants
    })

    return response.data
  } catch (error) {
    console.error(`Failed to get voting stats for topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Toggle vote for an option (vote if not voted, unvote if already voted)
 */
export async function toggleVote(optionId: string, topicId: string): Promise<VoteResponse> {
  try {
    console.log(`Toggling vote for option: ${optionId} in topic: ${topicId}`)
    
    const result = await vote(optionId, topicId)
    
    const action = result.data.userHasVoted ? 'voted' : 'unvoted'
    console.log(`Vote toggle successful - ${action} for option ${optionId}`)
    
    return result
  } catch (error) {
    console.error(`Failed to toggle vote for option ${optionId} in topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Check if the current user has voted for a specific option
 */
export async function hasUserVoted(optionId: string, topicId: string): Promise<boolean> {
  try {
    console.log(`Checking if user has voted for option: ${optionId} in topic: ${topicId}`)
    
    const voteStatus = await getVoteStatus(topicId)
    const option = voteStatus.data.voted_options.find(opt => opt === optionId)
    
    const hasVoted = !!option
    console.log(`User vote status for option ${optionId}: ${hasVoted}`)
    
    return hasVoted
  } catch (error) {
    console.error(`Failed to check vote status for option ${optionId} in topic ${topicId}:`, error)
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
  useVote,
  useUnvote,
  useToggleVote,
  
  // API service functions
  vote,
  unvote,
  getVoteStatus,
  getVotingStats,
  toggleVote,
  hasUserVoted,
  
  // Legacy service object
  ...voteService
}