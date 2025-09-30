/**
 * Socket-based Vote Service
 * Replaces TanStack Query mutations with Socket.IO for real-time voting
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { webSocketService } from './websocket.service'
import { optimisticVoteService } from './optimistic-vote.service'
import { voteCache, userCache, topicCache } from './advanced-cache.service'
import type { VoteUpdateResponse, VoteStatusResponse } from './websocket.service'

/**
 * Vote operation state
 */
interface VoteState {
  isLoading: boolean
  error: string | null
  lastVoteTime: Date | null
  queuedVotes: number
}

/**
 * Vote operation result
 */
interface VoteResult {
  success: boolean
  data?: VoteUpdateResponse
  error?: string
}

/**
 * Socket-based vote hook
 */
export function useSocketVote() {
  const state = ref<VoteState>({
    isLoading: false,
    error: null,
    lastVoteTime: null,
    queuedVotes: 0
  })

  // Watch for queued votes count
  watch(
    () => webSocketService.getQueuedVotesCount(),
    (count) => {
      state.value.queuedVotes = count
    },
    { immediate: true }
  )

  // Watch for offline status
  watch(
    () => webSocketService.isServiceOffline(),
    (isOffline) => {
      if (isOffline) {
        state.value.error = 'Connection lost - votes will be queued'
      } else {
        state.value.error = null
      }
    },
    { immediate: true }
  )

  /**
   * Cast a vote using Socket.IO with caching
   */
  const castVote = async (
    topicId: string,
    optionId: string,
    action: 'vote' | 'unvote'
  ): Promise<VoteResult> => {
    state.value.isLoading = true
    state.value.error = null

    // Check cache first
    const cacheKey = `vote_${topicId}_${optionId}_${action}`
    const cachedResult = voteCache.get(cacheKey)

    if (cachedResult) {
      state.value.isLoading = false
      return cachedResult
    }

    try {
      const result = await webSocketService.castVote(topicId, optionId, action)
      state.value.lastVoteTime = new Date()

      const voteResult = {
        success: true,
        data: result
      }

      // Cache successful result
      voteCache.set(cacheKey, voteResult, 30000) // 30 seconds

      return voteResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      state.value.error = errorMessage

      const errorResult = {
        success: false,
        error: errorMessage
      }

      // Cache error result for shorter time
      voteCache.set(cacheKey, errorResult, 5000) // 5 seconds

      return errorResult
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Toggle vote (vote if not voted, unvote if voted)
   */
  const toggleVote = async (
    topicId: string,
    optionId: string,
    hasUserVoted: boolean
  ): Promise<VoteResult> => {
    const action = hasUserVoted ? 'unvote' : 'vote'
    return await castVote(topicId, optionId, action)
  }

  /**
   * Get vote status for a topic
   */
  const getVoteStatus = async (topicId: string): Promise<VoteStatusResponse | null> => {
    try {
      return await webSocketService.getVoteStatus(topicId)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to get vote status'
      return null
    }
  }

  /**
   * Clear queued votes
   */
  const clearQueuedVotes = (): void => {
    webSocketService.clearQueuedVotes()
    state.value.queuedVotes = 0
  }

  /**
   * Reset error state
   */
  const clearError = (): void => {
    state.value.error = null
  }

  // Computed properties
  const isConnected = computed(() => webSocketService.getState().connected)
  const isOffline = computed(() => webSocketService.isServiceOffline())
  const hasQueuedVotes = computed(() => state.value.queuedVotes > 0)

  return {
    // State
    state: computed(() => state.value),
    isConnected,
    isOffline,
    hasQueuedVotes,

    // Actions
    castVote,
    toggleVote,
    getVoteStatus,
    clearQueuedVotes,
    clearError
  }
}

/**
 * Real-time vote updates hook
 */
export function useSocketVoteUpdates() {
  const voteUpdates = ref<VoteUpdateResponse[]>([])
  const lastUpdate = ref<Date | null>(null)

  let unsubscribe: (() => void) | null = null

  const startListening = () => {
    if (unsubscribe) return

    unsubscribe = webSocketService.subscribeVoteUpdates((data: VoteUpdateResponse) => {
      voteUpdates.value.push(data)
      lastUpdate.value = new Date()

      // Keep only last 50 updates to prevent memory issues
      if (voteUpdates.value.length > 50) {
        voteUpdates.value = voteUpdates.value.slice(-50)
      }
    })
  }

  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const clearUpdates = () => {
    voteUpdates.value = []
    lastUpdate.value = null
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    stopListening()
  })

  return {
    voteUpdates: computed(() => voteUpdates.value),
    lastUpdate: computed(() => lastUpdate.value),
    startListening,
    stopListening,
    clearUpdates
  }
}

/**
 * Connection status hook
 */
export function useSocketConnection() {
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const lastError = ref<string | null>(null)

  let unsubscribeConnection: (() => void) | null = null
  let unsubscribeErrors: (() => void) | null = null

  const startListening = () => {
    if (unsubscribeConnection) return

    unsubscribeConnection = webSocketService.subscribeConnection((connected: boolean) => {
      isConnected.value = connected
      isReconnecting.value = false
    })

    unsubscribeErrors = webSocketService.subscribeErrors((error: Error) => {
      lastError.value = error.message
      isReconnecting.value = true
    })
  }

  const stopListening = () => {
    if (unsubscribeConnection) {
      unsubscribeConnection()
      unsubscribeConnection = null
    }
    if (unsubscribeErrors) {
      unsubscribeErrors()
      unsubscribeErrors = null
    }
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    stopListening()
  })

  return {
    isConnected: computed(() => isConnected.value),
    isReconnecting: computed(() => isReconnecting.value),
    lastError: computed(() => lastError.value),
    startListening,
    stopListening
  }
}

/**
 * Optimistic vote updates hook
 */
export function useOptimisticVote() {
  const optimisticVotes = ref<Map<string, boolean>>(new Map())
  const pendingVotes = ref<Set<string>>(new Set())

  /**
   * Apply optimistic vote update with enhanced conflict resolution
   */
  const applyOptimisticVote = (optionId: string, topicId: string, action: 'vote' | 'unvote') => {
    return optimisticVoteService.applyOptimisticVote(optionId, topicId, action)
  }

  /**
   * Confirm optimistic vote (when server responds)
   */
  const confirmOptimisticVote = (operationId: string) => {
    optimisticVoteService.confirmOptimisticVote(operationId)
  }

  /**
   * Rollback optimistic vote (when server error)
   */
  const rollbackOptimisticVote = (operationId: string) => {
    optimisticVoteService.rollbackOptimisticVote(operationId)
  }

  /**
   * Get optimistic vote state for an option
   */
  const getOptimisticVote = (optionId: string, topicId: string) => {
    return optimisticVoteService.getOptimisticVoteState(optionId, topicId)
  }

  /**
   * Check if option has pending vote
   */
  const hasPendingVote = (optionId: string, topicId: string): boolean => {
    return optimisticVoteService.hasPendingVote(optionId, topicId)
  }

  /**
   * Clear all optimistic votes
   */
  const clearOptimisticVotes = () => {
    optimisticVoteService.clearAllOperations()
  }

  return {
    optimisticVotes: computed(() => optimisticVotes.value),
    pendingVotes: computed(() => pendingVotes.value),
    applyOptimisticVote,
    confirmOptimisticVote,
    rollbackOptimisticVote,
    getOptimisticVote,
    hasPendingVote,
    clearOptimisticVotes
  }
}
