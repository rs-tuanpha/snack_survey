<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    fallback?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    src: '',
    fallback: '?',
    size: 'md'
  }
)

const sizeClasses = computed(
  () =>
    ({
      sm: 'w-6 h-6 text-[9px]',
      md: 'w-9 h-9 text-xs',
      lg: 'w-12 h-12 text-sm'
    })[props.size]
)

const initial = computed(() => props.fallback.charAt(0).toUpperCase())
</script>

<template>
  <div
    class="rounded-full overflow-hidden bg-[var(--color-primary-soft,#FFF0E6)] text-terracotta inline-flex items-center justify-center font-sans font-bold select-none shrink-0 ring-2 ring-white"
    :class="sizeClasses"
  >
    <img v-if="src" :src="src" :alt="fallback" class="w-full h-full object-cover" />
    <span v-else>{{ initial }}</span>
  </div>
</template>
