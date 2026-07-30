<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
  }>(),
  { active: false }
)

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    class="w-9 h-9 rounded-[10px] flex items-center justify-center"
    :class="
      active
        ? 'bg-terracotta text-white'
        : 'bg-[var(--color-primary-soft,#FFF0E6)] text-terracotta'
    "
    @click.prevent="$emit('click')"
  >
    <i class="mdi mdi-thumb-up text-lg"></i>
  </button>
</template>
