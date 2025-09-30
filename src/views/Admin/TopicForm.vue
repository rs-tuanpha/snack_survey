<template>
  <v-container>
    <!-- Unauthorized Access -->
    <v-row v-if="!isAdmin" justify="center">
      <v-col cols="12" md="8" class="text-center">
        <v-alert type="error" variant="tonal" class="mb-4">
          <v-alert-title>Truy cập bị từ chối</v-alert-title>
          Bạn không có quyền truy cập trang này. Chỉ admin mới có thể tạo và chỉnh sửa topics.
          <template v-slot:append>
            <v-btn color="error" variant="text" @click="goToTopicList">
              Quay lại danh sách
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Form Content -->
    <div v-else>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="goToTopicList"
              class="mr-2"
            ></v-btn>
            <div>
              <h1 class="text-h4">{{ isEditMode ? 'Chỉnh sửa Topic' : 'Tạo Topic Mới' }}</h1>
              <p class="text-body-2 text-grey mt-1">
                {{ isEditMode ? 'Cập nhật thông tin topic' : 'Tạo một topic mới để bắt đầu voting' }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Form -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card elevation="2" rounded="lg">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-format-list-bulleted" class="mr-2"></v-icon>
              <span>Thông tin Topic</span>
            </v-card-title>

            <v-card-text>
              <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
                <!-- Topic Name -->
                <v-text-field
                  v-model="formData.name"
                  label="Tên Topic *"
                  :rules="nameRules"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :disabled="submitting"
                  counter="200"
                  maxlength="200"
                  hint="Tên topic phải từ 1-200 ký tự"
                  persistent-hint
                />

                <!-- Description -->
                <v-textarea
                  v-model="formData.description"
                  label="Mô tả"
                  :rules="descriptionRules"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :disabled="submitting"
                  rows="3"
                  counter="1000"
                  maxlength="1000"
                  hint="Mô tả chi tiết về topic (tùy chọn)"
                  persistent-hint
                />

                <!-- Team Selection -->
                <v-select
                  v-model="formData.team"
                  :items="teamOptions"
                  label="Team *"
                  :rules="teamRules"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :disabled="submitting"
                  hint="Chọn team sẽ tham gia voting"
                  persistent-hint
                />

                <!-- Deadline -->
                <div class="mb-4">
                  <v-label class="text-body-2 text-medium-emphasis mb-2">
                    Thời hạn voting *
                  </v-label>
                  <VueDatePicker
                    v-model="formData.date"
                    :disabled="submitting"
                    :min-date="minDate"
                    :format="dateFormat"
                    :preview-format="dateFormat"
                    locale="vi"
                    :enable-time-picker="true"
                    :is-24="true"
                    placeholder="Chọn ngày và giờ kết thúc"
                    class="dp-custom"
                    :class="{ 'dp-error': dateError }"
                    @update:model-value="validateDate"
                  />
                  <div v-if="dateError" class="text-error text-caption mt-1">
                    {{ dateError }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Chọn thời điểm kết thúc voting (phải sau thời điểm hiện tại)
                  </div>
                </div>

                <!-- Vote Type -->
                <v-select
                  v-model="formData.voteType"
                  :items="voteTypeOptions"
                  label="Loại voting *"
                  :rules="voteTypeRules"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :disabled="submitting"
                  hint="Chọn loại voting cho topic"
                  persistent-hint
                />

                <!-- Option Requirements -->
                <v-select
                  v-model="formData.requireField"
                  :items="requireFieldOptions"
                  label="Yêu cầu cho Options *"
                  :rules="requireFieldRules"
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                  :disabled="submitting"
                  hint="Chọn trường bắt buộc khi tạo options"
                  persistent-hint
                />

                <!-- Active Status -->
                <v-switch
                  v-model="formData.status"
                  label="Kích hoạt topic"
                  :disabled="submitting"
                  color="primary"
                  class="mb-4"
                  hint="Topic sẽ được kích hoạt ngay sau khi tạo"
                  persistent-hint
                />
              </v-form>
            </v-card-text>

            <v-card-actions class="px-6 pb-6">
              <v-btn
                variant="outlined"
                @click="handleCancel"
                :disabled="submitting"
                class="text-none"
              >
                Hủy
              </v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                @click="handleSubmit"
                :loading="submitting"
                :disabled="!formValid || !!dateError"
                class="text-none"
              >
                {{ isEditMode ? 'Cập nhật' : 'Tạo Topic' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTopicStore } from '@/stores/topic'
import { useAuthStore } from '@/stores/auth'
import { useCreateTopic, useUpdateTopic, getTopicById } from '@/services/topic.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import { ETopicTeam, ETopicRequireField, ETopicVoteType, EUserRole } from '@/core/constants/enum'
import VueDatePicker from '@vuepic/vue-datepicker'

// Composables
const route = useRoute()
const router = useRouter()
const topicStore = useTopicStore()
const authStore = useAuthStore()

// Refs
const formRef = ref()
const formValid = ref(false)
const submitting = ref(false)
const dateError = ref('')

// Form data
const formData = reactive<{
  name: string
  description: string
  team: string
  date: Date | null
  voteType: string
  requireField: string
  status: boolean
}>({
  name: '',
  description: '',
  team: ETopicTeam.ALL,
  date: null,
  voteType: ETopicVoteType.SINGLE,
  requireField: ETopicRequireField.TITLE,
  status: true
})

// Snackbar state
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed properties
const isAdmin = computed(() => {
  return authStore.user?.role === EUserRole.ADMIN
})

const isEditMode = computed(() => {
  return !!route.query.edit
})

const topicId = computed(() => {
  return route.query.edit as string
})

const minDate = computed(() => {
  return new Date()
})

// Form options
const teamOptions = [
  { title: 'Frontend', value: ETopicTeam.FE },
  { title: 'Backend', value: ETopicTeam.BE },
  { title: 'Tất cả Teams', value: ETopicTeam.ALL }
]

const voteTypeOptions = [
  { title: 'Một lựa chọn (Single Vote)', value: ETopicVoteType.SINGLE },
  { title: 'Nhiều lựa chọn (Multiple Vote)', value: ETopicVoteType.MULTIPLE }
]

const requireFieldOptions = [
  { title: 'Chỉ yêu cầu tiêu đề', value: ETopicRequireField.TITLE },
  { title: 'Chỉ yêu cầu link', value: ETopicRequireField.LINK },
  { title: 'Yêu cầu cả tiêu đề và link', value: ETopicRequireField.ALL }
]

// Validation rules
const nameRules = [
  (value: string) => {
    if (!value || value.trim().length === 0) return 'Tên topic là bắt buộc'
    if (value.length > 200) return 'Tên topic không được vượt quá 200 ký tự'
    return true
  }
]

const descriptionRules = [
  (value: string) => {
    if (value && value.length > 1000) return 'Mô tả không được vượt quá 1000 ký tự'
    return true
  }
]

const teamRules = [
  (value: string) => {
    if (!value) return 'Vui lòng chọn team'
    return true
  }
]

const voteTypeRules = [
  (value: string) => {
    if (!value) return 'Vui lòng chọn loại voting'
    return true
  }
]

const requireFieldRules = [
  (value: string) => {
    if (!value) return 'Vui lòng chọn yêu cầu cho options'
    return true
  }
]

// Date formatting
const dateFormat = 'dd/MM/yyyy HH:mm'

// Vue Query mutations
const createMutation = useCreateTopic()
const updateMutation = useUpdateTopic()

// Methods
const validateDate = () => {
  if (!formData.date) {
    dateError.value = 'Thời hạn voting là bắt buộc'
    return false
  }

  if (formData.date <= new Date()) {
    dateError.value = 'Thời hạn voting phải sau thời điểm hiện tại'
    return false
  }

  dateError.value = ''
  return true
}

const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.team = ETopicTeam.ALL
  formData.date = null
  formData.voteType = ETopicVoteType.SINGLE
  formData.requireField = ETopicRequireField.TITLE
  formData.status = true
  dateError.value = ''

  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

const loadTopicForEdit = async () => {
  if (!topicId.value) return

  try {
    // Load topic detail from service
    const topic = await getTopicById(topicId.value)
    if (topic) {
      formData.name = topic.name || ''
      formData.description = topic.description || ''
      formData.team = topic.team || ETopicTeam.ALL
      formData.date = topic.date ? new Date(topic.date) : null
      formData.voteType = ETopicVoteType.SINGLE // Default since not in current interface
      formData.requireField = topic.requireField || ETopicRequireField.TITLE
      formData.status = topic.status !== false
    }
  } catch (error) {
    console.error('Failed to load topic for edit:', error)
    showSnackbar('Lỗi khi tải thông tin topic', 'error')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid || !validateDate()) return

  submitting.value = true

  try {
    const topicData: Partial<ITopic> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      team: formData.team as `${ETopicTeam}`,
      date: formData.date!,
      requireField: formData.requireField as `${ETopicRequireField}`,
      status: formData.status
    }

    if (isEditMode.value) {
      await updateMutation.mutateAsync({
        id: topicId.value,
        data: topicData
      })
      showSnackbar('Topic đã được cập nhật thành công!', 'success')
    } else {
      await createMutation.mutateAsync(topicData)
      showSnackbar('Topic đã được tạo thành công!', 'success')
      resetForm()
    }

    // Navigate back to topic list after a short delay
    setTimeout(() => {
      goToTopicList()
    }, 1500)

  } catch (error) {
    console.error('Failed to save topic:', error)
    showSnackbar(
      isEditMode.value ? 'Lỗi khi cập nhật topic' : 'Lỗi khi tạo topic',
      'error'
    )
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  if (submitting.value) return

  // Show confirmation if form has data
  const hasData = formData.name || formData.description || formData.date
  if (hasData) {
    if (confirm('Bạn có chắc chắn muốn hủy? Dữ liệu đã nhập sẽ bị mất.')) {
      goToTopicList()
    }
  } else {
    goToTopicList()
  }
}

const goToTopicList = () => {
  router.push({ name: 'topicList' })
}

const showSnackbar = (message: string, color: 'success' | 'error' | 'warning' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Watchers
watch(() => formData.date, validateDate)

// Lifecycle
onMounted(async () => {
  if (!isAdmin.value) {
    showSnackbar('Bạn không có quyền truy cập trang này', 'error')
    return
  }

  if (isEditMode.value) {
    await loadTopicForEdit()
  }
})
</script>

<style scoped>
.dp-custom {
  --dp-font-family: 'Roboto', sans-serif;
  --dp-border-radius: 4px;
  --dp-input-padding: 12px 16px;
}

.dp-error {
  --dp-border-color: rgb(var(--v-theme-error));
}

:deep(.dp__input) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 0.2s ease-in-out;
}

:deep(.dp__input:hover) {
  border-color: rgba(var(--v-theme-on-surface), 0.87);
}

:deep(.dp__input:focus) {
  border-color: rgb(var(--v-theme-primary));
  outline: none;
}

:deep(.dp__input_wrap) {
  min-height: 56px;
}
</style>
