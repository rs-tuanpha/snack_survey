<script setup lang="ts">
/**
 * Component: <Loading />
 */

defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div v-if="isLoading" class="glass-overlay">
    <div class="glass-card loading-content">
      <v-progress-circular 
        indeterminate 
        color="primary" 
        size="64"
        class="mb-4"
      ></v-progress-circular>
      <div class="glass-text text-h6">Loading...</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  min-width: 200px;
}
</style>
