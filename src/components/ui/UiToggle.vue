<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="inline-flex items-center gap-3 cursor-pointer select-none">
    <div
      class="relative w-11 h-6 rounded-full transition-colors duration-150"
      :class="modelValue ? 'bg-terracotta' : 'bg-stone-200'"
      @click="emit('update:modelValue', !modelValue)"
    >
      <div
        class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150"
        :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0.5'"
      />
    </div>
    <span v-if="label" class="font-sans text-sm text-ink font-medium">{{ label }}</span>
  </label>
</template>
