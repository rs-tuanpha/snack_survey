<script setup lang="ts">
import { DEFAULT_CARD_IMG } from '@/core/constants/app'

defineProps<{
  title: string
  voteCount: number
  thumbnail?: string | null
}>()
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-3 py-2.5 min-w-0 flex-1 rounded-2xl bg-stone-100"
  >
    <img
      :src="thumbnail || DEFAULT_CARD_IMG"
      class="w-10 h-10 object-cover rounded-[10px] shrink-0"
      alt=""
    />
    <span class="font-sans text-[13px] font-semibold text-ink truncate flex-1">{{ title }}</span>
    <span
      class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold bg-[var(--color-rank-gold-bg,#FEF3C7)] text-amber-800"
      >{{ voteCount }} votes</span
    >
  </div>
</template>
