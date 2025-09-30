<template>
  <div class="connection-status">
    <!-- Connection Status Indicator -->
    <v-chip
      :color="statusColor"
      :variant="statusVariant"
      size="small"
      class="connection-chip"
    >
      <v-icon
        :icon="statusIcon"
        size="small"
        class="mr-1"
      />
      {{ statusText }}
    </v-chip>

    <!-- Queued Votes Indicator -->
    <v-chip
      v-if="hasQueuedVotes"
      color="warning"
      variant="outlined"
      size="small"
      class="queued-votes-chip ml-2"
    >
      <v-icon
        icon="mdi-clock-outline"
        size="small"
        class="mr-1"
      />
      {{ queuedVotesCount }} vote(s) pending
    </v-chip>

    <!-- Connection Error Alert -->
    <v-alert
      v-if="showError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-2"
      closable
      @click:close="clearError"
    >
      {{ errorMessage }}
    </v-alert>

    <!-- Reconnection Progress -->
    <v-progress-linear
      v-if="isReconnecting"
      indeterminate
      color="primary"
      class="mt-2"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSocketVoteStore } from '@/stores/socket-vote.store'

// Props
interface Props {
  showDetails?: boolean
  showQueuedVotes?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showQueuedVotes: true
})

// Store
const socketVoteStore = useSocketVoteStore()

// Computed properties
const isConnected = computed(() => socketVoteStore.isConnected)
const isReconnecting = computed(() => socketVoteStore.isReconnecting)
const lastError = computed(() => socketVoteStore.lastError)
const hasQueuedVotes = computed(() => socketVoteStore.getConnectionStatus.value.isReconnecting)
const queuedVotesCount = computed(() => 0) // This would come from WebSocket service

const statusColor = computed(() => {
  if (isReconnecting.value) return 'warning'
  if (isConnected.value) return 'success'
  return 'error'
})

const statusVariant = computed(() => {
  if (isReconnecting.value) return 'outlined'
  return 'flat'
})

const statusIcon = computed(() => {
  if (isReconnecting.value) return 'mdi-wifi-sync'
  if (isConnected.value) return 'mdi-wifi'
  return 'mdi-wifi-off'
})

const statusText = computed(() => {
  if (isReconnecting.value) return 'Reconnecting...'
  if (isConnected.value) return 'Connected'
  return 'Disconnected'
})

const showError = computed(() => {
  return props.showDetails && lastError.value && !isReconnecting.value
})

const errorMessage = computed(() => {
  return lastError.value || 'Connection error'
})

// Methods
const clearError = () => {
  socketVoteStore.clearError()
}
</script>

<style scoped lang="scss">
.connection-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  .connection-chip {
    transition: all 0.3s ease;
  }

  .queued-votes-chip {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
