<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    message: string
  }>(),
  {
    type: 'info'
  }
)

const iconByType: Record<'info' | 'success' | 'warning' | 'error', string> = {
  info: 'mdi-information-outline',
  success: 'mdi-check-circle-outline',
  warning: 'mdi-alert-outline',
  error: 'mdi-alert-circle-outline'
}
</script>

<template>
  <div
    class="flex items-start gap-3 w-full px-4 py-3 rounded-2xl border font-sans text-[13px] font-medium leading-snug"
    :class="[
      type === 'info' && 'bg-stone-50 border-stone-200 text-ink',
      type === 'success' &&
        'bg-[var(--color-status-bg,#CCFBF1)] border-teal-200/60 text-[var(--color-status,#0D9488)]',
      type === 'warning' &&
        'bg-[var(--color-rank-gold-bg,#FEF3C7)] border-amber-200/70 text-amber-800',
      type === 'error' && 'bg-red-100 border-red-200 text-red-800'
    ]"
    role="alert"
  >
    <i
      :class="['mdi', iconByType[type], 'text-base leading-none mt-0.5 shrink-0']"
      aria-hidden="true"
    ></i>
    <span class="min-w-0 flex-1">
      <slot>{{ message }}</slot>
    </span>
  </div>
</template>
