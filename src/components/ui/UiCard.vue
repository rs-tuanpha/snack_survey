<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'dot' | 'elevatedDot' | 'solid' | 'interactive'
  }>(),
  {
    variant: 'default'
  }
)
</script>

<template>
  <div
    class="theme-panel p-5 relative"
    :class="[
      variant === 'solid' && '!bg-cream',
      variant === 'elevatedDot' && 'theme-panel-md !shadow-[var(--elev-3)]',
      variant === 'interactive' && 'cursor-pointer'
    ]"
  >
    <slot />
  </div>
</template>
