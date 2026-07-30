<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: 'terracotta' | 'sage' | 'yellow' | 'blue' | 'pink' | 'purple' | 'cream' | 'ink'
    dot?: boolean
  }>(),
  {
    color: 'terracotta',
    dot: false
  }
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
    :class="[
      color === 'terracotta' && 'bg-[var(--color-primary-soft,#FFF0E6)] text-terracotta',
      color === 'sage' && 'bg-[var(--color-status-bg,#CCFBF1)] text-[var(--color-status,#0D9488)]',
      color === 'yellow' && 'bg-[var(--color-rank-gold-bg,#FEF3C7)] text-amber-800',
      color === 'blue' && 'bg-sky-100 text-sky-800',
      color === 'pink' && 'bg-red-100 text-red-800',
      color === 'purple' && 'bg-purple-100 text-purple-800',
      color === 'cream' && 'bg-stone-100 text-ink',
      color === 'ink' && 'bg-ink text-cream'
    ]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    <slot />
  </span>
</template>
