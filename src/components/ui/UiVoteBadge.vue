<script setup lang="ts">
withDefaults(
  defineProps<{
    count: number | string
    rank?: 0 | 1 | 2
  }>(),
  { rank: 0 }
)
</script>

<template>
  <span
    class="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-sm font-bold shrink-0 font-serif"
    :class="[
      rank === 0 && 'bg-[var(--color-medal-gold,#F59E0B)]',
      rank === 1 && 'bg-[var(--color-medal-silver,#94A3B8)]',
      rank === 2 && 'bg-[var(--color-medal-bronze,#C2410C)]'
    ]"
  >
    {{ count }}
  </span>
</template>
