<template>
  <div :style="cardStyle">
    <v-card
      style="
        box-shadow: none;
        border: 1px solid #ebebeb;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0;
        text-align: left;
      "
    >
      <div style="width: 100%; height: 116px">
        <v-img
          height="116px"
          :src="Boolean(props.option?.image) ? props.option.image : DEFAULT_CARD_IMG"
          cover
        ></v-img>
      </div>
      <div style="position: relative; flex: 1; border-top: 1px solid #ebebeb; margin-bottom: 8px">
        <p
          style="
            font-size: 14px;
            font-weight: 700;
            color: #252525;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            margin-bottom: 1px;
            padding: 4px 8px 0;
          "
        >
          {{ option?.title ?? '' }}
        </p>
        <a
          :href="option?.link"
          target="_blank"
          style="
            display: block;
            width: 100%;
            font-size: 12px;
            padding: 0 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          {{ props.option?.link }}
        </a>
      </div>
      <v-card-actions style="padding-top: 0">
        <div class="w-100 d-flex justify-space-between align-center">
          <div class="d-flex mt-1">
            <!-- Lazy loading voters - data only loads when dialog opens -->
            <div class="mr-1">
              <v-avatar
                :color="votersButtonColor"
                :class="[
                  'm-1',
                  isVotersButtonDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                ]"
                size="30"
                @click.stop="!isVotersButtonDisabled && showVoters()"
              >
                {{ props.option.voteCount || 0 }}
              </v-avatar>
              <v-tooltip activator="parent" location="top">
                {{ votersTooltipText }}
              </v-tooltip>
            </div>
          </div>
          <div v-if="currentAccount?.id" class="d-flex align-center">
            <!-- Loading spinner when voting -->
            <v-progress-circular
              v-if="isVoting"
              indeterminate
              size="24"
              width="2"
              color="primary"
              class="mr-2"
            ></v-progress-circular>
            
            <!-- Vote button -->
            <v-btn
              :disabled="isVoteButtonDisabled"
              :color="voteButtonColor"
              :loading="isVoting"
              variant="text"
              size="large"
              @click.prevent="handleChangeVote(option._id)"
            >
              <v-icon 
                size="x-large" 
                :class="{ 'mdi-spin': isVoting }"
              >
                {{ voteButtonIcon }}
              </v-icon>
              <v-tooltip activator="parent" location="top">
                {{ voteButtonText }}
              </v-tooltip>
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { computed, type StyleValue } from 'vue'
import { DEFAULT_CARD_IMG } from '@/core/constants/app'

const props = defineProps<{
  option: IOption
  currentAccount: IUser | null
  cardStyle?: StyleValue
  isVoting?: boolean
  disabled?: boolean
}>()
const emits = defineEmits<{
  (e: 'onChangeVote', optionId: string): void
  (e: 'showVoters', optionId: string): void
}>()

// Removed userVotes logic - now using lazy loading for voters

const handleChangeVote = (optionId: string) => {
  // Prevent spam clicking
  if (props.isVoting || props.disabled) {
    return
  }
  emits('onChangeVote', optionId)
}

const showVoters = () => {
  // Don't emit if disabled
  if (isVotersButtonDisabled.value) {
    return
  }
  emits('showVoters', props.option._id)
}

// Removed prefetch logic - voters data now fetched on dialog open

// Computed for button state
const isVoteButtonDisabled = computed(() => {
  return props.isVoting || props.disabled || !props.currentAccount?.id
})

const voteButtonColor = computed(() => {
  if (props.isVoting) return 'grey'
  if (props.option.hasUserVoted) return 'red-darken-1'
  return 'blue-darken-3'
})

const voteButtonText = computed(() => {
  if (props.isVoting) return 'Đang xử lý...'
  if (props.option.hasUserVoted) return 'Bỏ vote'
  return 'Vote'
})

const voteButtonIcon = computed(() => {
  if (props.isVoting) return 'mdi-loading'
  if (props.option.hasUserVoted) return 'mdi-thumb-down'
  return 'mdi-thumb-up'
})

// Computed for voters button state
const isVotersButtonDisabled = computed(() => {
  return (props.option.voteCount || 0) === 0
})

const votersButtonColor = computed(() => {
  return isVotersButtonDisabled.value ? 'grey-lighten-1' : 'light-blue-darken-2'
})

const votersTooltipText = computed(() => {
  if (isVotersButtonDisabled.value) {
    return 'Không có vote nào để hiển thị'
  }
  return 'Click to see voters'
})
</script>

<script lang="ts">
export default {
  name: 'OptionCard'
}
</script>
