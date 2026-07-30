<script setup lang="ts">
import { computed } from 'vue'
import useTheme from '@/core/hooks/useTheme'
import type { ThemeId } from '@/core/theme/themes'
import UiSelect from './UiSelect.vue'

const { theme, themes, themeOptions, setTheme } = useTheme()

const currentLabel = computed(
  () => themes.value.find((t) => t.id === theme.value)?.label ?? theme.value
)

const onUpdate = (value: string) => {
  setTheme(value as ThemeId)
}
</script>

<template>
  <div
    class="theme-switcher group rounded-2xl bg-white/95 backdrop-blur-sm border border-stone-200 overflow-hidden transition-[width,padding] duration-200 ease-out w-11 h-11 p-0 hover:w-[180px] hover:h-auto hover:p-2.5 focus-within:w-[180px] focus-within:h-auto focus-within:p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
  >
    <div
      class="flex items-center justify-center w-11 h-11 group-hover:hidden group-focus-within:hidden"
      :title="currentLabel"
    >
      <i class="mdi mdi-palette text-xl text-ink" />
    </div>

    <div class="hidden group-hover:block group-focus-within:block min-w-[150px]">
      <UiSelect
        :model-value="theme"
        :options="themeOptions"
        label="Theme"
        compact
        @update:model-value="onUpdate"
      />
    </div>
  </div>
</template>
