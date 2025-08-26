import api from '@/core/api'
import { useQuery } from '@tanstack/vue-query'
import type { 
  VotingStatsResponse,
  VotingStatusResponse
} from '@/types/api'
import { queryKeys } from '@/types/api'

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

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
 * Get voting status for a topic
 */
export function useVotingStatus(topicId: string) {
  return useQuery({
    queryKey: queryKeys.votes.status(topicId),
    queryFn: () => getVotingStatus(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 30, // 30 seconds (short for real-time updates)
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Get voting statistics for a topic
 */
export async function getVotingStats(topicId: string): Promise<VotingStatsResponse> {
  try {
    console.log(`Getting voting stats for topic: ${topicId}`)
    
    const response = await api.get<VotingStatsResponse>(`/api/vote/stats/${topicId}`)
    
    console.log(`Voting stats retrieved for topic ${topicId}:`, {
      totalVotes: response.data.data.total_votes,
      totalParticipants: response.data.data.total_participants,
      votingRate: response.data.data.voting_rate
    })

    return response.data
  } catch (error) {
    console.error(`Failed to get voting stats for topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Get voting status for a topic
 */
export async function getVotingStatus(topicId: string): Promise<VotingStatusResponse> {
  try {
    console.log(`Getting voting status for topic: ${topicId}`)
    
    const response = await api.get<VotingStatusResponse>(`/api/vote/status/${topicId}`)
    
    console.log(`Voting status retrieved for topic ${topicId}:`, {
      totalVotes: response.data.data.total_votes,
      votedOptions: response.data.data.voted_options.length
    })

    return response.data
  } catch (error) {
    console.error(`Failed to get voting status for topic ${topicId}:`, error)
    throw error
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useVotingStats,
  useVotingStatus,
  
  // API service functions
  getVotingStats,
  getVotingStatus,
}
