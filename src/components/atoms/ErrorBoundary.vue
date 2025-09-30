<template>
  <div class="error-boundary">
    <v-alert
      type="error"
      variant="tonal"
      class="error-alert"
    >
      <template #title>
        <v-icon icon="mdi-alert-circle" class="mr-2" />
        {{ title }}
      </template>

      <p class="error-message">{{ message }}</p>

      <template #append>
        <v-btn
          variant="text"
          size="small"
          @click="retry"
        >
          <v-icon icon="mdi-refresh" class="mr-1" />
          Retry
        </v-btn>
      </template>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  message: 'An error occurred while loading the component. Please try again.'
})

const emit = defineEmits<{
  retry: []
}>()

const retry = () => {
  emit('retry')
}
</script>

<style scoped lang="scss">
.error-boundary {
  padding: 20px;

  .error-alert {
    .error-message {
      margin: 8px 0 0 0;
      font-size: 14px;
    }
  }
}
</style>
