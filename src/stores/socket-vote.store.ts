/**
 * Socket Vote Store
 * Real-time state management for vote operations using Socket.IO
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { webSocketService } from '@/services/websocket.service'
import type { VoteUpdateResponse, VoteStatusResponse } from '@/services/websocket.service'

/**
 * Vote update data structure
 */
interface VoteUpdate {
  id: string
  topicId: string
  optionId: string
  voteCount: number
  action: 'vote' | 'unvote'
  userId: string
  username: string
  timestamp: string
}

/**
 * Vote state for an option
 */
interface OptionVoteState {
  optionId: string
  voteCount: number
  hasUserVoted: boolean
  lastUpdate: Date
  pendingVotes: Set<string> // User IDs with pending votes
}

/**
 * Topic vote state
 */
interface TopicVoteState {
  topicId: string
  options: Map<string, OptionVoteState>
  userVoteStatus: {
    votedOptions: string[]
    totalVotes: number
    lastVoteTime: string | null
  }
  lastSync: Date
}

/**
 * Socket Vote Store
 */
export const useSocketVoteStore = defineStore('socketVote', () => {
  // State
  const topics = ref<Map<string, TopicVoteState>>(new Map())
  const voteUpdates = ref<VoteUpdate[]>([])
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const lastError = ref<string | null>(null)

  // Getters
  const getTopicState = computed(() => (topicId: string) => {
    return topics.value.get(topicId)
  })

  const getOptionState = computed(() => (topicId: string, optionId: string) => {
    const topic = topics.value.get(topicId)
    return topic?.options.get(optionId)
  })

  const getRecentUpdates = computed(() => (limit: number = 10) => {
    return voteUpdates.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  })

  const getConnectionStatus = computed(() => ({
    isConnected: isConnected.value,
    isReconnecting: isReconnecting.value,
    lastError: lastError.value
  }))

  // Actions
  const initializeTopic = (topicId: string, initialData?: {
    options: Array<{ id: string; voteCount: number; hasUserVoted: boolean }>
    userVoteStatus: { votedOptions: string[]; totalVotes: number; lastVoteTime: string | null }
  }) => {
    const topicState: TopicVoteState = {
      topicId,
      options: new Map(),
      userVoteStatus: {
        votedOptions: [],
        totalVotes: 0,
        lastVoteTime: null
      },
      lastSync: new Date()
    }

    if (initialData) {
      // Initialize with provided data
      initialData.options.forEach(option => {
        topicState.options.set(option.id, {
          optionId: option.id,
          voteCount: option.voteCount,
          hasUserVoted: option.hasUserVoted,
          lastUpdate: new Date(),
          pendingVotes: new Set()
        })
      })

      topicState.userVoteStatus = initialData.userVoteStatus
    }

    topics.value.set(topicId, topicState)
  }

  const updateOptionVoteCount = (
    topicId: string,
    optionId: string,
    voteCount: number,
    hasUserVoted: boolean
  ) => {
    const topic = topics.value.get(topicId)
    if (!topic) return

    const optionState = topic.options.get(optionId)
    if (optionState) {
      optionState.voteCount = voteCount
      optionState.hasUserVoted = hasUserVoted
      optionState.lastUpdate = new Date()
    } else {
      // Create new option state
      topic.options.set(optionId, {
        optionId,
        voteCount,
        hasUserVoted,
        lastUpdate: new Date(),
        pendingVotes: new Set()
      })
    }

    topic.lastSync = new Date()
  }

  const addVoteUpdate = (update: VoteUpdate) => {
    voteUpdates.value.push(update)

    // Keep only last 100 updates
    if (voteUpdates.value.length > 100) {
      voteUpdates.value = voteUpdates.value.slice(-100)
    }

    // Update topic state
    updateOptionVoteCount(
      update.topicId,
      update.optionId,
      update.voteCount,
      update.action === 'vote'
    )
  }

  const updateUserVoteStatus = (
    topicId: string,
    userVoteStatus: { votedOptions: string[]; totalVotes: number; lastVoteTime: string | null }
  ) => {
    const topic = topics.value.get(topicId)
    if (!topic) return

    topic.userVoteStatus = userVoteStatus
    topic.lastSync = new Date()
  }

  const addPendingVote = (topicId: string, optionId: string, userId: string) => {
    const topic = topics.value.get(topicId)
    if (!topic) return

    const option = topic.options.get(optionId)
    if (option) {
      option.pendingVotes.add(userId)
    }
  }

  const removePendingVote = (topicId: string, optionId: string, userId: string) => {
    const topic = topics.value.get(topicId)
    if (!topic) return

    const option = topic.options.get(optionId)
    if (option) {
      option.pendingVotes.delete(userId)
    }
  }

  const clearPendingVotes = (topicId: string, optionId: string) => {
    const topic = topics.value.get(topicId)
    if (!topic) return

    const option = topic.options.get(optionId)
    if (option) {
      option.pendingVotes.clear()
    }
  }

  const setConnectionStatus = (connected: boolean, reconnecting: boolean = false, error: string | null = null) => {
    isConnected.value = connected
    isReconnecting.value = reconnecting
    lastError.value = error
  }

  const clearError = () => {
    lastError.value = null
  }

  const clearTopic = (topicId: string) => {
    topics.value.delete(topicId)
  }

  const clearAllTopics = () => {
    topics.value.clear()
  }

  const clearVoteUpdates = () => {
    voteUpdates.value = []
  }

  // Socket event handlers
  const setupSocketListeners = () => {
    // Vote update handler
    const unsubscribeVoteUpdates = webSocketService.subscribeVoteUpdates((data: VoteUpdateResponse) => {
      const update: VoteUpdate = {
        id: `${data.topicId}_${data.optionId}_${Date.now()}`,
        topicId: data.topicId,
        optionId: data.optionId,
        voteCount: data.voteCount,
        action: data.action,
        userId: data.userId,
        username: data.username,
        timestamp: data.timestamp
      }

      addVoteUpdate(update)
    })

    // Vote status handler
    const unsubscribeVoteStatus = webSocketService.subscribeVoteStatusUpdates((data: VoteStatusResponse) => {
      updateUserVoteStatus(data.topic_id, {
        votedOptions: data.votedOptions,
        totalVotes: data.totalVotes,
        lastVoteTime: data.lastVoteTime
      })
    })

    // Connection status handler
    const unsubscribeConnection = webSocketService.subscribeConnection((connected: boolean) => {
      setConnectionStatus(connected, false)
    })

    // Error handler
    const unsubscribeErrors = webSocketService.subscribeErrors((error: Error) => {
      setConnectionStatus(false, true, error.message)
    })

    // Return cleanup function
    return () => {
      unsubscribeVoteUpdates()
      unsubscribeVoteStatus()
      unsubscribeConnection()
      unsubscribeErrors()
    }
  }

  // Auto-setup listeners
  let cleanupListeners: (() => void) | null = null

  const startListening = () => {
    if (cleanupListeners) return
    cleanupListeners = setupSocketListeners()
  }

  const stopListening = () => {
    if (cleanupListeners) {
      cleanupListeners()
      cleanupListeners = null
    }
  }

  // Watch for connection changes
  watch(isConnected, (connected) => {
    if (connected) {
      startListening()
    } else {
      stopListening()
    }
  })

  return {
    // State
    topics: computed(() => topics.value),
    voteUpdates: computed(() => voteUpdates.value),
    isConnected: computed(() => isConnected.value),
    isReconnecting: computed(() => isReconnecting.value),
    lastError: computed(() => lastError.value),

    // Getters
    getTopicState,
    getOptionState,
    getRecentUpdates,
    getConnectionStatus,

    // Actions
    initializeTopic,
    updateOptionVoteCount,
    addVoteUpdate,
    updateUserVoteStatus,
    addPendingVote,
    removePendingVote,
    clearPendingVotes,
    setConnectionStatus,
    clearError,
    clearTopic,
    clearAllTopics,
    clearVoteUpdates,
    startListening,
    stopListening
  }
})
