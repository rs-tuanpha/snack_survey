<script setup lang="ts">
withDefaults(
  defineProps<{
    open?: boolean
  }>(),
  { open: true }
)
</script>

<template>
  <span
    class="inline-flex w-fit items-center justify-center rounded-full text-[11px] font-bold tracking-[0.4px] shrink-0"
    :class="
      open
        ? 'px-3 py-1.5 bg-[var(--color-status-bg,#CCFBF1)] text-[var(--color-status,#0D9488)]'
        : 'px-2.5 py-1 bg-[#FECACA] text-[#991B1B]'
    "
  >
    <slot>{{ open ? 'MỞ' : 'Đóng' }}</slot>
  </span>
</template>
