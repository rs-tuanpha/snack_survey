<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ink' | 'ghost' | 'sage' | 'yellow' | 'blue' | 'pink' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
    shape?: 'pill' | 'rounded' | 'square' | 'sharp'
    disabled?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    shape: 'pill',
    disabled: false,
    block: false,
    type: 'button'
  }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 whitespace-nowrap select-none cursor-pointer font-sans font-bold border-solid disabled:opacity-40 disabled:cursor-default"
    :style="{
      borderWidth: variant === 'secondary' || variant === 'ghost' ? '1px' : '0',
      borderColor: variant === 'secondary' ? 'var(--stroke)' : 'transparent',
      borderRadius:
        shape === 'sharp'
          ? '0'
          : shape === 'rounded'
            ? '12px'
            : shape === 'square'
              ? '10px'
              : 'var(--radius-btn)',
      boxShadow:
        variant === 'primary'
          ? 'var(--btn-shadow)'
          : variant === 'ghost'
            ? 'var(--elev-0)'
            : 'none'
    }"
    :class="[
      variant === 'primary' && 'bg-terracotta text-white',
      variant === 'secondary' && 'bg-white text-ink',
      variant === 'ink' && 'bg-ink text-cream',
      variant === 'ghost' && 'bg-white text-ink',
      variant === 'sage' && 'bg-[var(--color-status-bg,#CCFBF1)] text-[var(--color-status,#0D9488)]',
      variant === 'yellow' && 'bg-[var(--color-rank-gold-bg,#FEF3C7)] text-amber-800',
      variant === 'blue' && 'bg-sky-100 text-sky-800',
      variant === 'pink' && 'bg-red-100 text-red-800',
      variant === 'danger' && 'bg-red-100 text-red-800',
      size === 'xs' && 'text-[11px] px-2.5 py-1',
      size === 'sm' && 'text-[12px] px-3.5 py-1.5',
      size === 'md' && 'text-[13px] px-4 py-2.5',
      size === 'lg' && 'text-[14px] px-7 py-3.5',
      size === 'xl' && 'text-[14px] px-8 py-3.5 tracking-[0.4px]',
      size === 'icon' && 'text-sm w-12 h-12 p-0 !rounded-full bg-orange-400 text-white !border-0',
      block && 'w-full'
    ]"
  >
    <slot />
  </button>
</template>
