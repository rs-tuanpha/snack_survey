<template>
  <div class="relative">
    <div
      class="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]"
    >
      <div class="relative w-full h-[140px] overflow-hidden bg-stone-100">
        <img :src="option?.thumbnail || DEFAULT_CARD_IMG" class="w-full h-full object-cover" alt="" />
        <UiRankMedal
          v-if="rank !== null && rank !== undefined && rank < 3"
          :rank="(rank as 0 | 1 | 2)"
          class="absolute top-2 left-2"
        />
      </div>
      <div class="flex flex-col flex-1 gap-2.5 px-3.5 py-3">
        <p class="font-serif text-[15px] font-bold text-ink truncate">{{ option?.title ?? '' }}</p>
        <a
          :href="option?.link"
          target="_blank"
          class="block text-[11px] text-stone-400 truncate hover:text-terracotta hover:underline"
          >{{ option?.link }}</a
        >
        <div class="flex items-center justify-between mt-auto pt-1">
          <div class="flex items-center">
            <UiAvatarStack :users="voters" :max="3" @click="onClickSeeMore(option)" />
            <button
              v-if="voters.length > 3"
              type="button"
              class="w-6 h-6 font-sans font-bold text-[9px] flex items-center justify-center cursor-pointer bg-stone-200 text-ink rounded-full ring-2 ring-white -ml-2 relative z-10"
              :title="`${voters.length - 3} others`"
              @click.stop="onClickSeeMore(option)"
            >
              +{{ voters.length - 3 }}
            </button>
          </div>
          <UiVoteAction :active="isVoted" @click="handleChangeVote(index)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { DEFAULT_CARD_IMG } from '@/core/constants/app'
import { UiAvatarStack, UiRankMedal, UiVoteAction } from '@/components/ui'
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
const isVoted = computed(() =>
  voters.value.some((voter) => isSameVoter(voter, props.currentAccount))
)

const handleChangeVote = (index: number) => emits('handleChangeVote', index)
const onClickSeeMore = (payload: IOption) => emits('onClickSeeMore', payload)
</script>
