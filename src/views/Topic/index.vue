<template>
  <v-container id="topic">
    <!-- Left Area: Topic Details and Top 3 Options -->
    <v-sheet max-width="638" rounded width="100%" class="mx-auto left-area">
      <!-- Topic Information Section -->
      <div
        v-if="currentTopic"
        class="mx-auto left-area"
        style="width: 100% !important; max-width: 400px"
      >
        <h1 class="text-white text-h4 mb-2">{{ currentTopic.title }}</h1>
        <p class="text-white text-body-1 mb-1 text-break">{{ currentTopic.description }}</p>
        <p class="text-white text-body-1 mb-8">
          Thời hạn:
          {{ currentTopic?.endDate && formatEndDateUTC(currentTopic.endDate) }}
        </p>
        <!-- Countdown Timer Display -->
        <p v-if="Boolean(countdown)" class="text-white font-weight-medium mb-4">
          <v-chip color="primary" label class="chip-with-icon">
            <v-icon icon="mdi-clock-time-eight-outline"></v-icon>
          </v-chip>
          <span class="text-red ml-1">{{ countdown }}</span>
        </p>

        <!-- Connection Status -->
        <connection-status
          :show-details="true"
          :show-queued-votes="true"
          class="mb-4"
        />
      </div>

      <!-- Top 3 Options Display -->
      <div class="left-area__rank">
        <!-- First Place Option -->
        <option-card
          v-if="Boolean(topOptions?.[0])"
          :index="0"
          :is-rank-card="true"
          :option="topOptions[0]"
          :current-account="currentAccount"
          card-style="
              position: relative;
              padding: 8px;
              width: 220px;
              height: 240px;
              min-height: 240px;
              max-height: 240px;
              scale: 1.2;"
        ></option-card>
        <!-- Second and Third Place Options -->
        <div class="left-area__rank--bottom">
          <option-card
            v-if="Boolean(topOptions?.[1])"
            :index="1"
            :is-rank-card="true"
            :option="topOptions[1]"
            :current-account="currentAccount"
            card-style="position: relative;
              padding: 8px;
              width: 220px;
              height: 240px;
              min-height: 240px;
              max-height: 240px;"
          ></option-card>
          <option-card
            v-if="Boolean(topOptions?.[2])"
            :index="2"
            :is-rank-card="true"
            :option="topOptions[2]"
            :current-account="currentAccount"
            card-style="position: relative;
              padding: 8px;
              width: 220px;
              height: 240px;
              min-height: 240px;
              max-height: 240px;"
          ></option-card>
        </div>
      </div>
    </v-sheet>

    <!-- Right Area: Options List and Voting -->
    <v-sheet max-width="638" rounded="lg" width="100%" heigth="100%" class="mx-auto right-area">
      <!-- Alert Messages and Option Creation Form -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
        <div style="flex: 1">
          <!-- Topic Closed Alert -->
          <v-alert
            v-if="!isLoading && !currentTopic?.isActive && !alertVote"
            variant="outlined"
            type="warning"
            class="w-100 pt-2 pb-2"
            style="background-color: white"
            border="start"
          >
            Topic này đã đóng, vui lòng trở lại sau
          </v-alert>
          <!-- Vote Status Alert -->
          <v-alert
            v-if="alertVote"
            variant="outlined"
            :type="alertVoteType"
            class="w-100 pt-2 pb-2"
            style="background-color: white"
            border="start"
          >
            {{ alertVote }}</v-alert
          >
        </div>
        <!-- Option Creation Form -->
        <form-create-option
          v-if="currentTopic?.optionRequiredField && currentTopic?.isActive"
          :id="id.toString()"
          :options="currentOptions"
          :topic-state="currentTopic"
        />
      </div>

      <!-- Options List -->
      <div class="right-area__list-wrapper">
        <div v-if="currentOptions.length" class="right-area__list">
          <option-card
            v-for="(option, index) in currentOptions"
            :key="option.id"
            :index="index"
            :is-rank-card="false"
            :option="option"
            :current-account="currentAccount"
            card-style="
              position: relative;
              padding: 4px;
              width: calc(100% / 3 - 8px);
              max-width: 200px;
              height: 232px;
              min-height: 232px;
              max-height: 232px;
            "
            @on-click-see-more="onClickSeeMore(option)"
            @handle-change-vote="handleChangeVote(index)"
            @show-voters="showVoters"
          ></option-card>
        </div>
        <section v-else>
          <p style="font-size: large">No option yet!</p>
        </section>
      </div>
    </v-sheet>

    <!-- Loading Overlay -->
    <div>
      <v-overlay :model-value="isLoading" class="align-center justify-center">
        <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </div>

    <!-- Voters Dialog -->
    <voters-dialog
      v-if="selectedOptionId"
      v-model="showVotersDialog"
      :option-id="selectedOptionId"
    />
  </v-container>

  <!-- Vote List Dialog -->
  <v-dialog v-model="dialog" width="auto">
    <v-card>
      <v-card-title>Danh sách vote</v-card-title>
      <v-divider></v-divider>
      <v-card-text max-height="300px" class="pa-3">
        <div v-for="userId in listVoteBy" :key="userId" class="mr-1">
          <div v-if="userMap[userId]" class="mt-1">
            <v-avatar color="secondary" class="m-1" size="30">
              <v-img
                v-if="userMap[userId].avatar"
                :src="userMap[userId].avatar"
                :alt="userMap[userId].username"
              ></v-img>
              <span v-else>{{ userMap[userId].email.charAt(0).toLocaleUpperCase() }}</span>
              <v-tooltip activator="parent" location="top">{{
                userMap[userId].username
              }}</v-tooltip>
            </v-avatar>
            <span class="ml-1">{{ userMap[userId].username }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { onMounted, onUnmounted } from 'vue'
import { debounce } from 'lodash'
import { useQueryClient } from '@tanstack/vue-query'

import useCommon from '@/core/hooks/useCommon'
import type { IOption } from '@/core/interfaces/model/option'
import {
  useOptionsByTopic,
  useTopRankedOptions
} from '@/services/option.service'
import { useTopic } from '@/services/topic.service'
import {
  useVoteStatus
} from '@/services/socket-only-vote.service'
import {
  useSocketVote,
  useSocketVoteUpdates,
  useSocketConnection,
  useOptimisticVote
} from '@/services/socket-vote.service'
import { useUsersList } from '@/services/user.service'
import { useUserStore } from '@/stores/user'
import { useSocketStore, type VoteUpdateData } from '@/stores/socket'
import { useSocketVoteStore } from '@/stores/socket-vote.store'
import { realtimeSyncService } from '@/services/realtime-sync.service'
import type { VoteStatusResponse } from '@/services/websocket.service'
import type { User } from '@/types/api'
import { queryKeys } from '@/types/api'

// Lazy load the form component
const OptionCard = defineAsyncComponent(() => import('@/components/molecules/OptionCard.vue'))
const VotersDialog = defineAsyncComponent(() => import('@/components/organisms/VotersDialog.vue'))
const FormCreateOption = defineAsyncComponent(() => import('@/components/organisms/FormCreateOption.vue'))
const ConnectionStatus = defineAsyncComponent(() => import('@/components/atoms/ConnectionStatus.vue'))

// Common hook for routing and store access
const { getParams, handleRouter } = useCommon('useCommonStore')
const { id } = getParams()

// Data state
const { user: currentAccount } = useUserStore()
const { data: userList } = useUsersList({ page: 1, limit: 100 })

// Socket vote store for real-time state management
const socketVoteStore = useSocketVoteStore()
const userMap = computed(() => {
  const users = userList.value || []
  return users.reduce((acc: Record<string, User>, user: User) => {
    acc[user._id] = user
    return acc
  }, {} as Record<string, User>)
})

// TanStack Query hooks for data fetching
const { data: topicData, isLoading: topicLoading } = useTopic(id.toString())
const { data: optionsData, isLoading: optionsLoading } = useOptionsByTopic(id.toString())
const { data: topRankedData, isLoading: topRankedLoading } = useTopRankedOptions(id.toString())
const { data: voteStatusData, isLoading: voteStatusLoading } = useVoteStatus(id.toString())

// Socket-based vote hooks
const {
  state: socketVoteState,
  castVote: socketCastVote,
  toggleVote: socketToggleVote
} = useSocketVote()

const {
  startListening: startVoteUpdates,
  stopListening: stopVoteUpdates
} = useSocketVoteUpdates()

const {
  startListening: startConnectionListening,
  stopListening: stopConnectionListening
} = useSocketConnection()

const {
  applyOptimisticVote,
  confirmOptimisticVote,
  rollbackOptimisticVote,
  hasPendingVote,
  clearOptimisticVotes
} = useOptimisticVote()


// Query client for cache management
const queryClient = useQueryClient()
const socketStore = useSocketStore()

// Component state
const currentTime = ref(Date.now()) // Use UTC timestamp for consistent comparison
const listVoteBy = ref<string[]>([])
const dialog = ref<boolean>(false)
const alertVote = ref<string>('')
const alertVoteType = ref<'success' | 'error' | 'warning' | 'info'>('success')

// Voters dialog state
const selectedOptionId = ref<string | null>(null)
const showVotersDialog = ref(false)

// Combined loading state from TanStack Query and socket operations
const isLoading = computed(() =>
  topicLoading.value ||
  optionsLoading.value ||
  topRankedLoading.value ||
  voteStatusLoading.value ||
  socketVoteState.value.isLoading
)

/** Computed Properties */
// Derived data from TanStack Query
const currentTopic = computed(() => topicData.value || null)

// Use vote status data if available, otherwise fallback to options data
// Vote status data comes from Vote collection and includes real-time vote counts
const currentOptions = computed(() => {
  if (voteStatusData.value?.data?.options) {
    // Use vote status data which includes hasUserVoted flag from Vote collection
    return voteStatusData.value.data.options.map(transformVoteStatusOption)
  }

  if (optionsData.value?.data) {
    // Fallback to options data (also uses Vote collection for vote counts)
    return optionsData.value.data.map(transformOptionData)
  }

  return []
})

// Get top 3 options by vote count from dedicated hook
const topOptions = computed(() => {
  if (!topRankedData.value) return []

  // Transform API data to IOption format using helper function
  return topRankedData.value.map(transformOptionData)
})

// Track user's voting state
const userVoteState = computed(() => {
  if (!currentAccount) return []

  const votedIndices = currentOptions.value
    .map((option, index) => ({
      optionId: option.id,
      index,
      isVoted: option.hasUserVoted || false
    }))
    .filter((vote) => vote.isVoted)
    .map((vote) => vote.index)
  return votedIndices
})

// Time calculation constants
const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 1000 * 60,
  HOUR: 1000 * 60 * 60,
  DAY: 1000 * 60 * 60 * 24
} as const

// Cache end date timestamp to avoid repeated parsing
// Parse as UTC to prevent timezone conversion issues
const endDateTimestamp = computed(() => {
  if (!currentTopic.value?.endDate) return null

  // Parse the ISO string as UTC without timezone conversion
  const endDate = currentTopic.value.endDate
  const isoString = typeof endDate === 'string' ? endDate : endDate.toISOString()

  // Create UTC date using Date constructor with UTC values
  const utcDate = new Date(isoString.replace(/[+-]\d{2}:\d{2}$/, 'Z'))

  return utcDate.getTime()
})

// Calculate remaining time until topic deadline
const timeRemaining = computed(() => {
  // Early return if no end date
  if (!endDateTimestamp.value) {
    return { days: -1, hours: -1, minutes: -1, seconds: -1 }
  }

  const difference = endDateTimestamp.value - currentTime.value

  // Return zero values if time has passed (avoid side effects in computed)
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  // Calculate time components using constants
  const days = Math.floor(difference / TIME_CONSTANTS.DAY)
  const hours = Math.floor((difference % TIME_CONSTANTS.DAY) / TIME_CONSTANTS.HOUR)
  const minutes = Math.floor((difference % TIME_CONSTANTS.HOUR) / TIME_CONSTANTS.MINUTE)
  const seconds = Math.floor((difference % TIME_CONSTANTS.MINUTE) / TIME_CONSTANTS.SECOND)

  return { days, hours, minutes, seconds }
})

// Watch for when time expires to trigger update
const isExpired = computed(() => {
  return endDateTimestamp.value && endDateTimestamp.value <= currentTime.value
})

// Format countdown display
const countdown = computed(() => {
  const { days, hours, minutes, seconds } = timeRemaining.value
  const parts: string[] = []

  if (days > 0) parts.push(`${days} ngày`)
  if (hours > 0) parts.push(`${hours} giờ`)
  if (minutes > 0) parts.push(`${minutes} phút`)
  if (seconds > 0) parts.push(`${seconds} giây`)

  return parts.join(', ')
})

/** Utility Functions */
// Helper function to transform API option data to IOption format
const transformOptionData = (option: any): IOption => ({
  id: option._id,
  title: option.title,
  link: option.link,
  image: option.image,
  topicId: option.topicId,
  createdBy: option.createdBy,
  userVotes: new Map(), // Deprecated field, kept for compatibility
  voteCount: option.voteCount,
  hasUserVoted: option.hasUserVoted || false,
  createdAt: option.createdAt,
  updatedAt: option.updatedAt
})

// Helper function to transform vote status option data to IOption format
const transformVoteStatusOption = (option: any): IOption => ({
  id: option._id,
  title: option.title,
  link: option.link,
  image: option.image,
  topicId: id.toString(),
  createdBy: '', // Not available in vote status response
  userVotes: new Map(), // Deprecated field, kept for compatibility
  voteCount: option.voteCount,
  hasUserVoted: option.hasUserVoted || false,
  createdAt: option.createdAt,
  updatedAt: option.createdAt // Use createdAt as fallback
})

// Helper function to update vote status cache with vote data
const updateVoteStatusCacheWithVote = (topicId: string, optionId: string, voteCount: number, hasUserVoted: boolean) => {
  queryClient.setQueryData(
    queryKeys.votes.status(topicId),
    (oldData: any) => {
      if (!oldData?.data?.options) return oldData

      return {
        ...oldData,
        data: {
          ...oldData.data,
          options: oldData.data.options.map((option: any) =>
            option._id === optionId
              ? { ...option, voteCount, hasUserVoted }
              : option
          )
        }
      }
    }
  )
}

// Helper function to invalidate caches for new options
const invalidateOptionsCache = (topicId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(topicId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(topicId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(topicId) })
}


// Format end date to display as UTC time without timezone conversion
const formatEndDateUTC = (endDate: string | Date): string => {
  try {
    // Parse as UTC and format to show the exact time as intended
    const inputString = typeof endDate === 'string' ? endDate : endDate.toISOString()
    const isoString = inputString.replace(/[+-]\d{2}:\d{2}$/, 'Z')
    const utcDate = new Date(isoString)

    // Format using UTC methods to maintain the original time
    const day = String(utcDate.getUTCDate()).padStart(2, '0')
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
    const year = utcDate.getUTCFullYear()
    const hours = String(utcDate.getUTCHours()).padStart(2, '0')
    const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0')
    const seconds = String(utcDate.getUTCSeconds()).padStart(2, '0')

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
  } catch (error) {
    return 'Invalid date'
  }
}

/** Methods */
// Update topic status when deadline is reached
const update = async () => {
  // Note: This will be implemented in future phases
}

// Handle vote changes with Socket.IO and optimistic updates
const handleChangeVote = debounce(async (optionIndex: number) => {
  if (!currentTopic.value?.isActive) {
    showAlert('Topic này đã đóng!', 'error')
    return
  }

  if (!currentAccount) {
    showAlert('Vui lòng đăng nhập để vote', 'error')
    return
  }

  const optionId = currentOptions.value[optionIndex].id
  const hasVoted = currentOptions.value[optionIndex].hasUserVoted
  const topicId = id.toString()

  // Check if vote is pending
  if (hasPendingVote(optionId, topicId)) {
    showAlert('Vote đang được xử lý, vui lòng chờ...', 'warning')
    return
  }

  try {
    if (currentTopic.value?.isMutable) {
      // Multiple vote mode - use socket toggle vote
      const action = hasVoted ? 'unvote' : 'vote'

      // Apply optimistic update with enhanced conflict resolution
      const operationId = applyOptimisticVote(optionId, topicId, action)

      try {
        const result = await socketToggleVote(topicId, optionId, hasVoted || false)

        if (result.success) {
          confirmOptimisticVote(operationId)
          showAlert(hasVoted ? 'Đã bỏ vote' : 'Đã vote thành công', 'success')
        } else {
          rollbackOptimisticVote(operationId)
          showAlert(result.error || 'Vote thất bại', 'error')
        }
      } catch (error) {
        rollbackOptimisticVote(operationId)
        showAlert('Kết nối bị gián đoạn - vote sẽ được gửi khi kết nối lại', 'warning')
      }
    } else {
      // Single vote mode
      if (hasVoted) {
        // Unvote current option
        const unvoteOperationId = applyOptimisticVote(optionId, topicId, 'unvote')

        try {
          const result = await socketCastVote(topicId, optionId, 'unvote')

          if (result.success) {
            confirmOptimisticVote(unvoteOperationId)
            showAlert('Đã bỏ vote', 'success')
          } else {
            rollbackOptimisticVote(unvoteOperationId)
            showAlert(result.error || 'Bỏ vote thất bại', 'error')
          }
        } catch (error) {
          rollbackOptimisticVote(unvoteOperationId)
          showAlert('Kết nối bị gián đoạn - vote sẽ được gửi khi kết nối lại', 'warning')
        }
      } else {
        // Vote for new option (unvote previous if exists)
        const previousOptionId = userVoteState.value.length > 0
          ? currentOptions.value[userVoteState.value[0]].id
          : null

        // Apply optimistic updates with operation tracking
        let previousOperationId: string | null = null
        if (previousOptionId) {
          previousOperationId = applyOptimisticVote(previousOptionId, topicId, 'unvote')
        }
        const voteOperationId = applyOptimisticVote(optionId, topicId, 'vote')

        try {
          // First unvote previous option if exists
          if (previousOptionId && previousOperationId) {
            const unvoteResult = await socketCastVote(topicId, previousOptionId, 'unvote')
            if (unvoteResult.success) {
              confirmOptimisticVote(previousOperationId)
            } else {
              rollbackOptimisticVote(previousOperationId)
            }
          }

          // Then vote for new option
          const voteResult = await socketCastVote(topicId, optionId, 'vote')

          if (voteResult.success) {
            confirmOptimisticVote(voteOperationId)
            showAlert('Đã vote thành công', 'success')
          } else {
            rollbackOptimisticVote(voteOperationId)
            showAlert(voteResult.error || 'Vote thất bại', 'error')
          }
        } catch (error) {
          // Rollback optimistic updates on error
          if (previousOperationId) {
            rollbackOptimisticVote(previousOperationId)
          }
          rollbackOptimisticVote(voteOperationId)
          showAlert('Kết nối bị gián đoạn - vote sẽ được gửi khi kết nối lại', 'warning')
        }
      }
    }
  } catch (error) {
    showAlert('Có lỗi xảy ra khi vote', 'error')
  }
}, 300)

// Show temporary alert message
const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  alertVote.value = message
  alertVoteType.value = type
  setTimeout(() => {
    alertVote.value = ''
  }, 2000)
}

// Show vote list dialog
const onClickSeeMore = (option: IOption) => {
  listVoteBy.value = option.userVotes ? Object.keys(option.userVotes) : []
  dialog.value = true
}

const showVoters = (optionId: string) => {
  selectedOptionId.value = optionId
  showVotersDialog.value = true
}

// Watch for topic expiration to trigger update
watch(isExpired, (expired) => {
  if (expired) {
    update()
  }
})

// Socket connection and real-time updates setup
const setupSocketConnection = async () => {
  try {
    // Initialize socket vote store for this topic
    const topicId = id.toString()
    socketVoteStore.initializeTopic(topicId)

    // Start listening for vote updates
    startVoteUpdates()
    startConnectionListening()
    socketVoteStore.startListening()

    // Initialize real-time sync
    await realtimeSyncService.forceSyncTopic(topicId)

    // Connect to socket and join topic
    socketStore.connect()
    socketStore.joinTopic(topicId)

    // Set up socket event handlers for real-time updates
    socketStore.socket?.on('new_option', (data: IOption) => {
      if (data.topicId === id.toString()) {
        // Invalidate options cache to refetch with new option
        invalidateOptionsCache(id.toString())
      }
    })

    // Handle real-time vote updates
    socketStore.socket?.on('vote_option', (data: VoteUpdateData) => {
      if (data.topic_id === id.toString()) {
        // Update vote status cache with new vote count
        updateVoteStatusCacheWithVote(
          data.topic_id,
          data.option_id,
          data.count,
          data.action === 'vote'
        )
      }
    })

    // Handle vote status updates (for comprehensive status changes)
    socketStore.socket?.on('vote:status_response', (data: VoteStatusResponse) => {
      if (data.topic_id === id.toString()) {
        // Update vote status cache
        queryClient.setQueryData(
          queryKeys.votes.status(data.topic_id),
          data
        )
      }
    })
  } catch (error) {
    handleRouter.pushPath('/')
  }

  // Start countdown timer - use UTC timestamp for consistent comparison
  setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

// Component lifecycle hooks
onMounted(async () => {
  await setupSocketConnection()
})

// Clean up socket connection on component unmount
onUnmounted(() => {
  // Stop listening to socket events
  stopVoteUpdates()
  stopConnectionListening()
  socketVoteStore.stopListening()

  // Clear optimistic votes
  clearOptimisticVotes()

  // Clear socket vote store for this topic
  socketVoteStore.clearTopic(id.toString())

  // Leave topic and disconnect
  socketStore.leaveTopic()
  socketStore.disconnect()
})
</script>

<style scoped lang="scss">
@use './styles.scss';
</style>
