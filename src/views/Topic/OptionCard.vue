<template>
  <div class="relative">
    <img
      v-if="rank !== null && rank !== undefined"
      :src="RANK_ICON[rank]"
      class="absolute -top-3 -left-3 w-12 h-12 z-20 drop-shadow-[1px_1px_0_rgba(28,25,23,0.6)] pointer-events-none theme-rank-icon"
    />
    <div
      class="theme-panel flex flex-col h-full !p-0 transition-[transform,box-shadow] duration-100 hover:[transform:var(--interactive-hover)]"
    >
      <div class="w-full h-[150px] overflow-hidden" :style="{ borderRadius: 'var(--radius-media) var(--radius-media) 0 0' }">
        <img :src="option?.thumbnail || DEFAULT_CARD_IMG" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col flex-1 p-4">
      <p class="font-sans text-base font-bold text-ink truncate">{{ option?.title ?? '' }}</p>
      <a :href="option?.link" target="_blank" class="block text-sm text-muted truncate mt-0.5 hover:text-terracotta hover:underline">{{ option?.link }}</a>
      <div class="flex items-center justify-between mt-auto pt-3">
        <div class="flex -space-x-2">
          <UiAvatar
            v-for="user in voters.slice(0, 3)"
            :key="user.id || user.username"
            :src="user.avatar"
            :fallback="user.username"
            size="sm"
            class="!w-7 !h-7 border-[length:var(--border-w)] border-[color:var(--stroke)] rounded-full ring-2 ring-surface"
          />
          <div
            v-if="voters.length > 3"
            class="w-7 h-7 font-mono font-bold text-[9px] flex items-center justify-center cursor-pointer bg-retro-blue"
            :style="{
              borderWidth: 'var(--border-w)',
              borderStyle: 'solid',
              borderColor: 'var(--stroke)',
              borderRadius: '9999px'
            }"
            :title="`${voters.length - 3} others`"
            @click.stop="onClickSeeMore(option)"
          >
            +{{ voters.length - 3 }}
          </div>
        </div>
        <i
          class="mdi mdi-thumb-up text-2xl cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-90"
          :class="isVoted ? 'text-terracotta' : 'text-retro-blue'"
          @click.prevent="handleChangeVote(index)"
        />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { DEFAULT_CARD_IMG, RANK_ICON } from '@/core/constants/app'
import { UiAvatar } from '@/components/ui'
import { computed } from 'vue'
import { isSameVoter, uniqueVoters } from '@/core/utils/voter'

const props = defineProps<{
  index: number
  option: IOption
  currentAccount: IUser | null
  rank?: number | null
}>()

const emits = defineEmits<{
  (e: 'handleChangeVote', index: number): void
  (e: 'onClickSeeMore', payload: IOption): void
}>()

const voters = computed(() => uniqueVoters(props.option?.voteBy))
const isVoted = computed(() => voters.value.some((voter) => isSameVoter(voter, props.currentAccount)))

const handleChangeVote = (index: number) => emits('handleChangeVote', index)
const onClickSeeMore = (payload: IOption) => emits('onClickSeeMore', payload)
</script>
