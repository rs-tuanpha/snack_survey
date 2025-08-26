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
            v-if="!common.loading && !currentTopic?.isActive && !alertVote"
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
          ></option-card>
        </div>
        <section v-else>
          <p style="font-size: large">No option yet!</p>
        </section>
      </div>
    </v-sheet>

    <!-- Loading Overlay -->
    <div>
      <v-overlay :model-value="showOverlay" class="align-center justify-center">
        <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </div>
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
import { computed, defineAsyncComponent, onMounted, ref, onUnmounted, watch } from 'vue'
import { debounce } from 'lodash'

import { ETopicTeam } from '@/core/constants/enum'
import useCommon from '@/core/hooks/useCommon'
import { adaptApiOptionToIOption, type IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'
import {
  getOptionsByTopicId,
  handleMultipleVote,
  handleSingleVote
} from '@/services/option.service'
import { getTopicById, updateTopic } from '@/services/topic.service'
import { useCommonStore } from '@/stores'
// import OptionCard from './OptionCard.vue'
import { useUserStore } from '@/stores/user'
import { useSocketStore, type VoteUpdateData } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import { AuthStorage } from '@/core/utils/storage'

// Lazy load the form component
const OptionCard = defineAsyncComponent(() => import('./OptionCard.vue'))
const FormCreateOption = defineAsyncComponent(() => import('./FormCreateOption.vue'))

// Common hook for routing and store access
const { getParams, handleRouter } = useCommon('useCommonStore')
const { id } = getParams()
const common = useCommonStore()
const authStore = useAuthStore()

// Data state
const currentAccount = AuthStorage.getUserData()
const { availableUsers } = useAuthStore()
const userMap = computed(() =>
  availableUsers.reduce((acc, user) => {
    acc[user.id] = user
    return acc
  }, {} as Record<string, IUser>)
)
const currentTopic = ref<ITopic | null>(null)
const currentOptions = ref<IOption[]>([])
const socketStore = useSocketStore()

// Component state
const showOverlay = ref<boolean>(false)
const currentTime = ref(Date.now()) // Use UTC timestamp for consistent comparison
const listVoteBy = ref<string[]>([])
const dialog = ref<boolean>(false)
const alertVote = ref<string>('')
const alertVoteType = ref<'success' | 'error' | 'warning' | 'info'>('success')

/** Computed Properties */
// Get top 3 options by vote count
const topOptions = computed(() => {
  // Sort options by voteCount in descending order and take top 3
  const rank: IOption[] = [...currentOptions.value]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3)

  return rank
})

// Track user's voting state
const voteState = computed(() => {
  if (!currentAccount) return []

  const votedIndices = currentOptions.value
    .map((option, index) => ({
      optionId: option.id,
      index,
      isVoted: option.userVotes?.has(currentAccount.id) || false
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
    console.error('Error formatting end date:', error)
    return 'Invalid date'
  }
}

/** Methods */
// Update topic status when deadline is reached
const update = async () => {
  const topicInfo = currentTopic.value ?? {
    id: '',
    name: '',
    description: '',
    date: new Date(),
    status: true,
    link: true,
    option: true,
    team: ETopicTeam.ALL
  }
  // // topicInfo.is_active = false
  // updateTopic(topicInfo.id, {
  //   is_active: false
  // })
}

// Handle vote changes with debounce
const handleChangeVote = debounce(async (optionIndex: number) => {
  if (!currentTopic.value?.isActive) {
    showAlert('Topic này đã đóng!', 'error')
    return
  }

  try {
    showOverlay.value = true
    const optionId = currentOptions.value[optionIndex].id

    if (currentTopic.value?.isMutable) {
      await handleMultipleVote(optionId)
    } else {
      const previousOptionId =
        voteState.value.length > 0 ? currentOptions.value[voteState.value[0]].id : null
      if (!currentAccount) return
      await handleSingleVote(optionId, currentAccount, previousOptionId)
    }
  } catch (error) {
    console.error('Vote error:', error)
    showAlert('Cập nhật thất bại', 'error')
  } finally {
    showOverlay.value = false
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

// Watch for topic expiration to trigger update
watch(isExpired, (expired) => {
  if (expired) {
    update()
  }
})

// Component lifecycle hooks
onMounted(async () => {
  try {
    await authStore.fetchAvailableUsers()
    const resTopic = await getTopicById(id.toString())
    currentTopic.value = resTopic
    const resOptions = await getOptionsByTopicId(id.toString())
    currentOptions.value = resOptions.data.data.map(adaptApiOptionToIOption)

    // Connect to socket and join topic
    socketStore.connect()
    socketStore.joinTopic(id.toString())

    // Set up socket event handlers
    socketStore.socket?.on('new_option', (data: IOption) => {
      if (data.topicId === id.toString()) {
        currentOptions.value.push(data)
      }
    })

    socketStore.socket?.on('vote_option', (data: VoteUpdateData) => {
      if (data.topic_id === id.toString()) {
        const optionIndex = currentOptions.value.findIndex((opt) => opt.id === data.option_id)
        if (optionIndex !== -1) {
          const option = currentOptions.value[optionIndex]
          if (data.action === 'vote') {
            // Add user to voteBy array if not already present
            option.userVotes?.set(data.user_id, new Date().toUTCString())
            option.voteCount = data.count
          } else {
            // Remove user from voteBy array
            option.userVotes?.delete(data.user_id)
          }
          option.voteCount = data.count
        }
      }
    })
  } catch {
    handleRouter.pushPath('/')
  }

  // Start countdown timer - use UTC timestamp for consistent comparison
  setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

// Clean up socket connection on component unmount
onUnmounted(() => {
  socketStore.leaveTopic()
  socketStore.disconnect()
})
</script>

<style scoped lang="scss">
@import './styles.scss';
</style>
