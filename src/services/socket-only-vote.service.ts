/**
 * Socket-Only Vote Service
 * Pure Socket.IO implementation for vote operations
 * Replaces all API-based vote mutations
 */

import { useQuery } from '@tanstack/vue-query'
import { webSocketService } from './websocket.service'
import { useSocketVoteStore } from '@/stores/socket-vote.store'
import type {
  VotingStatusResponse,
  VotingStatsResponse
} from '@/types/api'
import { queryKeys } from '@/types/api'

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

/**
 * Socket-only vote status hook
 * Uses Socket.IO for real-time vote status
 */
export function useSocketVoteStatus(topicId: string) {
  const socketVoteStore = useSocketVoteStore()

  return useQuery({
    queryKey: queryKeys.votes.status(topicId),
    queryFn: async (): Promise<VotingStatusResponse> => {
      // Get initial data from socket store
      const topicState = socketVoteStore.getTopicState(topicId)

      if (topicState) {
        // Convert socket store data to API format
        const options = Array.from(topicState.options.values()).map(option => ({
          _id: option.optionId,
          title: '', // This would need to be populated from options data
          link: '',
          image: '',
          voteCount: option.voteCount,
          hasUserVoted: option.hasUserVoted,
          createdAt: option.lastUpdate.toISOString(),
          lastVoteTime: option.lastUpdate.toISOString()
        }))

        return {
          success: true,
          message: 'Vote status retrieved via Socket.IO',
          timestamp: new Date().toISOString(),
          data: {
            user_status: {
              userId: '', // Would be populated from auth
              topicId,
              votedOptions: topicState.userVoteStatus.votedOptions,
              totalVotes: topicState.userVoteStatus.totalVotes,
              lastVoteTime: topicState.userVoteStatus.lastVoteTime
            },
            options
          }
        }
      }

      // Fallback: request via Socket.IO
      try {
        const response = await webSocketService.getVoteStatus(topicId)
        return {
          success: true,
          message: 'Vote status retrieved via Socket.IO',
          timestamp: new Date().toISOString(),
          data: {
            user_status: {
              userId: response.user_id,
              topicId: response.topic_id,
              votedOptions: response.votedOptions,
              totalVotes: response.totalVotes,
              lastVoteTime: response.lastVoteTime
            },
            options: [] // Would be populated from options service
          }
        }
      } catch (error) {
        throw new Error('Failed to get vote status via Socket.IO')
      }
    },
    enabled: !!topicId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })
}

/**
 * Socket-only voting stats hook
 * Uses Socket.IO for real-time voting statistics
 */
export function useSocketVotingStats(topicId: string) {
  return useQuery({
    queryKey: queryKeys.votes.stats(topicId),
    queryFn: async (): Promise<VotingStatsResponse> => {
      // This would be implemented via Socket.IO
      // For now, return mock data
      return {
        success: true,
        message: 'Voting stats retrieved via Socket.IO',
        timestamp: new Date().toISOString(),
        data: {
          topic_id: topicId,
          total_votes: 0,
          total_participants: 0,
          active_users: 0,
          voting_rate: 0,
          time_remaining: null
        }
      }
    },
    enabled: !!topicId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })
}

/**
 * Socket-only option voters hook
 * Uses Socket.IO for real-time voter information
 */
export function useSocketOptionVoters(optionId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.votes.voters(optionId),
    queryFn: async (): Promise<VotersResponse> => {
      // This would be implemented via Socket.IO
      // For now, return mock data
      return {
        success: true,
        message: 'Voters retrieved via Socket.IO',
        timestamp: new Date().toISOString(),
        data: {
          voters: [],
          totalVotes: 0
        }
      }
    },
    enabled: enabled && !!optionId,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })
}

/**
 * Socket-only vote operations
 * All vote operations are handled via Socket.IO
 */
export class SocketOnlyVoteService {
  private socketVoteStore = useSocketVoteStore()

  /**
   * Cast vote via Socket.IO
   */
  async vote(optionId: string, topicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await webSocketService.castVote(topicId, optionId, 'vote')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vote failed'
      }
    }
  }

  /**
   * Unvote via Socket.IO
   */
  async unvote(optionId: string, topicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await webSocketService.castVote(topicId, optionId, 'unvote')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unvote failed'
      }
    }
  }

  /**
   * Toggle vote via Socket.IO
   */
  async toggleVote(optionId: string, topicId: string, hasVoted: boolean): Promise<{ success: boolean; error?: string }> {
    return hasVoted ? await this.unvote(optionId, topicId) : await this.vote(optionId, topicId)
  }

  /**
   * Get vote status via Socket.IO
   */
  async getVoteStatus(topicId: string) {
    try {
      return await webSocketService.getVoteStatus(topicId)
    } catch (error) {
      throw new Error('Failed to get vote status via Socket.IO')
    }
  }

  /**
   * Get option voters via Socket.IO
   */
  async getOptionVoters(): Promise<VotersResponse> {
    // This would be implemented via Socket.IO
    // For now, return mock data
    return {
      success: true,
      message: 'Voters retrieved via Socket.IO',
      timestamp: new Date().toISOString(),
      data: {
        voters: [],
        totalVotes: 0
      }
    }
  }

  /**
   * Check if user has voted for an option
   */
  hasUserVoted(optionId: string, topicId: string): boolean {
    const topicState = this.socketVoteStore.getTopicState(topicId)
    const optionState = topicState?.options.get(optionId)
    return optionState?.hasUserVoted ?? false
  }

  /**
   * Get vote count for an option
   */
  getVoteCount(optionId: string, topicId: string): number {
    const topicState = this.socketVoteStore.getTopicState(topicId)
    const optionState = topicState?.options.get(optionId)
    return optionState?.voteCount ?? 0
  }

  /**
   * Get user's total votes for a topic
   */
  getUserTotalVotes(topicId: string): number {
    const topicState = this.socketVoteStore.getTopicState(topicId)
    return topicState?.userVoteStatus.totalVotes ?? 0
  }

  /**
   * Get user's voted options for a topic
   */
  getUserVotedOptions(topicId: string): string[] {
    const topicState = this.socketVoteStore.getTopicState(topicId)
    return topicState?.userVoteStatus.votedOptions ?? []
  }
}

// Export singleton instance
export const socketOnlyVoteService = new SocketOnlyVoteService()

// Export hooks for backward compatibility
export const useVoteStatus = useSocketVoteStatus
export const useVotingStats = useSocketVotingStats
export const useOptionVoters = useSocketOptionVoters
