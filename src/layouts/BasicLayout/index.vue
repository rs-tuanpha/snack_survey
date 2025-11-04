<script setup lang="ts">
import ProfileFAB from '@/components/organisms/ProfileFAB/index.vue'

/**
 * Layout: use for pages're logged
 */
</script>

<template>
  <div class="basic-layout">
    <div class="layout-root">
      <router-view></router-view>
    </div>
    <ProfileFAB />
  </div>
</template>
