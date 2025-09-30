<template>
  <div class="loading-spinner">
    <v-progress-circular
      :size="size"
      :width="width"
      :color="color"
      indeterminate
    />
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number
  width?: number
  color?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  size: 40,
  width: 4,
  color: 'primary',
  message: 'Loading...'
})
</script>

<style scoped lang="scss">
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 12px;

  .loading-message {
    margin: 0;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 14px;
  }
}
</style>
