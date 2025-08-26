import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  adaptApiTopicToITopic,
  type ITopic
} from '@/core/interfaces/model/topic'
import type { 
  Topic, 
  CreateTopicRequest, 
  UpdateTopicRequest, 
  TopicResponse, 
  TopicListResponse,
  TopicListQuery,
  queryKeys
} from '@/types/api'

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Get list of topics with optional filters
 */
export function useTopicsList(params: TopicListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.topics.list(params),
    queryFn: () => getTopicList(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get open topics
 */
export function useOpenTopics(team?: string | null) {
  return useQuery({
    queryKey: queryKeys.topics.open(team || undefined),
    queryFn: () => getOpenTopicList(team || null),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get closed topics
 */
export function useClosedTopics(team?: string | null) {
  return useQuery({
    queryKey: queryKeys.topics.closed(team || undefined),
    queryFn: () => getCloseTopicList(team || null),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get all topics (legacy)
 */
export function useTopics() {
  return useQuery({
    queryKey: queryKeys.topics.lists(),
    queryFn: getTopics,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get topic by ID
 */
export function useTopic(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => getTopicById(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Create a new topic
 */
export function useCreateTopic() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (topicData: CreateTopicRequest) => createTopic(topicData),
    onSuccess: () => {
      // Invalidate and refetch topic lists
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
    onError: (error) => {
      console.error('Failed to create topic:', error)
    },
  })
}

/**
 * Update an existing topic
 */
export function useUpdateTopic() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ topicId, topicData }: { topicId: string; topicData: UpdateTopicRequest }) => 
      updateTopic(topicId, topicData),
    onSuccess: (_, { topicId }) => {
      // Invalidate specific topic and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
    onError: (error) => {
      console.error('Failed to update topic:', error)
    },
  })
}

/**
 * Delete a topic
 */
export function useDeleteTopic() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (topicId: string) => deleteTopic(topicId),
    onSuccess: (_, topicId) => {
      // Remove the topic from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.topics.detail(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
    onError: (error) => {
      console.error('Failed to delete topic:', error)
    },
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Fetches a list of topics based on the provided parameters.
 */
export const getTopicList = async (params: TopicListQuery): Promise<ITopic[]> => {
  const openTopicList: ITopic[] = []
  try {
    const response = await api.get<TopicListResponse>('/api/topics', {
      params
    })
    return response.data.data.map((item) => adaptApiTopicToITopic(item))
  } catch (err) {
    return openTopicList
  }
}

/**
 * Get list topic data status open
 */
export const getOpenTopicList = async (team: string | null): Promise<ITopic[]> => {
  try {
    const query: TopicListQuery = {
      isActive: true,
      team: team as 'FE' | 'PHP' | 'ALL' | undefined
    }
    const response = await api.get<TopicListResponse>('/api/topics', { params: query })
    return response.data.data.map((item) => adaptApiTopicToITopic(item))
  } catch (err) {
    return []
  }
}

/**
 * Get list topic data status close
 */
export const getCloseTopicList = async (team: string | null): Promise<ITopic[]> => {
  try {
    const query: TopicListQuery = {
      isActive: false,
      team: team as 'FE' | 'PHP' | 'ALL' | undefined
    }
    const response = await api.get<TopicListResponse>('/api/topics', { params: query })
    return response.data.data.map((item) => adaptApiTopicToITopic(item))
  } catch (err) {
    return []
  }
}

/**
 * Real-time topics collection - replaced with REST API call
 */
export const getTopics = async (): Promise<ITopic[]> => {
  try {
    const response = await api.get<TopicListResponse>('/api/topics', {
      params: { sortBy: 'updatedAt', sortOrder: 'desc' }
    })
    return response.data.data.map((item) => adaptApiTopicToITopic(item))
  } catch (err) {
    return []
  }
}

/**
 * Update topic data by id
 */
export const updateTopic = async (topicId: string, topicInfo: UpdateTopicRequest) => {
  try {
    await api.put<TopicResponse>(`/api/topics/${topicId}`, topicInfo)
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message)
    }
    throw e
  }
}

/**
 * Service get topic by id api
 */
export const getTopicById = async (topicId: string): Promise<ITopic> => {
  const response = await api.get<TopicResponse>(`/api/topics/${topicId}`)
  return adaptApiTopicToITopic(response.data.data)
}

/**
 * Create a new topic
 */
export const createTopic = async (topicData: CreateTopicRequest): Promise<Topic> => {
  const response = await api.post<TopicResponse>('/api/topics', topicData)
  return response.data.data
}

/**
 * Delete a topic
 */
export const deleteTopic = async (topicId: string): Promise<void> => {
  await api.delete(`/api/topics/${topicId}`)
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useTopicsList,
  useOpenTopics,
  useClosedTopics,
  useTopics,
  useTopic,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  
  // API service functions
  getTopicList,
  getOpenTopicList,
  getCloseTopicList,
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
}