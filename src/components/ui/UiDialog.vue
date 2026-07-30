<script setup lang="ts">
import { useSlots, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  maxWidth?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const slots = useSlots()
const hasTitle = computed(() => Boolean(slots.title || props.title))

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-ink/40 fixed inset-0" @click="close" />
        <div
          class="relative w-full bg-white overflow-hidden focus:outline-none border border-stone-200 shadow-[0_16px_48px_rgba(0,0,0,0.12)] flex flex-col max-h-[85vh]"
          :class="maxWidth || 'max-w-lg'"
          :style="{ borderRadius: 'var(--radius-dialog)' }"
        >
          <div
            v-if="hasTitle"
            class="shrink-0 px-6 sm:px-7 py-4 border-b border-stone-100 bg-white z-10"
          >
            <div class="font-serif font-bold text-[22px] text-ink">
              <slot name="title">{{ title }}</slot>
            </div>
          </div>
          <div class="overflow-y-auto min-h-0 flex-1 px-6 sm:px-7 py-4">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 150ms ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
