/**
 * Optimistic Vote Service
 * Enhanced optimistic updates with conflict resolution and rollback mechanisms
 */

import { ref, computed, watch } from 'vue'
import { useSocketVoteStore } from '@/stores/socket-vote.store'

/**
 * Optimistic vote operation
 */
interface OptimisticVoteOperation {
  id: string
  optionId: string
  topicId: string
  action: 'vote' | 'unvote'
  timestamp: Date
  originalState: {
    voteCount: number
    hasUserVoted: boolean
  }
  status: 'pending' | 'confirmed' | 'failed' | 'conflicted'
  retryCount: number
  maxRetries: number
}

/**
 * Conflict resolution strategy
 */
type ConflictResolutionStrategy = 'last-write-wins' | 'server-wins' | 'client-wins' | 'merge'

/**
 * Enhanced Optimistic Vote Service
 */
export class OptimisticVoteService {
  private operations = ref<Map<string, OptimisticVoteOperation>>(new Map())
  private conflictResolution: ConflictResolutionStrategy = 'server-wins'
  private maxRetries = 3
  private retryDelay = 1000

  constructor(
    private socketVoteStore = useSocketVoteStore()
  ) {
    this.setupConflictResolution()
  }

  /**
   * Apply optimistic vote update
   */
  applyOptimisticVote(
    optionId: string,
    topicId: string,
    action: 'vote' | 'unvote'
  ): string {
    const operationId = this.generateOperationId(optionId, topicId, action)

    // Get current state
    const optionState = this.socketVoteStore.getOptionState(topicId, optionId)
    const originalState = {
      voteCount: optionState?.voteCount ?? 0,
      hasUserVoted: optionState?.hasUserVoted ?? false
    }

    // Create optimistic operation
    const operation: OptimisticVoteOperation = {
      id: operationId,
      optionId,
      topicId,
      action,
      timestamp: new Date(),
      originalState,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.maxRetries
    }

    // Store operation
    this.operations.value.set(operationId, operation)

    // Apply optimistic update to store
    this.updateStoreOptimistically(operation)

    return operationId
  }

  /**
   * Confirm optimistic vote (when server responds successfully)
   */
  confirmOptimisticVote(operationId: string): void {
    const operation = this.operations.value.get(operationId)
    if (!operation) return

    operation.status = 'confirmed'

    // Remove from pending operations
    this.operations.value.delete(operationId)
  }

  /**
   * Rollback optimistic vote (when server error)
   */
  rollbackOptimisticVote(operationId: string): void {
    const operation = this.operations.value.get(operationId)
    if (!operation) return

    // Restore original state
    this.socketVoteStore.updateOptionVoteCount(
      operation.topicId,
      operation.optionId,
      operation.originalState.voteCount,
      operation.originalState.hasUserVoted
    )

    operation.status = 'failed'
    this.operations.value.delete(operationId)
  }

  /**
   * Handle conflict resolution
   */
  resolveConflict(
    operationId: string,
    serverState: { voteCount: number; hasUserVoted: boolean }
  ): void {
    const operation = this.operations.value.get(operationId)
    if (!operation) return

    operation.status = 'conflicted'

    switch (this.conflictResolution) {
      case 'server-wins':
        this.applyServerState(operation, serverState)
        break
      case 'client-wins':
        this.retryOperation(operation)
        break
      case 'last-write-wins':
        this.handleLastWriteWins(operation, serverState)
        break
      case 'merge':
        this.mergeStates(operation, serverState)
        break
    }
  }

  /**
   * Retry failed operation
   */
  async retryOperation(operation: OptimisticVoteOperation): Promise<void> {
    if (operation.retryCount >= operation.maxRetries) {
      this.rollbackOptimisticVote(operation.id)
      return
    }

    operation.retryCount++
    operation.status = 'pending'

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.retryDelay * operation.retryCount))

    // Re-apply optimistic update
    this.updateStoreOptimistically(operation)
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): OptimisticVoteOperation[] {
    return Array.from(this.operations.value.values())
      .filter(op => op.status === 'pending')
  }

  /**
   * Get conflicted operations
   */
  getConflictedOperations(): OptimisticVoteOperation[] {
    return Array.from(this.operations.value.values())
      .filter(op => op.status === 'conflicted')
  }

  /**
   * Clear all operations
   */
  clearAllOperations(): void {
    this.operations.value.clear()
  }

  /**
   * Clear operations for specific topic
   */
  clearTopicOperations(topicId: string): void {
    for (const [id, operation] of this.operations.value.entries()) {
      if (operation.topicId === topicId) {
        this.operations.value.delete(id)
      }
    }
  }

  /**
   * Get operation by ID
   */
  getOperation(operationId: string): OptimisticVoteOperation | undefined {
    return this.operations.value.get(operationId)
  }

  /**
   * Check if option has pending vote
   */
  hasPendingVote(optionId: string, topicId: string): boolean {
    return Array.from(this.operations.value.values())
      .some(op =>
        op.optionId === optionId &&
        op.topicId === topicId &&
        op.status === 'pending'
      )
  }

  /**
   * Get optimistic vote state for option
   */
  getOptimisticVoteState(optionId: string, topicId: string): {
    voteCount: number
    hasUserVoted: boolean
    isPending: boolean
  } {
    const optionState = this.socketVoteStore.getOptionState(topicId, optionId)
    const pendingOps = Array.from(this.operations.value.values())
      .filter(op =>
        op.optionId === optionId &&
        op.topicId === topicId &&
        op.status === 'pending'
      )

    let voteCount = optionState?.voteCount ?? 0
    let hasUserVoted = optionState?.hasUserVoted ?? false

    // Apply pending operations
    for (const op of pendingOps) {
      if (op.action === 'vote') {
        voteCount++
        hasUserVoted = true
      } else {
        voteCount = Math.max(0, voteCount - 1)
        hasUserVoted = false
      }
    }

    return {
      voteCount,
      hasUserVoted,
      isPending: pendingOps.length > 0
    }
  }

  // Private methods

  private generateOperationId(optionId: string, topicId: string, action: string): string {
    return `${topicId}_${optionId}_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateStoreOptimistically(operation: OptimisticVoteOperation): void {
    const currentState = this.socketVoteStore.getOptionState(operation.topicId, operation.optionId)
    let newVoteCount = currentState?.voteCount ?? 0
    let newHasUserVoted = currentState?.hasUserVoted ?? false

    if (operation.action === 'vote') {
      newVoteCount++
      newHasUserVoted = true
    } else {
      newVoteCount = Math.max(0, newVoteCount - 1)
      newHasUserVoted = false
    }

    this.socketVoteStore.updateOptionVoteCount(
      operation.topicId,
      operation.optionId,
      newVoteCount,
      newHasUserVoted
    )
  }

  private applyServerState(operation: OptimisticVoteOperation, serverState: { voteCount: number; hasUserVoted: boolean }): void {
    this.socketVoteStore.updateOptionVoteCount(
      operation.topicId,
      operation.optionId,
      serverState.voteCount,
      serverState.hasUserVoted
    )
    this.operations.value.delete(operation.id)
  }

  private handleLastWriteWins(operation: OptimisticVoteOperation, serverState: { voteCount: number; hasUserVoted: boolean }): void {
    // Compare timestamps - this would need server timestamp
    // For now, use server state
    this.applyServerState(operation, serverState)
  }

  private mergeStates(operation: OptimisticVoteOperation, serverState: { voteCount: number; hasUserVoted: boolean }): void {
    // Simple merge strategy - use server vote count, client user vote state
    const currentState = this.socketVoteStore.getOptionState(operation.topicId, operation.optionId)
    this.socketVoteStore.updateOptionVoteCount(
      operation.topicId,
      operation.optionId,
      serverState.voteCount,
      currentState?.hasUserVoted ?? false
    )
    this.operations.value.delete(operation.id)
  }

  private setupConflictResolution(): void {
    // Watch for server updates and handle conflicts
    // This would be implemented with socket listeners
  }
}

// Export singleton instance
export const optimisticVoteService = new OptimisticVoteService()
