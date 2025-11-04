/**
 * Advanced Cache Service
 * Multi-layer caching strategy for optimal performance
 */

import { ref, computed, watch } from 'vue'

/**
 * Cache entry
 */
interface CacheEntry<T> {
  key: string
  data: T
  timestamp: Date
  ttl: number
  accessCount: number
  lastAccessed: Date
  size: number
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number
  misses: number
  size: number
  entries: number
  hitRate: number
  memoryUsage: number
}

/**
 * Cache configuration
 */
interface CacheConfig {
  maxSize: number
  maxMemory: number
  defaultTTL: number
  cleanupInterval: number
  enableCompression: boolean
  enablePersistence: boolean
}

/**
 * Advanced Cache Service
 */
export class AdvancedCacheService<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private stats = ref<CacheStats>({
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: 0
  })

  private config: CacheConfig = {
    maxSize: 1000,
    maxMemory: 50 * 1024 * 1024, // 50MB
    defaultTTL: 300000, // 5 minutes
    cleanupInterval: 60000, // 1 minute
    enableCompression: true,
    enablePersistence: false
  }

  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.startCleanupTimer()
    this.loadFromPersistence()
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      data: this.config.enableCompression ? this.compress(data) : data,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: new Date(),
      size: this.calculateSize(data)
    }

    // Check memory limit
    if (this.stats.value.memoryUsage + entry.size > this.config.maxMemory) {
      this.evictLRU()
    }

    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, entry)
    this.updateStats()
    this.saveToPersistence()
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.value.misses++
      this.updateStats()
      return null
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.value.misses++
      this.updateStats()
      return null
    }

    // Update access info
    entry.accessCount++
    entry.lastAccessed = new Date()

    this.stats.value.hits++
    this.updateStats()

    return this.config.enableCompression ? this.decompress(entry.data) : entry.data
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? !this.isExpired(entry) : false
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats()
      this.saveToPersistence()
    }
    return deleted
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.updateStats()
    this.saveToPersistence()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats.value }
  }

  /**
   * Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Warm up cache
   */
  async warmUp(keys: string[], dataLoader: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await dataLoader(key)
          this.set(key, data)
        } catch (error) {
          console.error(`Failed to warm up cache for key ${key}:`, error)
        }
      }
    })

    await Promise.all(promises)
  }

  /**
   * Preload cache
   */
  async preload(keys: string[], dataLoader: (key: string) => Promise<T>): Promise<void> {
    await this.warmUp(keys, dataLoader)
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        invalidated++
      }
    }

    if (invalidated > 0) {
      this.updateStats()
      this.saveToPersistence()
    }

    return invalidated
  }

  /**
   * Get cache entry info
   */
  getEntryInfo(key: string): Partial<CacheEntry<T>> | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    return {
      key: entry.key,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      size: entry.size
    }
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    const now = new Date()
    const age = now.getTime() - entry.timestamp.getTime()
    return age > entry.ttl
  }

  private calculateSize(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 1024 // Default size
    }
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = new Date()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private updateStats(): void {
    const total = this.stats.value.hits + this.stats.value.misses
    this.stats.value.hitRate = total > 0 ? this.stats.value.hits / total : 0
    this.stats.value.entries = this.cache.size

    // Calculate memory usage
    let memoryUsage = 0
    for (const entry of this.cache.values()) {
      memoryUsage += entry.size
    }
    this.stats.value.memoryUsage = memoryUsage
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup(): void {
    const now = new Date()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.updateStats()
      this.saveToPersistence()
    }
  }

  private compress(data: T): T {
    // Simple compression placeholder
    // In a real implementation, you'd use a compression library
    return data
  }

  private decompress(data: T): T {
    // Simple decompression placeholder
    return data
  }

  private saveToPersistence(): void {
    if (!this.config.enablePersistence) return

    try {
      const cacheData = Array.from(this.cache.entries())
      localStorage.setItem('advanced_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to save cache to persistence:', error)
    }
  }

  private loadFromPersistence(): void {
    if (!this.config.enablePersistence) return

    try {
      const cacheData = localStorage.getItem('advanced_cache')
      if (cacheData) {
        const entries = JSON.parse(cacheData)
        for (const [key, entry] of entries) {
          // Check if entry is still valid
          const entryDate = new Date(entry.timestamp)
          const now = new Date()
          const age = now.getTime() - entryDate.getTime()

          if (age < entry.ttl) {
            this.cache.set(key, {
              ...entry,
              timestamp: entryDate,
              lastAccessed: new Date(entry.lastAccessed)
            })
          }
        }
        this.updateStats()
      }
    } catch (error) {
      console.error('Failed to load cache from persistence:', error)
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// Export specialized cache instances
export const voteCache = new AdvancedCacheService({
  maxSize: 500,
  defaultTTL: 300000, // 5 minutes
  enablePersistence: true
})

export const userCache = new AdvancedCacheService({
  maxSize: 200,
  defaultTTL: 600000, // 10 minutes
  enablePersistence: true
})

export const topicCache = new AdvancedCacheService({
  maxSize: 100,
  defaultTTL: 1800000, // 30 minutes
  enablePersistence: true
})
