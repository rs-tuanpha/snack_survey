<script setup lang="ts">
defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div v-if="isLoading" class="fixed inset-0 bg-ink/40 flex items-center justify-center z-50">
    <div class="flex flex-col items-center gap-3">
      <div
        class="w-8 h-8 rounded-full border-2 border-stone-200 border-t-terracotta animate-spin"
      />
      <span class="font-sans text-sm font-semibold text-white">Loading...</span>
    </div>
  </div>
</template>
