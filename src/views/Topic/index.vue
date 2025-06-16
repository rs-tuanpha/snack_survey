<template>
  <v-container id="topic">
    <!-- Left Area: Topic Details and Top 3 Options -->
    <v-sheet max-width="638" rounded width="100%" class="mx-auto left-area">
      <!-- Topic Information Section -->
      <div class="mx-auto left-area" style="width: 100% !important; max-width: 400px">
        <h1 class="text-white text-h4 mb-2">{{ currentTopic?.name }}</h1>
        <p class="text-white text-body-1 mb-1 text-break">{{ currentTopic?.description }}</p>
        <p class="text-white text-body-1 mb-8">
          Thời hạn:
          {{
            currentTopic?.date && dayjs(new Date(currentTopic.date)).format('DD/MM/YYYY, HH:MM:ss')
          }}
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
            v-if="!common.loading && !currentTopic?.status && !alertVote"
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
          v-if="currentTopic?.link && currentTopic?.status"
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
            :key="option._id"
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
          <div class="mt-1">
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
import { computed, defineAsyncComponent, onMounted, ref, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { debounce } from 'lodash'

import { ETopicTeam } from '@/core/constants/enum'
import useCommon from '@/core/hooks/useCommon'
import type { IOptionModel } from '@/core/interfaces/model/option'
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

// Lazy load the form component
const OptionCard = defineAsyncComponent(() => import('./OptionCard.vue'))
const FormCreateOption = defineAsyncComponent(() => import('./FormCreateOption.vue'))

// Common hook for routing and store access
const { getParams, handleRouter } = useCommon('useCommonStore')
const { id } = getParams()
const common = useCommonStore()

// Data state
const currentAccount = useUserStore().getUser as IUser
const userList = useUserStore().getUserList as IUser[]
const userMap = userList.reduce((acc, user) => {
  acc[user.id] = user
  return acc
}, {} as Record<string, IUser>)
const currentTopic = ref<ITopic | null>(null)
const currentOptions = ref<IOptionModel[]>([])
const socketStore = useSocketStore()

// Component state
const showOverlay = ref<boolean>(false)
const currentTime = ref(new Date().getTime())
const listVoteBy = ref<string[]>([])
const dialog = ref<boolean>(false)
const alertVote = ref<string>('')
const alertVoteType = ref<string>('success')

/** Computed Properties */
// Get top 3 options by vote count
const topOptions = computed(() => {
  // Sort options by voteCount in descending order and take top 3
  const rank: IOptionModel[] = [...currentOptions.value]
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 3)

  return rank
})

// Track user's voting state
const voteState = computed(() => {
  if (!currentAccount) return []

  const votedIndices = currentOptions.value
    .map((option, index) => ({
      optionId: option._id,
      index,
      isVoted: option.user_votes.has(currentAccount.id)
    }))
    .filter((vote) => vote.isVoted)
    .map((vote) => vote.index)
  return votedIndices
})

// Calculate remaining time until topic deadline
const timeRemaining = computed(() => {
  if (currentTopic.value?.date) {
    const difference =
      new Date((currentTopic.value?.date as any)?.seconds * 1000).getTime() - currentTime.value
    if (difference <= 0) {
      update()
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }
  return { days: -1, hours: -1, minutes: -1, seconds: -1 }
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
  topicInfo.status = false
  updateTopic(topicInfo.id, topicInfo)
}

// Handle vote changes with debounce
const handleChangeVote = debounce(async (optionIndex: number) => {
  if (!currentTopic.value?.status) {
    showAlert('Topic này đã đóng!', 'error')
    return
  }

  try {
    showOverlay.value = true
    const optionId = currentOptions.value[optionIndex]._id

    if (currentTopic.value?.option) {
      await handleMultipleVote(optionId, currentAccount)
    } else {
      const previousOptionId =
        voteState.value.length > 0 ? currentOptions.value[voteState.value[0]]._id : null
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
const showAlert = (message: string, type: string) => {
  alertVote.value = message
  alertVoteType.value = type
  setTimeout(() => {
    alertVote.value = ''
  }, 2000)
}

// Show vote list dialog
const onClickSeeMore = (option: IOptionModel) => {
  listVoteBy.value = Object.keys(option.user_votes)
  dialog.value = true
}

// Component lifecycle hooks
onMounted(async () => {
  try {
    currentTopic.value = await getTopicById(id.toString())
    const data = await getOptionsByTopicId(id.toString())
    currentOptions.value = data.options

    // Connect to socket and join topic
    socketStore.connect()
    socketStore.joinTopic(id.toString())

    // Set up socket event handlers
    socketStore.socket?.on('new_option', (data: IOptionModel) => {
      if (data.topic_id === id.toString()) {
        currentOptions.value.push(data)
      }
    })

    socketStore.socket?.on('vote_option', (data: VoteUpdateData) => {
      if (data.topic_id === id.toString()) {
        const optionIndex = currentOptions.value.findIndex((opt) => opt._id === data.option_id)
        if (optionIndex !== -1) {
          const option = currentOptions.value[optionIndex]
          if (data.action === 'vote') {
            // Add user to voteBy array if not already present
            option.user_votes.set(data.user_id, new Date())
            option.vote_count = data.count
          } else {
            // Remove user from voteBy array
            option.user_votes.delete(data.user_id)
          }
          option.vote_count = data.count
        }
      }
    })
  } catch {
    handleRouter.pushPath('/')
  }

  // Start countdown timer
  setInterval(() => {
    currentTime.value = new Date().getTime()
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
