<script setup lang="ts">
withDefaults(
  defineProps<{
    rank?: 0 | 1 | 2
  }>(),
  { rank: 0 }
)
</script>

<template>
  <span
    class="inline-flex w-7 h-7 rounded-full border-[2.5px] border-white items-center justify-center shrink-0 shadow-[0_2px_6px_0_rgba(245,158,11,0.6)]"
    :class="[
      rank === 0 && 'bg-[var(--color-medal-gold,#F59E0B)]',
      rank === 1 && 'bg-[var(--color-medal-silver,#94A3B8)] shadow-[0_2px_6px_0_rgba(148,163,184,0.55)]',
      rank === 2 && 'bg-[var(--color-medal-bronze,#C2410C)] shadow-[0_2px_6px_0_rgba(194,65,12,0.55)]'
    ]"
  >
    <i class="mdi mdi-crown text-white text-sm leading-none"></i>
  </span>
</template>
