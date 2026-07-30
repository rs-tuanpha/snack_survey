<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  targetDate: Date | number
  label?: string
}>()

const emit = defineEmits<{
  expired: []
}>()

const now = ref(Date.now())

const timeLeft = computed(() => {
  const target = new Date(props.targetDate).getTime()
  const diff = Math.max(0, target - now.value)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total: diff }
})

const display = computed(() => {
  const { days, hours, minutes, seconds } = timeLeft.value
  return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
})

let interval: ReturnType<typeof setInterval>

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now()
    if (timeLeft.value.total <= 0) {
      clearInterval(interval)
      emit('expired')
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="inline-flex flex-col items-start">
    <span v-if="label" class="block font-sans font-bold text-[11px] tracking-[0.06em] text-muted mb-1.5">
      {{ label }}
    </span>
    <span class="font-serif font-bold text-2xl text-terracotta tabular-nums">
      {{ display }}
    </span>
  </div>
</template>
