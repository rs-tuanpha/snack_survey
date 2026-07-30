<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    options: Array<
      | { value: string; label: string }
      | { label: string; options: Array<{ value: string; label: string }> }
    >
    placeholder?: string
    label?: string
    state?: 'default' | 'valid' | 'error'
    compact?: boolean
  }>(),
  {
    modelValue: '',
    state: 'default',
    compact: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="theme-label block text-ink">
      {{ label }}
    </label>
    <select
      :value="modelValue"
      @change="onChange"
      class="theme-control w-full font-sans text-[15px] text-ink px-4 outline-none appearance-none cursor-pointer focus:border-terracotta/40"
      :class="[
        compact ? 'h-10' : 'h-12',
        state === 'valid' && '!border-sage',
        state === 'error' && '!border-terracotta'
      ]"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <template v-for="option in options" :key="'value' in option ? option.value : option.label">
        <optgroup v-if="'options' in option" :label="option.label">
          <option v-for="child in option.options" :key="child.value" :value="child.value">
            {{ child.label }}
          </option>
        </optgroup>
        <option v-else :value="option.value">
          {{ option.label }}
        </option>
      </template>
    </select>
  </div>
</template>
