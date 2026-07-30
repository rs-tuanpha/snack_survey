<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
}>()
</script>

<template>
  <div
    class="flex flex-col gap-2.5 p-5 rounded-3xl bg-[var(--color-search-bg,#FFF5EB)] shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]"
  >
    <span
      v-if="label !== ''"
      class="text-[11px] font-bold tracking-[0.6px] text-muted uppercase"
    >
      {{ label ?? 'Tìm topic' }}
    </span>
    <div class="flex items-center gap-3">
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder || 'Tìm topic...'"
        class="flex-1 h-12 px-4 rounded-[14px] bg-white border border-stone-200 font-sans text-[15px] text-ink outline-none placeholder:text-stone-400 focus:border-terracotta/40"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keyup.enter="$emit('search')"
      />
      <button
        type="button"
        class="w-12 h-12 rounded-full bg-terracotta text-white inline-flex items-center justify-center shrink-0"
        @click="$emit('search')"
      >
        <i class="mdi mdi-magnify text-xl"></i>
      </button>
    </div>
  </div>
</template>
