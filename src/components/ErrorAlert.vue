<template>
  <div v-if="error" class="error-alert">
    <div class="error-content">
      <div class="error-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      </div>
      <div class="error-message">
        {{ error }}
      </div>
      <button v-if="dismissible" @click="$emit('dismiss')" class="error-dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: string | null;
  dismissible?: boolean;
}

defineProps<Props>();
defineEmits<{
  dismiss: [];
}>();
</script>

<style scoped>
.error-alert {
  @apply bg-red-50 border border-red-200 rounded-lg p-4 mb-4;
}

.error-content {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply text-red-500 flex-shrink-0 mt-0.5;
}

.error-message {
  @apply text-red-700 text-sm flex-1;
}

.error-dismiss {
  @apply text-red-400 hover:text-red-600 flex-shrink-0 p-1 rounded;
}

.error-dismiss:hover {
  @apply bg-red-100;
}
</style>
