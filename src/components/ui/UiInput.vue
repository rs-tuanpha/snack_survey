<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    type?: 'text' | 'textarea'
    placeholder?: string
    state?: 'default' | 'valid' | 'error'
    compact?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    state: 'default',
    compact: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="theme-label block text-ink">
      {{ label }}
    </label>
    <textarea
      v-if="type === 'textarea'"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
      class="theme-control w-full font-sans text-[15px] text-ink px-4 py-3 outline-none placeholder:text-subtle min-h-[80px] resize-vertical focus:border-terracotta/40"
      :class="[
        state === 'valid' && '!border-sage',
        state === 'error' && '!border-terracotta'
      ]"
    />
    <input
      v-else
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
      class="theme-control w-full font-sans text-[15px] text-ink px-4 outline-none placeholder:text-subtle focus:border-terracotta/40"
      :class="[
        compact ? 'h-10' : 'h-12',
        state === 'valid' && '!border-sage',
        state === 'error' && '!border-terracotta'
      ]"
    />
  </div>
</template>
