import api from '@/core/api'
import { useQuery } from '@tanstack/vue-query'
import type {
  VotingStatsResponse,
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

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Get voting statistics for a topic
 */
export async function getVotingStats(topicId: string): Promise<VotingStatsResponse> {
  const response = await api.get<VotingStatsResponse>(`/api/vote/stats/${topicId}`)
  return response.data
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useVotingStats,

  // API service functions
  getVotingStats,
}
