import { defineStore } from 'pinia'
import { io, Socket } from 'socket.io-client'
import { logger } from '@/core/utils/logger'
import { useQueryClient } from '@tanstack/vue-query'
import type { IOption } from '@/core/interfaces/model/option'

interface ISocketState {
  socket: Socket | null
  connected: boolean
  currentTopic: string | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectDelay: number
  isReconnecting: boolean
}

export interface VoteUpdateData {
  topic_id: string
  option_id: string
  count: number
  user_id: string
  username: string
  action: 'vote' | 'unvote'
}

export interface NewOptionData {
  option: IOption
}

export interface TopicUpdateData {
  topicId: string
  updates: any
}

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000'

export const useSocketStore = defineStore('socket', {
  state: (): ISocketState => ({
    socket: null,
    connected: false,
    currentTopic: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    isReconnecting: false
  }),

  getters: {
    // Check if socket is connected
    isConnected: (state): boolean => state.connected,

    // Check if currently in a topic
    isInTopic: (state): boolean => !!state.currentTopic,

    // Get current topic ID
    getCurrentTopic: (state): string | null => state.currentTopic,

    // Check if reconnecting
    isReconnecting: (state): boolean => state.isReconnecting,

    // Get connection status
    connectionStatus: (state): 'connected' | 'disconnected' | 'reconnecting' | 'error' => {
      if (state.connected) return 'connected'
      if (state.isReconnecting) return 'reconnecting'
      if (state.reconnectAttempts >= state.maxReconnectAttempts) return 'error'
      return 'disconnected'
    }
  },

  actions: {
    /**
     * Connect to socket server
     */
    connect() {
      if (this.socket && this.connected) {
        logger.socket.debug('Socket already connected')
        return
      }

      try {
        logger.socket.info('Connecting to socket server...')

        this.socket = io(URL, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 10000
        })

        this.setupEventListeners()

        logger.socket.info('Socket connection initiated')
      } catch (error) {
        logger.socket.error('Failed to connect to socket:', error)
      }
    },

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
      if (!this.socket) return

      // Connection events
      this.socket.on('connect', () => {
        this.connected = true
        this.reconnectAttempts = 0
        this.isReconnecting = false
        logger.socket.info('Socket connected successfully')
      })

      this.socket.on('disconnect', (reason) => {
        this.connected = false
        this.currentTopic = null
        logger.socket.warn('Socket disconnected:', reason)
      })

      this.socket.on('connect_error', (error) => {
        this.connected = false
        this.isReconnecting = true
        this.reconnectAttempts++
        logger.socket.error('Socket connection error:', error)
      })

      this.socket.on('reconnect', (attemptNumber) => {
        this.connected = true
        this.isReconnecting = false
        this.reconnectAttempts = 0
        logger.socket.info('Socket reconnected after', attemptNumber, 'attempts')
      })

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        this.isReconnecting = true
        logger.socket.debug('Reconnection attempt:', attemptNumber)
      })

      this.socket.on('reconnect_error', (error) => {
        logger.socket.error('Reconnection error:', error)
      })

      this.socket.on('reconnect_failed', () => {
        this.isReconnecting = false
        logger.socket.error('Failed to reconnect after maximum attempts')
      })

      // Application events
      this.setupApplicationListeners()
    },

    /**
     * Setup application-specific event listeners
     */
    setupApplicationListeners() {
      if (!this.socket) return

      // Listen for new options
      this.socket.on('new_option', (data: NewOptionData) => {
        logger.socket.debug('New option received:', data)
        this.handleNewOption(data)
      })

      // Listen for vote updates
      this.socket.on('vote_option', (data: VoteUpdateData) => {
        logger.socket.debug('Vote update received:', data)
        this.handleVoteUpdate(data)
      })

      // Listen for topic updates
      this.socket.on('topic_updated', (data: TopicUpdateData) => {
        logger.socket.debug('Topic updated:', data)
        this.handleTopicUpdate(data)
      })

      // Listen for user updates
      this.socket.on('user_updated', (data: any) => {
        logger.socket.debug('User updated:', data)
        this.handleUserUpdate(data)
      })
    },

    /**
     * Handle new option event
     */
    handleNewOption(data: NewOptionData) {
      try {
        const queryClient = useQueryClient()

        // Invalidate options queries for the topic
        if (data.option.topicId) {
          queryClient.invalidateQueries({
            queryKey: ['options', 'topic', data.option.topicId]
          })
        }

        logger.socket.debug('Invalidated options queries for topic:', data.option.topicId)
      } catch (error) {
        logger.socket.error('Failed to handle new option:', error)
      }
    },

    /**
     * Handle vote update event
     */
    handleVoteUpdate(data: VoteUpdateData) {
      try {
        const queryClient = useQueryClient()

        // Invalidate voting-related queries
        queryClient.invalidateQueries({
          queryKey: ['options', 'topic', data.topic_id]
        })
        queryClient.invalidateQueries({
          queryKey: ['voting-stats', data.topic_id]
        })
        queryClient.invalidateQueries({
          queryKey: ['votes', 'status', data.topic_id]
        })

        logger.socket.debug('Invalidated voting queries for topic:', data.topic_id)
      } catch (error) {
        logger.socket.error('Failed to handle vote update:', error)
      }
    },

    /**
     * Handle topic update event
     */
    handleTopicUpdate(data: TopicUpdateData) {
      try {
        const queryClient = useQueryClient()

        // Invalidate topic queries
        queryClient.invalidateQueries({
          queryKey: ['topics', 'detail', data.topicId]
        })
        queryClient.invalidateQueries({
          queryKey: ['topics', 'list']
        })

        logger.socket.debug('Invalidated topic queries for:', data.topicId)
      } catch (error) {
        logger.socket.error('Failed to handle topic update:', error)
      }
    },

    /**
     * Handle user update event
     */
    handleUserUpdate(data: any) {
      try {
        const queryClient = useQueryClient()

        // Invalidate user queries
        queryClient.invalidateQueries({
          queryKey: ['users', 'list']
        })
        queryClient.invalidateQueries({
          queryKey: ['users', 'detail', data.userId]
        })

        logger.socket.debug('Invalidated user queries for:', data.userId)
      } catch (error) {
        logger.socket.error('Failed to handle user update:', error)
      }
    },

    /**
     * Disconnect from socket server
     */
    disconnect() {
      if (this.socket) {
        logger.socket.info('Disconnecting from socket server...')

        this.socket.disconnect()
        this.socket = null
        this.connected = false
        this.currentTopic = null
        this.reconnectAttempts = 0
        this.isReconnecting = false

        logger.socket.info('Socket disconnected')
      }
    },

    /**
     * Join a topic room
     */
    joinTopic(topicId: string) {
      if (!this.socket || !this.connected) {
        logger.socket.warn('Cannot join topic: socket not connected')
        return
      }

      try {
        this.socket.emit('join_topic', { topicId })
        this.currentTopic = topicId
        logger.socket.info('Joined topic:', topicId)
      } catch (error) {
        logger.socket.error('Failed to join topic:', error)
      }
    },

    /**
     * Leave current topic room
     */
    leaveTopic() {
      if (!this.socket || !this.connected || !this.currentTopic) {
        logger.socket.warn('Cannot leave topic: not in any topic')
        return
      }

      try {
        this.socket.emit('leave_topic', { topicId: this.currentTopic })
        logger.socket.info('Left topic:', this.currentTopic)
        this.currentTopic = null
      } catch (error) {
        logger.socket.error('Failed to leave topic:', error)
      }
    },

    /**
     * Emit custom event
     */
    emit(event: string, data?: any) {
      if (!this.socket || !this.connected) {
        logger.socket.warn('Cannot emit event: socket not connected')
        return false
      }

      try {
        this.socket.emit(event, data)
        logger.socket.debug('Emitted event:', event, data)
        return true
      } catch (error) {
        logger.socket.error('Failed to emit event:', error)
        return false
      }
    },

    /**
     * Listen to custom event
     */
    on(event: string, callback: (data: any) => void) {
      if (!this.socket) {
        logger.socket.warn('Cannot listen to event: socket not initialized')
        return
      }

      this.socket.on(event, callback)
      logger.socket.debug('Listening to event:', event)
    },

    /**
     * Remove event listener
     */
    off(event: string, callback?: (data: any) => void) {
      if (!this.socket) return

      this.socket.off(event, callback)
      logger.socket.debug('Removed listener for event:', event)
    },

    /**
     * Reset socket state
     */
    reset() {
      this.disconnect()
      this.reconnectAttempts = 0
      this.isReconnecting = false
      logger.socket.debug('Socket state reset')
    }
  }
})
