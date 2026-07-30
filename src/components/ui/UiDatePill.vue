<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium text-ink bg-stone-100 shrink-0"
  >
    <i class="mdi mdi-calendar text-sm text-muted leading-none"></i>
    <slot>{{ label }}</slot>
  </span>
</template>
