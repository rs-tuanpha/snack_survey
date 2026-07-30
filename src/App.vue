<script setup lang="ts">
import { RouterView } from 'vue-router'
import Loading from '@/components/molecules/Loading/index.vue'
// import ThemeSwitcher from '@/components/ui/ThemeSwitcher.vue'
import { computed } from 'vue'
import { useCommonStore } from '@/stores'

const common = useCommonStore()
const isLoading = computed(() => common.loading)
</script>

<template>
  <div class="min-h-screen bg-cream">
    <RouterView />
    <Loading :is-loading="isLoading" />
    <!-- <div class="fixed bottom-4 right-4 z-50">
      <ThemeSwitcher />
    </div> -->
  </div>
</template>
