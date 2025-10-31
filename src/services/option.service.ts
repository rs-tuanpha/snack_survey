import api from '@/core/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { adaptApiOptionToIOption, type IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { fetchDOMMetadata, fetchOpenGraphMetadata } from '@/core/utils/metadata'
import {
  type Option,
  type CreateOptionRequest,
  type UpdateOptionRequest,
  type OptionResponse,
  type OptionListResponse,
  type OptionCreationResponse,
  type OptionUpdateResponse,
  type OptionDeletionResponse,
  type OptionVoteResponse,
  type OptionListQuery,
  queryKeys
} from '@/types/api'
import { uploadImageToFirebase } from './upload.service'

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Get options by topic ID with TanStack Query
 */
export function useOptionsByTopic(topicId: string, params: OptionListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.options.byTopic(topicId),
    queryFn: () => fetchOptionsByTopic(topicId, params),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 1, // 1 minute (shorter for real-time voting)
    gcTime: 1000 * 60 * 3, // 3 minutes
  })
}

/**
 * Get top ranked options by topic ID
 */
export function useTopRankedOptions(topicId: string) {
  return useQuery({
    queryKey: queryKeys.options.rank(topicId),
    queryFn: () => getRankByTopicId(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 30, // 30 seconds (very short for real-time updates)
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Get all options
 */
export function useAllOptions() {
  return useQuery({
    queryKey: queryKeys.options.lists(),
    queryFn: getAllOptions,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Create a new option
 */
export function useCreateOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionData: CreateOptionRequest) => createOption(optionData),
    onSuccess: (_, variables) => {
      // Invalidate options for the specific topic
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(variables.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(variables.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.lists() })
    },
    onError: (error) => {
      console.error('Failed to create option:', error)
    },
  })
}

/**
 * Update an existing option
 */
export function useUpdateOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ optionId, optionData }: { optionId: string; optionData: UpdateOptionRequest }) =>
      updateOption(optionId, optionData),
    onSuccess: (data, { optionId }) => {
      // Invalidate options for the topic and specific option
      const topicId = data.data.topicId
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.detail(optionId) })
    },
    onError: (error) => {
      console.error('Failed to update option:', error)
    },
  })
}

/**
 * Delete an option
 */
export function useDeleteOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionId: string) => deleteOption(optionId),
    onSuccess: (_, optionId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: queryKeys.options.detail(optionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete option:', error)
    },
  })
}

/**
 * Vote for an option
 */
export function useVoteOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionId: string) => voteOption(optionId),
    onSuccess: (data) => {
      // Invalidate options for the topic to refresh vote counts
      const topicId = data.data.topicId
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(topicId) })
    },
    onError: (error) => {
      console.error('Failed to vote for option:', error)
    },
  })
}

/**
 * Handle single vote mode (user can only vote for one option)
 */
export function useSingleVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      optionId,
      currentUser,
      previousOptionId
    }: {
      optionId: string
      currentUser: IUser
      previousOptionId: string | null
    }) => handleSingleVote(optionId, currentUser, previousOptionId),
    onSuccess: () => {
      // Invalidate all option queries to refresh vote counts
      queryClient.invalidateQueries({ queryKey: queryKeys.options.all })
    },
    onError: (error) => {
      console.error('Failed to handle single vote:', error)
    },
  })
}

/**
 * Handle multiple vote mode (user can vote for multiple options)
 */
export function useMultipleVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionId: string) => handleMultipleVote(optionId),
    onSuccess: () => {
      // Invalidate all option queries to refresh vote counts
      queryClient.invalidateQueries({ queryKey: queryKeys.options.all })
    },
    onError: (error) => {
      console.error('Failed to handle multiple vote:', error)
    },
  })
}

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

/**
 * Fetch all options for a specific topic
 */
export async function fetchOptionsByTopic(
  topicId: string,
  params: OptionListQuery = {}
): Promise<OptionListResponse> {
  try {
    const response = await api.get<OptionListResponse>(
      `/api/options/topic/${topicId}`,
      { params }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to fetch options for topic ${topicId}:`, error)
    throw error
  }
}

/**
 * Create a new option
 */
export async function createOption(data: CreateOptionRequest): Promise<OptionResponse> {
  try {
    const response = await api.post<OptionResponse>('/api/options', data)
    return response.data
  } catch (error) {
    console.error('Failed to create option:', error)
    throw error
  }
}

/**
 * Update an existing option
 */
export async function updateOption(id: string, data: UpdateOptionRequest): Promise<OptionResponse> {
  try {
    const response = await api.put<OptionResponse>(`/api/options/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Failed to update option ${id}:`, error)
    throw error
  }
}

/**
 * Delete an option
 */
export async function deleteOption(id: string): Promise<OptionDeletionResponse> {
  try {
    const response = await api.delete<OptionDeletionResponse>(`/api/options/${id}`)
    return response.data
  } catch (error) {
    console.error(`Failed to delete option ${id}:`, error)
    throw error
  }
}

/**
 * Vote for an option
 */
export async function voteOption(optionId: string): Promise<OptionVoteResponse> {
  try {
    const response = await api.post<OptionVoteResponse>(`/api/options/${optionId}/vote`)
    return response.data
  } catch (error) {
    console.error(`Failed to vote for option ${optionId}:`, error)
    throw error
  }
}

// ============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Get list option by topic id and order by voteCount (descending)
 */
export const getOptionsByTopicId = async (topicId: string) => {
  return api.get<OptionListResponse>(`/api/options/topic/${topicId}`)
}

export const getRankByTopicId = async (topicId: string): Promise<Option[]> => {
  try {
    const response = await api.get<OptionListResponse>(`/api/options/topic/${topicId}`, {
      params: { sort_by: 'vote_count', sort_order: 'desc', limit: 3 }
    })
    return response.data.data
  } catch (err) {
    return []
  }
}

/**
 * Get list all options
 */
export const getAllOptions = async (): Promise<IOption[]> => {
  try {
    const response = await api.get<OptionListResponse>('/api/options')
    return response.data.data.map(adaptApiOptionToIOption)
  } catch (err) {
    return []
  }
}

/**
 * Create new option with metadata handling
 */
export const postNewOption = async (
  title: string,
  link: string,
  topicId: string,
  image?: File | null
) => {
  try {
    let imageUrl: string | null = null

    // Upload image to Firebase if provided
    if (image) {
      console.log('📤 Uploading image to Firebase...', image.name, image.size)
      imageUrl = await uploadImageToFirebase(image)
      console.log('✅ Image uploaded, URL:', imageUrl)
      
      if (!imageUrl) {
        throw new Error('Failed to upload image to Firebase')
      }
    } else if (link) {
      await fetchOpenGraphMetadata(link) || await fetchDOMMetadata(link)
      // Handle metadata if needed
    }

    const createData: CreateOptionRequest = {
      title,
      topicId,
      ...(link && { link }),
      ...(imageUrl && { image: imageUrl })
    }

    console.log('📦 Sending create option request with payload:', createData)

    const response = await api.post<OptionCreationResponse>('/api/options', createData)
    return response.data.data
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

/**
 * Update option data
 */
export const putOptionData = async (option: IOption) => {
  const updateData: UpdateOptionRequest = {
    title: option.title
  }
  const response = await api.put<OptionUpdateResponse>(`/api/options/${option._id}`, updateData)
  return response.data.data
}

/**
 * Handle single vote mode - user can only vote for one option
 */
export const handleSingleVote = async (
  optionId: string,
  currentUser: IUser,
  previousOptionId: string | null
): Promise<void> => {
  try {
    // Handle previous vote if exists
    if (previousOptionId) {
      await api.delete(`/api/options/${previousOptionId}/vote`)
    }

    // Cast new vote
    await api.post<OptionVoteResponse>(`/api/options/${optionId}/vote`)
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

/**
 * Handle multiple vote mode - user can vote for multiple options
 */
export const handleMultipleVote = async (
  optionId: string,
): Promise<void> => {
  await api.post<OptionVoteResponse>(`/api/options/${optionId}/vote`)
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // TanStack Query hooks
  useOptionsByTopic,
  useTopRankedOptions,
  useAllOptions,
  useCreateOption,
  useUpdateOption,
  useDeleteOption,
  useVoteOption,
  useSingleVote,
  useMultipleVote,

  // API service functions
  fetchOptionsByTopic,
  createOption,
  updateOption,
  deleteOption,
  voteOption,

  // Legacy functions
  getOptionsByTopicId,
  getRankByTopicId,
  getAllOptions,
  postNewOption,
  putOptionData,
  handleSingleVote,
  handleMultipleVote,
}
