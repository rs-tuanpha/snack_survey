<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    ended?: boolean
  }>(),
  { ended: false }
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold shrink-0"
    :class="
      ended
        ? 'bg-stone-100 text-muted'
        : 'bg-[var(--color-primary-soft,#FFF0E6)] text-terracotta'
    "
  >
    <i class="mdi mdi-timer-outline text-sm leading-none"></i>
    <slot>{{ label }}</slot>
  </span>
</template>
