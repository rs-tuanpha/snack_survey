<script setup lang="ts">
defineProps<{
  modelValue: string
  tabs: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex gap-2 p-1.5 bg-stone-100 rounded-2xl flex-wrap border border-stone-200">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="font-sans font-semibold text-[13px] px-4 py-2 cursor-pointer select-none rounded-xl"
      :class="
        modelValue === tab.value
          ? 'bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
          : 'bg-transparent text-muted hover:text-ink'
      "
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
