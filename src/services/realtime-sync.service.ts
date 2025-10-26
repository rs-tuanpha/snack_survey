/**
 * Real-time Synchronization Service
 * Ensures state consistency across all clients using Socket.IO
 */

import { ref } from 'vue'
import { webSocketService } from './websocket.service'
import { useSocketVoteStore } from '@/stores/socket-vote.store'
// Removed optimistic vote service import
import type { QueryClient } from '@tanstack/vue-query'
import { queryKeys } from '@/types/api'
import type { VoteUpdateResponse, VoteStatusResponse } from './websocket.service'

/**
 * Sync conflict resolution
 */
interface SyncConflict {
  id: string
  optionId: string
  topicId: string
  clientState: { voteCount: number; hasUserVoted: boolean }
  serverState: { voteCount: number; hasUserVoted: boolean }
  timestamp: Date
  resolution: 'pending' | 'resolved' | 'failed'
}

/**
 * Sync operation
 */
interface SyncOperation {
  id: string
  type: 'vote_update' | 'status_update' | 'conflict_resolution'
  topicId: string
  optionId?: string
  data: any
  timestamp: Date
  status: 'pending' | 'synced' | 'failed'
}

/**
 * Real-time Synchronization Service
 */
export class RealtimeSyncService {
  private conflicts = ref<Map<string, SyncConflict>>(new Map())
  private syncOperations = ref<Map<string, SyncOperation>>(new Map())
  private lastSyncTime = ref<Date | null>(null)
  private syncInProgress = ref(false)
  private syncQueue: SyncOperation[] = []
  private queryClient: QueryClient
  // Removed optimistic vote service

  constructor(
    queryClient: QueryClient,
    private socketVoteStore = useSocketVoteStore()
  ) {
    this.queryClient = queryClient
    // Removed optimistic vote service initialization
    this.setupSyncListeners()
    this.startPeriodicSync()
  }

  /**
   * Setup Socket.IO listeners for real-time sync
   */
  private setupSyncListeners(): void {
    // Listen for vote updates from other clients
    webSocketService.subscribeVoteUpdates((data: VoteUpdateResponse) => {
      this.handleRemoteVoteUpdate(data)
    })

    // Listen for vote status updates
    webSocketService.subscribeVoteStatusUpdates((data: VoteStatusResponse) => {
      this.handleRemoteStatusUpdate(data)
    })

    // Listen for batch updates
    webSocketService.subscribeVoteUpdates((data: any) => {
      if (data.type === 'batch_update') {
        this.handleBatchUpdate(data)
      }
    })

    // Listen for conflict notifications
    webSocketService.subscribeVoteErrors((data: any) => {
      if (data.type === 'conflict') {
        this.handleConflictNotification(data)
      }
    })
  }

  /**
   * Handle vote update from remote client with version conflict detection
   */
  private handleRemoteVoteUpdate(data: VoteUpdateResponse): void {
    const { optionId, voteCount, version, timestamp } = data
    
    // Check version conflict
    const currentVersion = this.getLocalVersion(optionId)
    if (version <= currentVersion) {
      // Stale update, ignore
      console.log(`Ignoring stale update for option ${optionId}: server version ${version} <= local version ${currentVersion}`)
      return
    }

    // Update local state
    this.updateOptionState(optionId, {
      voteCount,
      version,
      lastSync: new Date(timestamp)
    })

    // Invalidate TanStack Query cache
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.options.byTopic(data.topicId)
    })

    // Notify UI
    this.emitSyncEvent('vote_synced', { optionId, voteCount })

    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'vote_update',
      topicId: data.topicId,
      optionId: data.optionId,
      data,
      timestamp: new Date(),
      status: 'synced'
    }

    this.syncOperations.value.set(operation.id, operation)
  }

  /**
   * Handle status update from server
   */
  private handleRemoteStatusUpdate(data: VoteStatusResponse): void {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'status_update',
      topicId: data.topic_id,
      data,
      timestamp: new Date(),
      status: 'pending'
    }

    this.processSyncOperation(operation)
  }

  /**
   * Handle batch update from server
   */
  private handleBatchUpdate(data: any): void {
    if (data.updates && Array.isArray(data.updates)) {
      data.updates.forEach((update: any) => {
        this.handleRemoteVoteUpdate(update)
      })
    }
  }

  /**
   * Handle conflict notification from server
   */
  private handleConflictNotification(data: any): void {
    const conflict: SyncConflict = {
      id: this.generateOperationId(),
      optionId: data.optionId,
      topicId: data.topicId,
      clientState: data.clientState,
      serverState: data.serverState,
      timestamp: new Date(),
      resolution: 'pending'
    }

    this.conflicts.value.set(conflict.id, conflict)
    this.resolveConflict(conflict)
  }

  /**
   * Process sync operation
   */
  private processSyncOperation(operation: SyncOperation): void {
    this.syncOperations.value.set(operation.id, operation)

    try {
      switch (operation.type) {
        case 'vote_update':
          this.syncVoteUpdate(operation)
          break
        case 'status_update':
          this.syncStatusUpdate(operation)
          break
        case 'conflict_resolution':
          this.resolveConflict(operation.data)
          break
      }

      operation.status = 'synced'
      this.lastSyncTime.value = new Date()
    } catch (error) {
      operation.status = 'failed'
      console.error('Sync operation failed:', error)
    }
  }

  /**
   * Sync vote update
   */
  private syncVoteUpdate(operation: SyncOperation): void {
    const { data } = operation
    const { topicId, optionId, voteCount, action } = data

    // Check for conflicts with optimistic updates
    const hasOptimisticUpdate = false // Removed optimistic vote service

    if (hasOptimisticUpdate) {
      // Handle conflict
      this.handleVoteConflict(operation)
    } else {
      // Apply update directly
      this.socketVoteStore.updateOptionVoteCount(
        topicId,
        optionId,
        voteCount,
        action === 'vote'
      )
    }
  }

  /**
   * Sync status update
   */
  private syncStatusUpdate(operation: SyncOperation): void {
    const { data } = operation
    const { topic_id, votedOptions, totalVotes, lastVoteTime } = data

    this.socketVoteStore.updateUserVoteStatus(topic_id, {
      votedOptions,
      totalVotes,
      lastVoteTime
    })
  }

  /**
   * Handle vote conflict
   */
  private handleVoteConflict(operation: SyncOperation): void {
    const { data } = operation
    const { topicId, optionId, voteCount, action } = data

    // Get current optimistic state
    const optimisticState = null // Removed optimistic vote service
    const serverState = {
      voteCount,
      hasUserVoted: action === 'vote'
    }

    // Create conflict
    const conflict: SyncConflict = {
      id: this.generateOperationId(),
      optionId,
      topicId,
      clientState: optimisticState || { voteCount: 0, hasUserVoted: false },
      serverState,
      timestamp: new Date(),
      resolution: 'pending'
    }

    this.conflicts.value.set(conflict.id, conflict)
    this.resolveConflict(conflict)
  }

  /**
   * Resolve conflict using strategy
   */
  private resolveConflict(conflict: SyncConflict): void {
    try {
      // Use server-wins strategy for now
      this.socketVoteStore.updateOptionVoteCount(
        conflict.topicId,
        conflict.optionId,
        conflict.serverState.voteCount,
        conflict.serverState.hasUserVoted
      )

      // Clear any optimistic updates for this option
      // Removed optimistic vote service clear

      conflict.resolution = 'resolved'
    } catch (error) {
      conflict.resolution = 'failed'
      console.error('Conflict resolution failed:', error)
    }
  }

  /**
   * Start periodic sync to ensure consistency
   */
  private startPeriodicSync(): void {
    setInterval(() => {
      this.performPeriodicSync()
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Perform periodic sync
   */
  private async performPeriodicSync(): Promise<void> {
    if (this.syncInProgress.value) return

    this.syncInProgress.value = true

    try {
      // Get all active topics
      const topics = Array.from(this.socketVoteStore.topics.keys())

      for (const topicId of topics) {
        await this.syncTopicState(topicId as string)
      }
    } catch (error) {
      console.error('Periodic sync failed:', error)
    } finally {
      this.syncInProgress.value = false
    }
  }

  /**
   * Sync topic state with server
   */
  private async syncTopicState(topicId: string): Promise<void> {
    try {
      const status = await webSocketService.getVoteStatus(topicId)

      // Update user vote status
      this.socketVoteStore.updateUserVoteStatus(topicId, {
        votedOptions: status.votedOptions,
        totalVotes: status.totalVotes,
        lastVoteTime: status.lastVoteTime
      })
    } catch (error) {
      console.error(`Failed to sync topic ${topicId}:`, error)
    }
  }

  /**
   * Force sync for specific topic
   */
  async forceSyncTopic(topicId: string): Promise<void> {
    await this.syncTopicState(topicId)
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime.value,
      syncInProgress: this.syncInProgress.value,
      pendingOperations: this.syncOperations.value.size,
      activeConflicts: this.conflicts.value.size,
      queueLength: this.syncQueue.length
    }
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.value.values())
      .filter(conflict => conflict.resolution === 'pending')
  }

  /**
   * Clear resolved conflicts
   */
  clearResolvedConflicts(): void {
    for (const [id, conflict] of this.conflicts.value.entries()) {
      if (conflict.resolution === 'resolved') {
        this.conflicts.value.delete(id)
      }
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get local version for an option
   */
  private getLocalVersion(optionId: string): number {
    const optionState = this.socketVoteStore.getOptionState(optionId, optionId) // This should be topicId
    return (optionState as any)?.version || 0
  }

  /**
   * Update option state with new data
   */
  private updateOptionState(optionId: string, data: {
    voteCount: number
    version: number
    lastSync: Date
  }): void {
    // Update socket vote store
    this.socketVoteStore.updateOptionVoteCount(
      optionId, // This should be topicId
      optionId,
      data.voteCount,
      false // hasUserVoted - this should be determined properly
    )
  }

  /**
   * Emit sync event for UI notifications
   */
  private emitSyncEvent(event: string, data: any): void {
    // This would emit events that UI can listen to
    console.log(`Sync event: ${event}`, data)
  }
}

// Factory function to create service instance with queryClient
export function createRealtimeSyncService(queryClient: QueryClient) {
  return new RealtimeSyncService(queryClient)
}
