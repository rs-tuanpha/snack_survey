<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Danh sách người vote</span>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Đang tải danh sách...</p>
        </div>

        <div v-else-if="error" class="text-center py-4">
          <v-icon color="error" size="48">mdi-alert-circle</v-icon>
          <p class="text-error mt-2">{{ error }}</p>
        </div>

        <div v-else-if="votersData?.data?.voters?.length === 0" class="text-center py-4">
          <v-icon color="grey" size="48">mdi-account-group</v-icon>
          <p class="text-grey mt-2">Chưa có ai vote cho option này</p>
        </div>

        <div v-else>
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-h6">Tổng cộng: {{ votersData?.data?.totalVotes || 0 }} vote</h3>
            <v-chip color="primary" variant="outlined">
              {{ votersData?.data?.voters?.length || 0 }} người
            </v-chip>
          </div>

          <v-list>
            <v-list-item
              v-for="(voter) in votersData?.data?.voters"
              :key="voter.userId"
              class="mb-2"
            >
              <template #prepend>
                <v-avatar color="primary" size="40">
                  <span class="text-white font-weight-bold">
                    {{ voter.username.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ voter.username }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ voter.email }}
              </v-list-item-subtitle>

              <template #append>
                <div class="text-right">
                  <v-chip size="small" color="grey-lighten-2">
                    {{ formatVoteTime(voter.votedAt) }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="closeDialog">Đóng</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { getOptionVoters, type VotersResponse } from '@/services/vote.service'

const props = defineProps<{
  modelValue: boolean
  optionId: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// State management
const votersData = ref<VotersResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emits('update:modelValue', value)
})

const optionId = computed(() => props.optionId)

// Fetch voters data
const fetchVoters = async (optionId: string) => {
  isLoading.value = true
  error.value = null
  
  try {
    votersData.value = await getOptionVoters(optionId)
  } catch (err: any) {
    error.value = err.message || 'Không thể tải danh sách người vote'
    votersData.value = null
  } finally {
    isLoading.value = false
  }
}

// Close dialog
const closeDialog = () => {
  dialog.value = false
}

// Format vote time
const formatVoteTime = (votedAt: string) => {
  const date = new Date(votedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch voters data on before mount
onBeforeMount(() => {
  if (dialog.value && optionId.value) {
    fetchVoters(optionId.value)
  }
})

</script>

<script lang="ts">
export default {
  name: 'VotersDialog'
}
</script>
