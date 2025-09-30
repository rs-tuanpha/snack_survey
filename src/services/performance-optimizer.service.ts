/**
 * Performance Optimizer Service
 * Optimizes latency, bundle size, and rendering performance
 */

import { ref, computed, watch, nextTick } from 'vue'
import { webSocketService } from './websocket.service'

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  voteLatency: number
  renderTime: number
  bundleSize: number
  memoryUsage: number
  connectionLatency: number
  lastUpdate: Date
}

/**
 * Optimization strategies
 */
interface OptimizationConfig {
  enableLazyLoading: boolean
  enableVirtualScrolling: boolean
  enableDebouncing: boolean
  enableMemoization: boolean
  maxConcurrentVotes: number
  batchSize: number
  debounceDelay: number
}

/**
 * Performance Optimizer Service
 */
export class PerformanceOptimizerService {
  private metrics = ref<PerformanceMetrics>({
    voteLatency: 0,
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    connectionLatency: 0,
    lastUpdate: new Date()
  })

  private config: OptimizationConfig = {
    enableLazyLoading: true,
    enableVirtualScrolling: true,
    enableDebouncing: true,
    enableMemoization: true,
    maxConcurrentVotes: 3,
    batchSize: 10,
    debounceDelay: 300
  }

  private voteQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false
  private renderStartTime = 0
  private memoryObserver: PerformanceObserver | null = null

  constructor() {
    this.initializePerformanceMonitoring()
    this.setupMemoryMonitoring()
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor vote latency
    this.monitorVoteLatency()

    // Monitor render performance
    this.monitorRenderPerformance()

    // Monitor connection latency
    this.monitorConnectionLatency()
  }

  /**
   * Monitor vote latency
   */
  private monitorVoteLatency(): void {
    const originalCastVote = webSocketService.castVote.bind(webSocketService)

    webSocketService.castVote = async (topicId: string, optionId: string, action: 'vote' | 'unvote') => {
      const startTime = performance.now()

      try {
        const result = await originalCastVote(topicId, optionId, action)
        const latency = performance.now() - startTime

        this.updateMetrics({ voteLatency: latency })
        return result
      } catch (error) {
        const latency = performance.now() - startTime
        this.updateMetrics({ voteLatency: latency })
        throw error
      }
    }
  }

  /**
   * Monitor render performance
   */
  private monitorRenderPerformance(): void {
    // Override nextTick to measure render time
    const originalNextTick = nextTick

    nextTick = (callback?: () => void) => {
      this.renderStartTime = performance.now()

      return originalNextTick(() => {
        const renderTime = performance.now() - this.renderStartTime
        this.updateMetrics({ renderTime })

        if (callback) {
          callback()
        }
      })
    }
  }

  /**
   * Monitor connection latency
   */
  private monitorConnectionLatency(): void {
    const originalConnect = webSocketService.connect.bind(webSocketService)

    webSocketService.connect = async (userId: string, username: string) => {
      const startTime = performance.now()

      try {
        await originalConnect(userId, username)
        const latency = performance.now() - startTime

        this.updateMetrics({ connectionLatency: latency })
      } catch (error) {
        const latency = performance.now() - startTime
        this.updateMetrics({ connectionLatency: latency })
        throw error
      }
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.updateMetrics({
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
          })
        }
      }, 5000)
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(updates: Partial<PerformanceMetrics>): void {
    this.metrics.value = {
      ...this.metrics.value,
      ...updates,
      lastUpdate: new Date()
    }
  }

  /**
   * Queue vote operation for batch processing
   */
  queueVoteOperation(voteOperation: () => Promise<void>): void {
    this.voteQueue.push(voteOperation)

    if (this.voteQueue.length >= this.config.batchSize) {
      this.processVoteQueue()
    }
  }

  /**
   * Process vote queue with concurrency control
   */
  private async processVoteQueue(): Promise<void> {
    if (this.isProcessingQueue || this.voteQueue.length === 0) return

    this.isProcessingQueue = true

    try {
      const batch = this.voteQueue.splice(0, this.config.maxConcurrentVotes)

      // Process batch concurrently
      await Promise.all(batch.map(operation => operation()))

      // Process remaining items if any
      if (this.voteQueue.length > 0) {
        setTimeout(() => this.processVoteQueue(), this.config.debounceDelay)
      }
    } catch (error) {
      console.error('Vote queue processing failed:', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        func(...args)
        timeoutId = null
      }, delay)
    }
  }

  /**
   * Memoize function results
   */
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()

    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

      if (cache.has(key)) {
        return cache.get(key)
      }

      const result = func(...args)
      cache.set(key, result)

      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }

      return result
    }) as T
  }

  /**
   * Lazy load component
   */
  lazyLoadComponent(importFn: () => Promise<any>) {
    return () => ({
      component: importFn(),
      loading: () => import('@/components/atoms/LoadingSpinner.vue'),
      error: () => import('@/components/atoms/ErrorBoundary.vue'),
      delay: 200,
      timeout: 3000
    })
  }

  /**
   * Optimize bundle size
   */
  optimizeBundleSize(): void {
    // Remove unused imports
    this.removeUnusedImports()

    // Enable tree shaking
    this.enableTreeShaking()

    // Compress assets
    this.compressAssets()
  }

  /**
   * Remove unused imports (placeholder)
   */
  private removeUnusedImports(): void {
    // This would be implemented with a build tool
    }

  /**
   * Enable tree shaking (placeholder)
   */
  private enableTreeShaking(): void {
    // This would be implemented with a build tool
    }

  /**
   * Compress assets (placeholder)
   */
  private compressAssets(): void {
    // This would be implemented with a build tool
    }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics.value }
  }

  /**
   * Get optimization config
   */
  getConfig(): OptimizationConfig {
    return { ...this.config }
  }

  /**
   * Update optimization config
   */
  updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.metrics.value

    // Calculate score based on various metrics
    const latencyScore = Math.max(0, 100 - (metrics.voteLatency / 10))
    const renderScore = Math.max(0, 100 - (metrics.renderTime / 5))
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 10))
    const connectionScore = Math.max(0, 100 - (metrics.connectionLatency / 20))

    return Math.round((latencyScore + renderScore + memoryScore + connectionScore) / 4)
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.metrics.value

    if (metrics.voteLatency > 100) {
      recommendations.push('Consider reducing vote latency by optimizing network calls')
    }

    if (metrics.renderTime > 16) {
      recommendations.push('Consider optimizing component rendering performance')
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Consider reducing memory usage by clearing unused data')
    }

    if (metrics.connectionLatency > 200) {
      recommendations.push('Consider optimizing connection latency')
    }

    return recommendations
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.memoryObserver) {
      this.memoryObserver.disconnect()
    }
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizerService()
