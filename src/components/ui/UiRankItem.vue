<script setup lang="ts">
import { DEFAULT_CARD_IMG } from '@/core/constants/app'
import UiRankMedal from './UiRankMedal.vue'
import UiVoteBadge from './UiVoteBadge.vue'

withDefaults(
  defineProps<{
    title: string
    voteCount: number
    thumbnail?: string | null
    rank?: 0 | 1 | 2
  }>(),
  { rank: 0 }
)
</script>

<template>
  <div
    class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl"
    :class="[
      rank === 0 && 'bg-[var(--color-rank-gold-bg,#FEF3C7)]',
      rank === 1 && 'bg-[var(--color-rank-silver-bg,#F3F4F6)]',
      rank === 2 && 'bg-[var(--color-rank-bronze-bg,#FFEDD5)]'
    ]"
  >
    <div class="relative shrink-0 w-[50px] h-14">
      <img
        :src="thumbnail || DEFAULT_CARD_IMG"
        class="absolute left-[3px] top-2.5 w-11 h-11 object-cover rounded-[10px]"
        alt=""
      />
      <UiRankMedal :rank="rank" class="absolute left-[11px] top-0 z-[1]" />
    </div>
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <p class="font-serif text-[13px] font-bold text-ink truncate">{{ title }}</p>
      <p class="font-sans text-[11px] text-muted">{{ voteCount }} người vote</p>
    </div>
    <UiVoteBadge :count="voteCount" :rank="rank" />
  </div>
</template>
