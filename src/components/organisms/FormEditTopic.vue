<template>
  <v-dialog :model-value="dialogValue" @update:model-value="handleDialogUpdate" max-width="500" min-width="400">
    <template v-if="!hideActivator" v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        prepend-icon="mdi-pencil"
        width="fit-content"
        color="primary"
        height="46"
      >
        Chỉnh sửa topic
      </v-btn>
    </template>
    <template v-slot:default>
      <v-card style="background-color: white; padding: 16px">
        <template v-slot:title>
          <p class="font-weight-black text-center">Chỉnh sửa Topic</p>
        </template>
        <v-form @submit.prevent :fast-fail="false">
          <v-text-field
            v-model="form.title"
            label="Tên topic"
            :rules="nameRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-model="form.description"
            label="Mô tả"
            :rules="descriptionRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <!-- Start Date -->
          <div class="d-flex mb-2">
            <p class="font-weight-medium pr-2 pt-1">
              <v-chip color="primary" label>
                <v-icon start icon="mdi-calendar-start"></v-icon>Ngày bắt đầu</v-chip
              >
            </p>
            <vue-date-picker
              v-model="form.startDate"
              :min-date="minDate"
              :enable-time-picker="true"
              :is-24="true"
              placeholder="Chọn ngày bắt đầu"
              :disabled="isLoading"
            ></vue-date-picker>
          </div>

          <!-- End Date -->
          <div class="d-flex mb-4">
            <p class="font-weight-medium pr-2 pt-1">
              <v-chip color="primary" label>
                <v-icon start icon="mdi-calendar-end"></v-icon>Ngày kết thúc</v-chip
              >
            </p>
            <vue-date-picker
              v-model="form.endDate"
              :min-date="form.startDate || minDate"
              :enable-time-picker="true"
              :is-24="true"
              placeholder="Chọn ngày kết thúc"
              :disabled="isLoading"
            ></vue-date-picker>
          </div>

          <v-switch
            v-model="form.isActive"
            hide-details
            color="green-darken-1"
            inset
            :label="`Trạng thái: ${form.isActive ? 'Mở' : 'Đóng'}`"
            :disabled="isLoading"
            class="mb-2"
          ></v-switch>

          <v-switch
            v-model="form.isMutable"
            hide-details
            color="blue-darken-1"
            inset
            :label="`Cho phép thêm option: ${form.isMutable ? 'Có' : 'Không'}`"
            :disabled="isLoading"
            class="mb-2"
          ></v-switch>

          <v-radio-group inline v-model="form.voteType" class="mt-2" :disabled="isLoading">
            <v-chip color="primary" label
              ><v-icon start icon="mdi-vote"></v-icon>Loại vote</v-chip
            >
            <v-radio label="Đơn" value="single"></v-radio>
            <v-radio label="Nhiều" value="multiple"></v-radio>
          </v-radio-group>

          <v-btn
            text="Huỷ"
            color="red-darken-2"
            @click="handleCancel"
            variant="flat"
            :disabled="isLoading"
            class="mt-4"
          ></v-btn>
          <v-btn
            type="submit"
            @click="handleUpdateTopic"
            class="mb-2 float-right mt-4"
            color="blue-darken-2"
            variant="flat"
            min-width="100"
            :loading="isLoading"
            :disabled="isLoading"
            >Cập nhật topic</v-btn
          >
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useUpdateTopic } from '@/services/topic.service'
import { nameRules, descriptionRules } from '@/views/Admin/Admin.validate'
import { ETopicVoteType } from '@/core/constants/enum'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { UpdateTopicRequest } from '@/types/api'
import { useSnackbar } from '@/core/hooks/useSnackbar'

const props = withDefaults(defineProps<{
  topic: ITopic
  modelValue?: boolean
  hideActivator?: boolean
}>(), {
  modelValue: undefined,
  hideActivator: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const isLoading = ref(false)
const updateTopicMutation = useUpdateTopic()
const { showSuccess, showError } = useSnackbar()

const form = reactive({
  title: '',
  description: '',
  voteType: ETopicVoteType.SINGLE,
  isActive: true,
  isMutable: true,
  startDate: null as Date | null,
  endDate: null as Date | null
})

// Internal state for uncontrolled mode (when modelValue is not provided)
const internalIsOpen = ref(false)

// Computed to determine if we're in controlled mode
const isControlled = computed(() => props.modelValue !== undefined)

// Dialog value: use modelValue if controlled, otherwise use internal state
const dialogValue = computed({
  get: () => isControlled.value ? props.modelValue! : internalIsOpen.value,
  set: (value: boolean) => {
    if (isControlled.value) {
      emit('update:modelValue', value)
    } else {
      internalIsOpen.value = value
    }
  }
})

const minDate = computed(() => new Date())

// Watch topic prop to populate form when dialog opens
watch(() => [props.topic, props.modelValue], ([newTopic, isOpen]) => {
  if (newTopic && isOpen) {
    form.title = newTopic.title
    form.description = newTopic.description || ''
    form.voteType = (newTopic.votingType ?? ETopicVoteType.SINGLE) as ETopicVoteType
    form.isActive = newTopic.isActive !== false
    form.isMutable = newTopic.isMutable !== false
    form.startDate = newTopic.startDate ? new Date(newTopic.startDate) : null
    form.endDate = newTopic.endDate ? new Date(newTopic.endDate) : null
  }
}, { immediate: true })

// Watch modelValue to sync internal state when controlled
watch(() => props.modelValue, (newValue) => {
  if (isControlled.value && newValue === false) {
    handleResetForm()
  } else if (newValue === true && props.topic) {
    // Populate form when dialog opens
    form.title = props.topic.title
    form.description = props.topic.description || ''
    form.voteType = (props.topic.votingType ?? ETopicVoteType.SINGLE) as ETopicVoteType
    form.isActive = props.topic.isActive !== false
    form.isMutable = props.topic.isMutable !== false
    form.startDate = props.topic.startDate ? new Date(props.topic.startDate) : null
    form.endDate = props.topic.endDate ? new Date(props.topic.endDate) : null
  }
})

const validateForm = (): string | true => {
  if (!form.title) {
    return 'Vui lòng nhập tên topic'
  }

  if (!form.startDate || !form.endDate) {
    return 'Vui lòng chọn ngày bắt đầu và ngày kết thúc'
  }

  if (form.endDate <= form.startDate) {
    return 'Ngày kết thúc phải sau ngày bắt đầu'
  }

  return true
}

const handleUpdateTopic = async () => {
  // Prevent spam clicking
  if (isLoading.value) {
    return
  }

  const validation = validateForm()
  if (validation !== true) {
    showError(validation)
    return
  }

  try {
    isLoading.value = true

    const updateData: UpdateTopicRequest = {
      title: form.title,
      description: form.description || undefined,
      voteType: form.voteType as 'single' | 'multiple',
      startDate: form.startDate!.toISOString(),
      endDate: form.endDate!.toISOString(),
      isActive: form.isActive,
      isMutable: form.isMutable
    }

    await updateTopicMutation.mutateAsync({
      topicId: props.topic._id,
      topicData: updateData
    })

    showSuccess('Cập nhật topic thành công!')

    handleResetForm()
    dialogValue.value = false
    emit('close')
  } catch (error) {
    console.error('Failed to update topic:', error)
    const errorMessage = error instanceof Error ? error.message : 'Cập nhật không thành công!'
    showError(errorMessage)
  } finally {
    isLoading.value = false
  }
}

// Handle dialog update
const handleDialogUpdate = (value: boolean) => {
  dialogValue.value = value
  if (!value) {
    emit('close')
  }
}

// Handle cancel button
const handleCancel = () => {
  handleResetForm()
  dialogValue.value = false
  emit('close')
}

// reset form
const handleResetForm = () => {
  if (props.topic) {
    form.title = props.topic.title
    form.description = props.topic.description || ''
    form.voteType = (props.topic.votingType ?? ETopicVoteType.SINGLE) as ETopicVoteType
    form.isActive = props.topic.isActive !== false
    form.isMutable = props.topic.isMutable !== false
    form.startDate = props.topic.startDate ? new Date(props.topic.startDate) : null
    form.endDate = props.topic.endDate ? new Date(props.topic.endDate) : null
  }
  isLoading.value = false
}
</script>

