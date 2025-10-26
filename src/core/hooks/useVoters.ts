import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useOptionVoters } from '@/services/vote.service'
import { queryKeys } from '@/types/api'
import type { VotersResponse } from '@/services/vote.service'

/**
 * Composable for managing voters state with lazy loading and caching
 */
export function useVoters() {
  const queryClient = useQueryClient()
  const selectedOptionId = ref<string | null>(null)
  const isDialogOpen = ref(false)

  // Computed for current option voters query
  const votersQuery = computed(() => {
    if (!selectedOptionId.value) return null
    return useOptionVoters(selectedOptionId.value, isDialogOpen.value)
  })

  // Get voters data
  const votersData = computed(() => votersQuery.value?.data.value)
  const isLoading = computed(() => votersQuery.value?.isLoading.value ?? false)
  const error = computed(() => votersQuery.value?.error.value)

  /**
   * Open voters dialog for a specific option
   */
  const openVotersDialog = (optionId: string) => {
    selectedOptionId.value = optionId
    isDialogOpen.value = true
  }

  /**
   * Close voters dialog
   */
  const closeVotersDialog = () => {
    isDialogOpen.value = false
    // Keep selectedOptionId for caching, only reset when component unmounts
  }

  /**
   * Prefetch voters data for an option (useful for hover effects)
   */
  const prefetchVoters = async (optionId: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.votes.voters(optionId),
        staleTime: 60000, // 1 minute
      })
    } catch (error) {
      // Silently fail prefetch - it's just an optimization
      console.debug('Failed to prefetch voters:', error)
    }
  }

  /**
   * Invalidate voters cache for an option (useful after vote changes)
   */
  const invalidateVoters = (optionId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.votes.voters(optionId)
    })
  }

  /**
   * Get cached voters data without triggering a fetch
   */
  const getCachedVoters = (optionId: string): VotersResponse | undefined => {
    return queryClient.getQueryData<VotersResponse>(queryKeys.votes.voters(optionId))
  }

  return {
    // State
    selectedOptionId: computed(() => selectedOptionId.value),
    isDialogOpen: computed(() => isDialogOpen.value),
    
    // Data
    votersData,
    isLoading,
    error,
    
    // Actions
    openVotersDialog,
    closeVotersDialog,
    prefetchVoters,
    invalidateVoters,
    getCachedVoters
  }
}
