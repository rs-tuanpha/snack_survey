import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ITopic } from '@/core/interfaces/model/topic'
import { logger } from '@/core/utils/logger'

// Simple localStorage utilities for store use
const localStorageUtils = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      logger.error('Failed to set localStorage:', String(error))
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      logger.error('Failed to remove localStorage:', String(error))
    }
  }
}

// Topic store interface
interface ITopicState {
  topics: ITopic[]
  currentTopic: ITopic | null
  lastTopicId: string | null
  loading: boolean
  error: string | null
}

const initState: ITopicState = {
    topics: [],
    currentTopic: null,
    lastTopicId: null,
  loading: false,
  error: null
}

export const useTopicStore = defineStore('topic', {
  state: (): ITopicState => {
    return { ...initState }
  },

  getters: {
    // Get all topics
    getAllTopics: (state): ITopic[] => state.topics,

    // Get current topic
    getCurrentTopic: (state): ITopic | null => state.currentTopic,

    // Get topics by team
    getTopicsByTeam: (state) => (team: string): ITopic[] => {
      return state.topics.filter(topic => topic.team === team)
    },

    // Get open topics
    getOpenTopics: (state): ITopic[] => {
      return state.topics.filter(topic => topic.isActive)
    },

    // Get closed topics
    getClosedTopics: (state): ITopic[] => {
      return state.topics.filter(topic => !topic.isActive)
    },

    // Get topic by ID
    getTopicById: (state) => (id: string): ITopic | null => {
      return state.topics.find(topic => topic._id === id) || null
    },

    // Check if loading
    isLoading: (state): boolean => state.loading,

    // Get error
    getError: (state): string | null => state.error,

    // Get last topic ID
    getLastTopicId: (state): string | null => state.lastTopicId
  },

  actions: {
    /**
     * Set topics list
     */
    setTopics(topics: ITopic[]): void {
      this.topics = topics
      logger.topic.debug('Topics set:', topics.length)
    },

    /**
     * Add a new topic
     */
    addTopic(topic: ITopic): void {
      this.topics.unshift(topic)
      logger.topic.debug('Topic added:', topic._id)
    },

    /**
     * Update an existing topic
     */
    updateTopic(updatedTopic: ITopic): void {
      const index = this.topics.findIndex(t => t._id === updatedTopic._id)
      if (index !== -1) {
        this.topics[index] = updatedTopic

        // Update current topic if it's the same
        if (this.currentTopic?._id === updatedTopic._id) {
          this.currentTopic = updatedTopic
        }

        logger.topic.debug('Topic updated:', updatedTopic._id)
      }
    },

    /**
     * Remove a topic
     */
    removeTopic(topicId: string): void {
      this.topics = this.topics.filter(t => t._id !== topicId)

      // Clear current topic if it's the same
      if (this.currentTopic?._id === topicId) {
        this.currentTopic = null
      }

      logger.topic.debug('Topic removed:', topicId)
    },

    /**
     * Set current topic
     */
    setCurrentTopic(topic: ITopic | null): void {
      this.currentTopic = topic
      if (topic) {
        this.lastTopicId = topic._id
        // Persist to localStorage
        const preferences = localStorageUtils.get<Record<string, any>>('app_preferences', {})
        localStorageUtils.set('app_preferences', {
          ...preferences,
          lastTopicId: topic._id
        })
      }
      logger.topic.debug('Current topic set:', topic?._id)
    },

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
      this.loading = loading
    },

    /**
     * Set error state
     */
    setError(error: string | null): void {
      this.error = error
    },

    /**
     * Clear error
     */
    clearError(): void {
      this.error = null
    },

    /**
     * Clear all topics
     */
    clearTopics(): void {
      this.topics = []
      this.currentTopic = null
      this.lastTopicId = null
      logger.topic.debug('All topics cleared')
    },

    /**
     * Initialize from storage
     */
    initializeFromStorage(): void {
      try {
        const preferences = localStorageUtils.get<Record<string, any>>('app_preferences', {})
        if (preferences?.lastTopicId) {
          this.lastTopicId = preferences.lastTopicId
        }
        logger.topic.debug('Topic store initialized from storage')
    } catch (error) {
        logger.topic.error('Failed to initialize from storage:', error)
      }
    }
  }
})
