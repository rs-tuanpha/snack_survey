<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  { label: 'All' }
)
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold bg-[var(--color-primary-soft,#FFF0E6)] text-terracotta shrink-0"
  >
    <slot>{{ label }}</slot>
  </span>
</template>
