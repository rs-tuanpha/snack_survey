/**
 * Connection Manager Service
 * Manages WebSocket connection state, reconnection, and offline handling
 */

import { ref, computed, watch } from 'vue'
import { webSocketService } from './websocket.service'

/**
 * Connection state
 */
interface ConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  lastConnected: Date | null
  lastDisconnected: Date | null
  connectionDuration: number
  totalDisconnections: number
}

/**
 * Connection health metrics
 */
interface ConnectionHealth {
  uptime: number
  downtime: number
  averageConnectionTime: number
  connectionStability: number
  lastError: string | null
}

/**
 * Connection Manager Service
 */
export class ConnectionManager {
  private state = ref<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastConnected: null,
    lastDisconnected: null,
    connectionDuration: 0,
    totalDisconnections: 0
  })

  private health = ref<ConnectionHealth>({
    uptime: 0,
    downtime: 0,
    averageConnectionTime: 0,
    connectionStability: 0,
    lastError: null
  })

  private connectionStartTime: Date | null = null
  private disconnectionStartTime: Date | null = null
  private connectionTimes: number[] = []
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupConnectionMonitoring()
  }

  /**
   * Get current connection state
   */
  get connectionState() {
    return computed(() => this.state.value)
  }

  /**
   * Get connection health
   */
  get connectionHealth() {
    return computed(() => this.health.value)
  }

  /**
   * Check if connection is stable
   */
  get isStable() {
    return computed(() => {
      const state = this.state.value
      return state.isConnected &&
             !state.isReconnecting &&
             state.connectionDuration > 30000 // 30 seconds
    })
  }

  /**
   * Get connection quality score (0-100)
   */
  get connectionQuality() {
    return computed(() => {
      const health = this.health.value
      const stability = health.connectionStability
      const uptime = health.uptime

      // Calculate quality based on stability and uptime
      const stabilityScore = Math.min(stability * 100, 100)
      const uptimeScore = Math.min((uptime / (uptime + health.downtime)) * 100, 100)

      return Math.round((stabilityScore + uptimeScore) / 2)
    })
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring() {
    // Monitor WebSocket service state
    watch(
      () => webSocketService.getState().connected,
      (connected) => {
        this.handleConnectionChange(connected)
      },
      { immediate: true }
    )

    // Start health check
    this.startHealthCheck()
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionChange(connected: boolean) {
    const now = new Date()
    const state = this.state.value

    if (connected && !state.isConnected) {
      // Connection established
      this.state.value = {
        ...state,
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastConnected: now,
        connectionDuration: 0
      }

      this.connectionStartTime = now
      this.disconnectionStartTime = null

      // Record connection time if we have a previous disconnection
      if (state.lastDisconnected) {
        const disconnectionDuration = now.getTime() - state.lastDisconnected.getTime()
        this.connectionTimes.push(disconnectionDuration)
      }
    } else if (!connected && state.isConnected) {
      // Connection lost
      this.state.value = {
        ...state,
        isConnected: false,
        lastDisconnected: now,
        totalDisconnections: state.totalDisconnections + 1
      }

      this.disconnectionStartTime = now
      this.connectionStartTime = null
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      this.updateHealthMetrics()
    }, 5000) // Check every 5 seconds
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics() {
    const now = new Date()
    const state = this.state.value
    const health = this.health.value

    // Update connection duration
    if (state.isConnected && this.connectionStartTime) {
      this.state.value.connectionDuration = now.getTime() - this.connectionStartTime.getTime()
    }

    // Update uptime/downtime
    if (state.isConnected) {
      this.health.value.uptime += 5000 // Add 5 seconds
    } else {
      this.health.value.downtime += 5000 // Add 5 seconds
    }

    // Calculate average connection time
    if (this.connectionTimes.length > 0) {
      const totalTime = this.connectionTimes.reduce((sum, time) => sum + time, 0)
      this.health.value.averageConnectionTime = totalTime / this.connectionTimes.length
    }

    // Calculate connection stability
    const totalTime = health.uptime + health.downtime
    if (totalTime > 0) {
      this.health.value.connectionStability = health.uptime / totalTime
    }
  }

  /**
   * Force reconnection
   */
  async forceReconnect(): Promise<void> {
    if (this.state.value.isConnected) {
      webSocketService.disconnect()
    }

    this.state.value.isReconnecting = true

    try {
      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reconnect (this would need to be implemented in WebSocketService)
      // await webSocketService.connect(userId, username)
    } catch (error) {
      this.health.value.lastError = error instanceof Error ? error.message : 'Reconnection failed'
    } finally {
      this.state.value.isReconnecting = false
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const state = this.state.value
    const health = this.health.value

    return {
      currentState: {
        connected: state.isConnected,
        reconnecting: state.isReconnecting,
        connectionDuration: state.connectionDuration,
        reconnectAttempts: state.reconnectAttempts
      },
      health: {
        uptime: health.uptime,
        downtime: health.downtime,
        stability: health.connectionStability,
        quality: this.connectionQuality.value
      },
      history: {
        totalDisconnections: state.totalDisconnections,
        averageConnectionTime: health.averageConnectionTime,
        lastConnected: state.lastConnected,
        lastDisconnected: state.lastDisconnected
      }
    }
  }

  /**
   * Reset connection statistics
   */
  resetStats() {
    this.state.value = {
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastConnected: null,
      lastDisconnected: null,
      connectionDuration: 0,
      totalDisconnections: 0
    }

    this.health.value = {
      uptime: 0,
      downtime: 0,
      averageConnectionTime: 0,
      connectionStability: 0,
      lastError: null
    }

    this.connectionTimes = []
    this.connectionStartTime = null
    this.disconnectionStartTime = null
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopHealthCheck()
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager()
