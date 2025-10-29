<template>
  <v-snackbar
    v-model="state.isVisible"
    :color="snackbarColor"
    :timeout="currentMessage?.duration || 3000"
    location="bottom right"
    variant="elevated"
    class="global-snackbar glass-card-sm"
    @update:model-value="onSnackbarClose"
  >
    <div class="d-flex align-center">
      <v-icon
        :icon="snackbarIcon"
        class="mr-2"
        size="small"
      />
      <span class="text-body-2 glass-text">{{ currentMessage?.message }}</span>
    </div>
    
    <template #actions>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="dismiss"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { globalSnackbar, type SnackbarMessage } from '@/core/hooks/useSnackbar'

const { state, dismiss } = globalSnackbar

const currentMessage = computed(() => state.currentMessage)

const snackbarColor = computed(() => {
  if (!currentMessage.value) return 'primary'
  
  switch (currentMessage.value.type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'primary'
  }
})

const snackbarIcon = computed(() => {
  if (!currentMessage.value) return 'mdi-information'
  
  switch (currentMessage.value.type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-information'
  }
})

const onSnackbarClose = (value: boolean) => {
  if (!value) {
    dismiss()
  }
}
</script>

<style scoped lang="scss">
.global-snackbar {
  z-index: 9999;
  
  :deep(.v-snackbar__content) {
    padding: 12px 16px;
  }
  
  :deep(.v-snackbar__wrapper) {
    margin: 16px;
  }
}
</style>
