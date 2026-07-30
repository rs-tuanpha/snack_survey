<script setup lang="ts">
defineProps<{
  modelValue: string
  value: string
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label
    class="inline-flex items-center gap-3 cursor-pointer select-none"
    :class="disabled && 'opacity-50 cursor-not-allowed'"
  >
    <input
      type="radio"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="emit('update:modelValue', value)"
      class="sr-only"
    />
    <div
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-150"
      :class="
        modelValue === value
          ? 'border-terracotta bg-terracotta'
          : 'border-stone-300 bg-white'
      "
      @click="!disabled && emit('update:modelValue', value)"
    >
      <div
        class="w-2 h-2 rounded-full bg-white transition-opacity duration-150"
        :class="modelValue === value ? 'opacity-100' : 'opacity-0'"
      />
    </div>
    <span v-if="label" class="font-sans text-sm text-ink font-medium">{{ label }}</span>
  </label>
</template>
