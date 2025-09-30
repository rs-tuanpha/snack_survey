<script setup lang="ts">
import { RouterView } from 'vue-router'
import Loading from '@/components/molecules/Loading/index.vue'
import { computed } from 'vue'
import { useCommonStore } from '@/stores/_common'

/**
 * Page: Root page
 */
const commonStore = useCommonStore()
const isLoading = computed(() => commonStore.loading)
</script>

<template>
  <RouterView />
  <Loading :is-loading="isLoading" />
</template>
<style lang="scss">
@use '@/assets/styles/global.scss';
</style>
