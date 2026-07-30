<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2 items-center text-center">
    <h1 class="font-serif font-extrabold text-[32px] text-ink leading-none">
      <slot name="title">{{ title || 'Snack Survey' }}</slot>
    </h1>
    <p v-if="subtitle || $slots.subtitle" class="font-sans text-sm text-muted">
      <slot name="subtitle">{{ subtitle }}</slot>
    </p>
  </div>
</template>