import { io, Socket } from 'socket.io-client'
import { networkOptimizer } from './network-optimizer.service'
// import type { IUser } from '@/core/interfaces/model/user'
import type { IOption } from '@/core/interfaces/model/option'
import type { VoteUpdateData } from '@/stores/socket'

/**
 * WebSocket Service for Snack Survey Application
 * Centralized Socket.io client management with TypeScript type safety
 *
 * Features:
 * - Type-safe event handling
 * - Automatic reconnection
 * - Topic room management
 * - Vote operations
 * - Error handling
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * WebSocket Event Types
 */
export interface WebSocketEvents {
  // Client → Server Events
  'topic:join': TopicJoinPayload
  'topic:switch': TopicSwitchPayload
  'vote:cast': VoteCastPayload
  'vote:status': VoteStatusPayload

  // Server → Client Events
  'topic:joined': TopicJoinedResponse
  'topic:switched': TopicSwitchedResponse
  'vote:update': VoteUpdateResponse
  'vote:status_response': VoteStatusResponse
  'error:vote': VoteErrorResponse
  'error:topic': TopicErrorResponse
}

/**
 * Client → Server Event Payloads
 */
export interface TopicJoinPayload {
  topicId: string
  userId: string
  username: string
}

export interface TopicSwitchPayload {
  fromTopicId: string
  toTopicId: string
  userId: string
  username: string
}

export interface VoteCastPayload {
  topicId: string
  optionId: string
  userId: string
  username: string
  action: 'vote' | 'unvote'
}

export interface VoteStatusPayload {
  topicId: string
  userId: string
}

/**
 * Server → Client Event Responses
 */
export interface TopicJoinedResponse {
  topicId: string
  userCount: number
  topicData: {
    id: string
    title: string
    description?: string
    isActive: boolean
    voteType: 'single' | 'multiple'
    startDate: string
    endDate: string
  }
  options: IOption[]
  userVoteStatus: {
    votedOptions: string[]
    totalVotes: number
    lastVoteTime?: string
  }
}

export interface TopicSwitchedResponse {
  fromTopicId: string
  toTopicId: string
  userCount: number
  topicData: TopicJoinedResponse['topicData']
  options: IOption[]
  userVoteStatus: TopicJoinedResponse['userVoteStatus']
}

export interface VoteUpdateResponse {
  topicId: string
  optionId: string
  voteCount: number
  action: 'vote' | 'unvote'
  userId: string
  username: string
  timestamp: string
  userVoteStatus: {
    votedOptions: string[]
    totalVotes: number
  }
}

export interface VoteStatusResponse {
  topic_id: string
  user_id: string
  votedOptions: string[]
  totalVotes: number
  lastVoteTime: string | null
  voting_stats: {
    total_participants: number
    total_votes: number
    voting_rate: number
  }
  timestamp: string
}

export interface VoteErrorResponse {
  message: string
  code: string
  topicId: string
  optionId?: string
  timestamp: string
}

export interface TopicErrorResponse {
  message: string
  code: string
  topicId: string
  timestamp: string
}

/**
 * WebSocket Connection State
 */
export interface WebSocketState {
  connected: boolean
  currentTopicId: string | null
  userId: string | null
  username: string | null
  reconnectAttempts: number
  lastError: string | null
}

/**
 * Event Handler Types
 */
export type VoteUpdateHandler = (data: VoteUpdateResponse) => void
export type TopicJoinedHandler = (data: TopicJoinedResponse) => void
export type TopicSwitchedHandler = (data: TopicSwitchedResponse) => void
export type VoteStatusHandler = (data: VoteStatusResponse) => void
export type VoteErrorHandler = (data: VoteErrorResponse) => void
export type TopicErrorHandler = (data: TopicErrorResponse) => void
export type ConnectionHandler = (connected: boolean) => void
export type ErrorHandler = (error: Error) => void

// ============================================================================
// WEBSOCKET SERVICE CLASS
// ============================================================================

export class WebSocketService {
  private socket: Socket | null = null
  private state: WebSocketState = {
    connected: false,
    currentTopicId: null,
    userId: null,
    username: null,
    reconnectAttempts: 0,
    lastError: null
  }

  private eventHandlers: Map<string, Function[]> = new Map()
  private reconnectTimer: NodeJS.Timeout | null = null
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private voteQueue: VoteCastPayload[] = [] // Queue for offline votes
  private isOffline = false
  private connectionHealthCheck: NodeJS.Timeout | null = null

  // Server configuration
  private readonly serverUrl: string
  private readonly namespace = '/topics'

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || this.getDefaultServerUrl()
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string, username: string): Promise<void> {
    if (this.socket?.connected) {
      return
    }

    this.state.userId = userId
    this.state.username = username

    try {
      this.socket = io(`${this.serverUrl}${this.namespace}`, {
        auth: {
          userId,
          username
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })

      this.setupEventListeners()

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket!.on('connect', () => {
          clearTimeout(timeout)
          this.state.connected = true
          this.state.reconnectAttempts = 0
          this.state.lastError = null
          this.isOffline = false
          this.emit('connection', true)
          this.startHealthCheck()
          // Process any queued votes
          this.processQueuedVotes()
          resolve()
        })

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHealthCheck()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.state = {
      connected: false,
      currentTopicId: null,
      userId: this.state.userId,
      username: this.state.username,
      reconnectAttempts: 0,
      lastError: null
    }

    this.isOffline = true
    this.emit('connection', false)
    }

  /**
   * Get current connection state
   */
  getState(): Readonly<WebSocketState> {
    return { ...this.state }
  }

  // ============================================================================
  // TOPIC MANAGEMENT
  // ============================================================================

  /**
   * Join a topic room
   */
  async joinTopic(topicId: string): Promise<TopicJoinedResponse> {
    if (this.socket === null || !this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    if (!this.state.userId || !this.state.username) {
      throw new Error('User not authenticated')
    }

    const payload: TopicJoinPayload = {
      topicId,
      userId: this.state.userId,
      username: this.state.username
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join topic timeout'))
      }, 10000)

      if (this.socket === null) {
        reject(new Error('WebSocket not connected'))
        return
      }

      // Listen for the response
      const handleJoined = (data: TopicJoinedResponse) => {
        if (data.topicId === topicId) {
          clearTimeout(timeout)
          this.socket!.off('topic:joined', handleJoined)
          this.socket!.off('error:topic', handleError)

          this.state.currentTopicId = topicId
          resolve(data)
        }
      }

      const handleError = (error: TopicErrorResponse) => {
        if (error.topicId === topicId) {
          clearTimeout(timeout)
          this.socket!.off('topic:joined', handleJoined)
          this.socket!.off('error:topic', handleError)
          reject(new Error(error.message))
        }
      }

      this.socket.on('topic:joined', handleJoined)
      this.socket.on('error:topic', handleError)

      // Emit join request
      this.socket.emit('topic:join', payload)
    })
  }

  /**
   * Switch from one topic to another
   */
  async switchTopic(fromTopicId: string, toTopicId: string): Promise<TopicSwitchedResponse> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    if (!this.state.userId || !this.state.username) {
      throw new Error('User not authenticated')
    }

    const payload: TopicSwitchPayload = {
      fromTopicId,
      toTopicId,
      userId: this.state.userId,
      username: this.state.username
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Switch topic timeout'))
      }, 10000)

      if (this.socket === null) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const handleSwitched = (data: TopicSwitchedResponse) => {
        if (data.toTopicId === toTopicId) {
          clearTimeout(timeout)
          this.socket!.off('topic:switched', handleSwitched)
          this.socket!.off('error:topic', handleError)

          this.state.currentTopicId = toTopicId
          resolve(data)
        }
      }

      const handleError = (error: TopicErrorResponse) => {
        if (error.topicId === toTopicId) {
          clearTimeout(timeout)
          this.socket!.off('topic:switched', handleSwitched)
          this.socket!.off('error:topic', handleError)
          reject(new Error(error.message))
        }
      }

      this.socket.on('topic:switched', handleSwitched)
      this.socket.on('error:topic', handleError)

      this.socket.emit('topic:switch', payload)
    })
  }

  /**
   * Leave current topic
   */
  leaveTopic(): void {
    if (this.socket?.connected && this.state.currentTopicId) {
      this.socket.emit('topic:leave', {
        topicId: this.state.currentTopicId,
        userId: this.state.userId,
        username: this.state.username
      })
      this.state.currentTopicId = null
    }
  }

  // ============================================================================
  // VOTE OPERATIONS
  // ============================================================================

  /**
   * Cast a vote for an option with enhanced retry logic and network optimization
   */
  async castVote(topicId: string, optionId: string, action: 'vote' | 'unvote'): Promise<VoteUpdateResponse> {
    if (!this.state.userId || !this.state.username) {
      throw new Error('User not authenticated')
    }

    const payload: VoteCastPayload = {
      topicId,
      optionId,
      userId: this.state.userId,
      username: this.state.username,
      action
    }

    // If offline, queue the vote
    if (this.isOffline || !this.socket?.connected) {
      this.queueVote(payload)
      throw new Error('Vote queued - will be sent when connection is restored')
    }

    try {
      // Use network optimizer for better performance
      return await networkOptimizer.sendWithRetry('vote:cast', payload)
    } catch (error) {
      // Fallback to direct send
      return this.castVoteDirect(topicId, optionId, action)
    }
  }

  /**
   * Direct vote cast (fallback method)
   */
  private async castVoteDirect(topicId: string, optionId: string, action: 'vote' | 'unvote'): Promise<VoteUpdateResponse> {
    const payload: VoteCastPayload = {
      topicId,
      optionId,
      userId: this.state.userId!,
      username: this.state.username!,
      action
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Vote cast timeout'))
      }, 10000)

      if (this.socket === null) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const handleUpdate = (data: VoteUpdateResponse) => {
        if (data.topicId === topicId && data.optionId === optionId) {
          clearTimeout(timeout)
          this.socket!.off('vote:update', handleUpdate)
          this.socket!.off('error:vote', handleError)
          resolve(data)
        }
      }

      const handleError = (error: VoteErrorResponse) => {
        if (error.topicId === topicId && error.optionId === optionId) {
          clearTimeout(timeout)
          this.socket!.off('vote:update', handleUpdate)
          this.socket!.off('error:vote', handleError)
          reject(new Error(error.message))
        }
      }

      this.socket.on('vote:update', handleUpdate)
      this.socket.on('error:vote', handleError)

      this.socket.emit('vote:cast', payload)
    })
  }

  /**
   * Get current vote status for a topic
   */
  async getVoteStatus(topicId: string): Promise<VoteStatusResponse> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    if (!this.state.userId) {
      throw new Error('User not authenticated')
    }

    const payload: VoteStatusPayload = {
      topicId,
      userId: this.state.userId
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Vote status timeout'))
      }, 10000)
      if (this.socket === null) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const handleResponse = (data: VoteStatusResponse) => {
        if (data.topic_id === topicId) {
          clearTimeout(timeout)
          this.socket!.off('vote:status_response', handleResponse)
          this.socket!.off('error:vote', handleError)
          resolve(data)
        }
      }

      const handleError = (error: VoteErrorResponse) => {
        if (error.topicId === topicId) {
          clearTimeout(timeout)
          this.socket!.off('vote:status_response', handleResponse)
          this.socket!.off('error:vote', handleError)
          reject(new Error(error.message))
        }
      }

      this.socket.on('vote:status_response', handleResponse)
      this.socket.on('error:vote', handleError)

      this.socket.emit('vote:status', payload)
    })
  }

  // ============================================================================
  // EVENT SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to vote update events
   */
  subscribeVoteUpdates(handler: VoteUpdateHandler): () => void {
    return this.subscribe('vote:update', handler)
  }

  /**
   * Subscribe to vote status updates (for real-time vote status changes)
   */
  subscribeVoteStatusUpdates(handler: (data: VoteStatusResponse) => void): () => void {
    return this.subscribe('vote:status_response', handler)
  }

  /**
   * Subscribe to vote option updates (for real-time vote counts)
   */
  subscribeVoteOptionUpdates(handler: (data: VoteUpdateData) => void): () => void {
    return this.subscribe('vote_option', handler)
  }

  /**
   * Subscribe to topic joined events
   */
  subscribeTopicJoined(handler: TopicJoinedHandler): () => void {
    return this.subscribe('topic:joined', handler)
  }

  /**
   * Subscribe to topic switched events
   */
  subscribeTopicSwitched(handler: TopicSwitchedHandler): () => void {
    return this.subscribe('topic:switched', handler)
  }

  /**
   * Subscribe to vote status events
   */
  subscribeVoteStatus(handler: VoteStatusHandler): () => void {
    return this.subscribe('vote:status_response', handler)
  }

  /**
   * Subscribe to vote error events
   */
  subscribeVoteErrors(handler: VoteErrorHandler): () => void {
    return this.subscribe('error:vote', handler)
  }

  /**
   * Subscribe to topic error events
   */
  subscribeTopicErrors(handler: TopicErrorHandler): () => void {
    return this.subscribe('error:topic', handler)
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeConnection(handler: ConnectionHandler): () => void {
    return this.subscribe('connection', handler)
  }

  /**
   * Subscribe to general errors
   */
  subscribeErrors(handler: ErrorHandler): () => void {
    return this.subscribe('error', handler)
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupEventListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      this.state.connected = true
      this.state.reconnectAttempts = 0
      this.state.lastError = null
      this.emit('connection', true)
    })

    this.socket.on('disconnect', (reason) => {
      this.state.connected = false
      this.emit('connection', false)

      // Attempt reconnection if not intentional
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      this.state.lastError = error.message
      console.error('WebSocket connection error:', error)
      this.emit('error', error)
      this.scheduleReconnect()
    })

    // Forward server events to internal handlers
    this.socket.on('vote:update', (data: VoteUpdateResponse) => {
      this.emit('vote:update', data)
    })

    this.socket.on('topic:joined', (data: TopicJoinedResponse) => {
      this.emit('topic:joined', data)
    })

    this.socket.on('topic:switched', (data: TopicSwitchedResponse) => {
      this.emit('topic:switched', data)
    })

    this.socket.on('vote:status_response', (data: VoteStatusResponse) => {
      this.emit('vote:status_response', data)
    })

    this.socket.on('error:vote', (data: VoteErrorResponse) => {
      this.emit('error:vote', data)
    })

    this.socket.on('error:topic', (data: TopicErrorResponse) => {
      this.emit('error:topic', data)
    })
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.state.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1) // Exponential backoff

    this.reconnectTimer = setTimeout(async () => {
      if (this.state.userId && this.state.username) {
        try {
          await this.connect(this.state.userId, this.state.username)

          // Rejoin topic if we were in one
          if (this.state.currentTopicId) {
            await this.joinTopic(this.state.currentTopicId)
          }
        } catch (error) {
          console.error('Reconnection failed:', error)
        }
      }
    }, delay)
  }

  private subscribe(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }

    this.eventHandlers.get(event)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Queue vote for offline processing
   */
  private queueVote(payload: VoteCastPayload): void {
    this.voteQueue.push(payload)
    }

  /**
   * Process queued votes when connection is restored
   */
  private async processQueuedVotes(): Promise<void> {
    if (this.voteQueue.length === 0) return

    const votesToProcess = [...this.voteQueue]
    this.voteQueue = []

    for (const vote of votesToProcess) {
      try {
        await this.castVote(vote.topicId, vote.optionId, vote.action)
        } catch (error) {
        console.error('Failed to process queued vote:', error)
        // Re-queue failed votes
        this.voteQueue.push(vote)
      }
    }
  }

  /**
   * Start connection health monitoring
   */
  private startHealthCheck(): void {
    if (this.connectionHealthCheck) {
      clearInterval(this.connectionHealthCheck)
    }

    this.connectionHealthCheck = setInterval(() => {
      if (this.socket?.connected) {
        // Send ping to check connection health
        this.socket.emit('ping')
      } else {
        this.isOffline = true
        this.emit('connection', false)
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Stop connection health monitoring
   */
  private stopHealthCheck(): void {
    if (this.connectionHealthCheck) {
      clearInterval(this.connectionHealthCheck)
      this.connectionHealthCheck = null
    }
  }

  /**
   * Get queued votes count
   */
  public getQueuedVotesCount(): number {
    return this.voteQueue.length
  }

  /**
   * Clear queued votes
   */
  public clearQueuedVotes(): void {
    this.voteQueue = []
  }

  /**
   * Check if service is offline
   */
  public isServiceOffline(): boolean {
    return this.isOffline
  }

  private getDefaultServerUrl(): string {
    // Use environment variable or default to localhost
    return process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:8000'
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default WebSocket service instance
 * Use this instance throughout the application
 */
export const webSocketService = new WebSocketService()
