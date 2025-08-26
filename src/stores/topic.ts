import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { ITopic } from '@/core/interfaces/model/topic'
import {
  getOpenTopicList,
  getCloseTopicList,
  getTopicById,
  updateTopic as updateTopicService
} from '@/services/topic.service'

// Socket.IO client - will be implemented when WebSocket service is available
interface ISocketClient {
  emit: (event: string, data: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

// Mock socket client for now - replace with actual implementation
const mockSocketClient: ISocketClient = {
  emit: (event: string, data: any) => {
    console.log(`[Socket] Emitting ${event}:`, data)
  },
  on: (event: string) => {
    console.log(`[Socket] Listening to ${event}`)
  },
  off: (event: string) => {
    console.log(`[Socket] Removing listener for ${event}`)
  }
}

// Query keys for Vue Query
export const TOPIC_QUERY_KEYS = {
  all: ['topics'] as const,
  lists: () => [...TOPIC_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TOPIC_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...TOPIC_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TOPIC_QUERY_KEYS.details(), id] as const,
  open: (team: string | null) => [...TOPIC_QUERY_KEYS.lists(), 'open', { team }] as const,
  closed: (team: string | null) => [...TOPIC_QUERY_KEYS.lists(), 'closed', { team }] as const,
}

// Topic store interface
interface ITopicState {
  topics: ITopic[]
  currentTopic: ITopic | null
  socketClient: ISocketClient | null
}

export const useTopicStore = defineStore('topic', () => {
  // State
  const state = ref<ITopicState>({
    topics: [],
    currentTopic: null,
    socketClient: mockSocketClient
  })

  // Query client for cache invalidation
  const queryClient = useQueryClient()

  // Getters
  const topics = computed(() => state.value.topics)
  const currentTopic = computed(() => state.value.currentTopic)
  const openTopics = computed(() => 
    state.value.topics.filter(topic => topic.isActive)
  )
  const closedTopics = computed(() => 
    state.value.topics.filter(topic => !topic.isActive)
  )

  // Vue Query composables for data fetching
  const useTopicsQuery = (team: string | null = null, status: 'open' | 'closed' = 'open') => {
    return useQuery({
      queryKey: status === 'open' 
        ? TOPIC_QUERY_KEYS.open(team)
        : TOPIC_QUERY_KEYS.closed(team),
      queryFn: () => status === 'open' 
        ? getOpenTopicList(team)
        : getCloseTopicList(team),
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes
      onSuccess: (data: ITopic[]) => {
        state.value.topics = data
      },
      onError: (error) => {
        console.error(`Failed to fetch ${status} topics:`, error)
      }
    })
  }

  const useTopicDetailQuery = (id: string) => {
    return useQuery({
      queryKey: TOPIC_QUERY_KEYS.detail(id),
      queryFn: () => getTopicById(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 1, // 1 minute for topic details
      gcTime: 1000 * 60 * 3, // 3 minutes
      onSuccess: (data: ITopic | undefined) => {
        if (data) {
          state.value.currentTopic = data
        }
      },
      onError: (error) => {
        console.error(`Failed to fetch topic ${id}:`, error)
        state.value.currentTopic = null
      }
    })
  }

  // Vue Query mutations for data modification
  const useCreateTopicMutation = () => {
    return useMutation({
      mutationFn: async () => {
        // Note: Firebase doesn't have a direct create method in the current service
        // This would need to be implemented in the topic service
        throw new Error('Create topic not implemented in Firebase service')
      },
      onSuccess: (newTopic: ITopic) => {
        // Invalidate and refetch topics list
        queryClient.invalidateQueries({ queryKey: TOPIC_QUERY_KEYS.lists() })
        
        // Add to local state
        state.value.topics.unshift(newTopic)
        
        console.log('Topic created successfully:', newTopic)
      },
      onError: (error) => {
        console.error('Failed to create topic:', error)
      }
    })
  }

  const useUpdateTopicMutation = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<ITopic> }) => {
        await updateTopicService(id, data as ITopic)
        return { id, ...data } as ITopic
      },
      onSuccess: (updatedTopic: ITopic) => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: TOPIC_QUERY_KEYS.detail(updatedTopic.id) })
        queryClient.invalidateQueries({ queryKey: TOPIC_QUERY_KEYS.lists() })
        
        // Update local state
        const index = state.value.topics.findIndex(t => t.id === updatedTopic.id)
        if (index !== -1) {
          state.value.topics[index] = { ...state.value.topics[index], ...updatedTopic }
        }
        
        if (state.value.currentTopic?.id === updatedTopic.id) {
          state.value.currentTopic = { ...state.value.currentTopic, ...updatedTopic }
        }
        
        console.log('Topic updated successfully:', updatedTopic)
      },
      onError: (error) => {
        console.error('Failed to update topic:', error)
      }
    })
  }

  const useDeleteTopicMutation = () => {
    return useMutation({
      mutationFn: async () => {
        // Note: Firebase service doesn't have delete method
        // This would need to be implemented
        throw new Error('Delete topic not implemented in Firebase service')
      },
      onSuccess: (_, deletedId: string) => {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: TOPIC_QUERY_KEYS.lists() })
        queryClient.removeQueries({ queryKey: TOPIC_QUERY_KEYS.detail(deletedId) })
        
        // Remove from local state
        state.value.topics = state.value.topics.filter(t => t.id !== deletedId)
        
        if (state.value.currentTopic?.id === deletedId) {
          state.value.currentTopic = null
        }
        
        console.log('Topic deleted successfully:', deletedId)
      },
      onError: (error) => {
        console.error('Failed to delete topic:', error)
      }
    })
  }

  // Actions
  const loadTopics = async (team: string | null = null, status: 'open' | 'closed' = 'open') => {
    try {
      const topics = status === 'open' 
        ? await getOpenTopicList(team)
        : await getCloseTopicList(team)
      
      state.value.topics = topics
      return topics
    } catch (error) {
      console.error(`Failed to load ${status} topics:`, error)
      throw error
    }
  }

  const loadTopicDetail = async (id: string) => {
    try {
      const topic = await getTopicById(id)
      if (topic) {
        state.value.currentTopic = topic
      }
      return topic
    } catch (error) {
      console.error(`Failed to load topic ${id}:`, error)
      throw error
    }
  }

  const createTopic = async () => {
    // This would need to be implemented in the Firebase service
    throw new Error('Create topic not implemented in Firebase service')
  }

  const updateTopic = async (id: string, data: Partial<ITopic>) => {
    try {
      await updateTopicService(id, data as ITopic)
      
      // Update local state
      const index = state.value.topics.findIndex(t => t.id === id)
      if (index !== -1) {
        state.value.topics[index] = { ...state.value.topics[index], ...data }
      }
      
      if (state.value.currentTopic?.id === id) {
        state.value.currentTopic = { ...state.value.currentTopic, ...data }
      }
      
      return { id, ...data } as ITopic
    } catch (error) {
      console.error(`Failed to update topic ${id}:`, error)
      throw error
    }
  }

  const deleteTopic = async () => {
    // This would need to be implemented in the Firebase service
    throw new Error('Delete topic not implemented in Firebase service')
  }

  // Socket.IO Integration
  const joinTopic = (id: string, username?: string) => {
    if (state.value.socketClient) {
      state.value.socketClient.emit('join_topic', { topicId: id, username })
      console.log(`Joined topic: ${id}`)
    } else {
      console.warn('Socket client not available')
    }
  }

  const leaveTopic = (id: string) => {
    if (state.value.socketClient) {
      state.value.socketClient.emit('leave_topic', { topicId: id })
      console.log(`Left topic: ${id}`)
    }
  }

  // Set up Socket.IO event listeners
  const setupSocketListeners = () => {
    if (!state.value.socketClient) return

    // Listen for vote events to invalidate queries
    state.value.socketClient.on('vote', (data: any) => {
      console.log('Vote event received:', data)
      
      // Invalidate topic options and voting stats
      if (data.topicId) {
        queryClient.invalidateQueries({ 
          queryKey: ['options', 'topic', data.topicId] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['voting-stats', data.topicId] 
        })
      }
    })

    // Listen for topic updates
    state.value.socketClient.on('topic_updated', (data: any) => {
      console.log('Topic updated event received:', data)
      
      if (data.topicId) {
        queryClient.invalidateQueries({ 
          queryKey: TOPIC_QUERY_KEYS.detail(data.topicId) 
        })
      }
    })

    // Listen for new options
    state.value.socketClient.on('option_created', (data: any) => {
      console.log('Option created event received:', data)
      
      if (data.topicId) {
        queryClient.invalidateQueries({ 
          queryKey: ['options', 'topic', data.topicId] 
        })
      }
    })
  }

  // Clean up Socket.IO listeners
  const cleanupSocketListeners = () => {
    if (!state.value.socketClient) return

    state.value.socketClient.off('vote')
    state.value.socketClient.off('topic_updated')
    state.value.socketClient.off('option_created')
  }

  // Initialize socket client (to be called when actual WebSocket service is available)
  const initializeSocket = (socketClient: ISocketClient) => {
    state.value.socketClient = socketClient
    setupSocketListeners()
  }

  return {
    // State
    topics,
    currentTopic,
    openTopics,
    closedTopics,
    
    // Vue Query composables
    useTopicsQuery,
    useTopicDetailQuery,
    useCreateTopicMutation,
    useUpdateTopicMutation,
    useDeleteTopicMutation,
    
    // Actions
    loadTopics,
    loadTopicDetail,
    createTopic,
    updateTopic,
    deleteTopic,
    
    // Socket.IO methods
    joinTopic,
    leaveTopic,
    initializeSocket,
    setupSocketListeners,
    cleanupSocketListeners
  }
})
