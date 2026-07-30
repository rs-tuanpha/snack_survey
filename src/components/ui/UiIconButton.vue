<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    accent?: boolean
    title?: string
  }>(),
  { accent: false }
)

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    :title="title"
    class="w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer"
    :class="accent ? 'bg-terracotta text-white' : 'bg-stone-100 text-ink'"
    @click="$emit('click')"
  >
    <i :class="['mdi', icon, 'text-sm']"></i>
  </button>
</template>
