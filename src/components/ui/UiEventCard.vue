<script setup lang="ts">
import UiStatusBadge from './UiStatusBadge.vue'
import UiDatePill from './UiDatePill.vue'
import UiTimePill from './UiTimePill.vue'

defineProps<{
  title: string
  description?: string
  open: boolean
  dateLabel: string
  timeLabel?: string
}>()
</script>

<template>
  <div
    class="flex flex-col gap-3.5 p-5 rounded-[20px] bg-white shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]"
  >
    <UiStatusBadge :open="open" />
    <h1 class="font-serif font-bold text-[22px] text-ink leading-tight">{{ title }}</h1>
    <p v-if="description" class="font-sans text-[13px] leading-[19px] text-muted">
      {{ description }}
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <UiDatePill :label="dateLabel" />
      <UiTimePill v-if="timeLabel" :label="timeLabel" :ended="!open" />
    </div>
  </div>
</template>
