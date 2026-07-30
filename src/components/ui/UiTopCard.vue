<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: 'TOP' }
)
</script>

<template>
  <div
    class="flex flex-col gap-2.5 p-4 rounded-[20px] bg-white shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]"
  >
    <h4 class="font-serif font-bold text-base text-ink">{{ title }}</h4>
    <div class="flex flex-col gap-2">
      <slot />
    </div>
  </div>
</template>
