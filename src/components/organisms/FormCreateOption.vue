<template>
  <v-dialog :model-value="dialogValue" @update:model-value="handleDialogUpdate" max-width="375" min-width="375">
    <template v-if="!hideActivator" v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        prepend-icon="mdi-plus"
        width="fit-content"
        color="primary"
        height="46"
        @click="handleResetForm"
      >
        Thêm option
      </v-btn>
    </template>
    <template v-slot:default>
      <v-card style="background-color: white; padding: 16px">
        <template v-slot:title>
          <p class="font-weight-black text-center">Thêm Option</p>
        </template>
        <v-form @submit.prevent :fast-fail="false">
          <v-text-field
            v-if="normalizedTopic && checkTitleRequired(normalizedTopic)"
            v-model="form.title"
            label="Tiêu đề"
            :rules="titleRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="form.title"
            label="Tiêu đề"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-if="normalizedTopic && checkLinkRequired(normalizedTopic)"
            v-model="form.link"
            label="Link"
            :rules="linkRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="form.link"
            label="Link"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-file-input
            :model-value="image"
            @update:model-value="handleFileChange"
            label="Hình tùy chọn (max 5MB)"
            accept="image/*"
            :disabled="isLoading"
            variant="outlined"
            prepend-icon="mdi-image"
            :error-messages="uploadMessage"
            clearable
          ></v-file-input>

          <v-btn
            text="Huỷ"
            color="red-darken-2"
            @click="handleCancel"
            variant="flat"
            :disabled="isLoading"
          ></v-btn>
          <v-btn
            type="submit"
            @click="handleAddOption"
            class="mb-2 float-right"
            color="blue-darken-2"
            variant="flat"
            min-width="100"
            :loading="isLoading"
            :disabled="isLoading"
            >Thêm mới option</v-btn
          >
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { postNewOption } from '@/services/option.service'
import { reactive, ref, computed, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  handleValidateAddOption,
  linkRules,
  titleRules,
  checkLinkRequired,
  checkTitleRequired
} from '@/views/Admin/Admin.validate'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IState } from '@/core/interfaces/model/state'
import { THUMBNAIL_MAX_SIZE } from '@/core/constants/app'
import { queryKeys } from '@/types/api'
import { useSnackbar } from '@/core/hooks/useSnackbar'

const props = withDefaults(defineProps<{
  id: string
  topicState: ITopic | IState<ITopic>
  options: IOption[]
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

const uploadMessage = ref('')
const isLoading = ref(false)

const form = reactive({
  link: '',
  title: ''
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

// Normalize topicState: handle both ITopic and IState<ITopic>
const normalizedTopic = computed<ITopic | undefined>(() => {
  if (!props.topicState) return undefined
  // Check if it's IState<ITopic> (has data property)
  if ('data' in props.topicState && props.topicState.data) {
    return props.topicState.data
  }
  // Otherwise it's ITopic directly
  return props.topicState as ITopic
})

const image = ref<File[] | undefined>(undefined)
const queryClient = useQueryClient()
const { showSuccess, showError } = useSnackbar()

// Watch modelValue to sync internal state when controlled
watch(() => props.modelValue, (newValue) => {
  if (isControlled.value && newValue === false) {
    handleResetForm()
  }
})

/** handle user upload and change thubmnail file event */
const handleFileChange = (files: File[] | undefined) => {
  if (files && files.length > 0) {
    const file = files[0]

    // Check file size limit (5MB)
    if (file.size > THUMBNAIL_MAX_SIZE) {
      uploadMessage.value = 'File size exceeds 5MB limit!'
      image.value = undefined
    } else {
      image.value = files
      uploadMessage.value = ''
    }
  } else {
    image.value = undefined
    uploadMessage.value = ''
  }
}

/**
 * handle add option
 * check if option exited, noti error
 * else add option to firebase
 */
const handleAddOption = async () => {
  // Prevent spam clicking
  if (isLoading.value) {
    return
  }

  try {
    if (normalizedTopic.value && handleValidateAddOption(form, normalizedTopic.value) === true) {
      let optionExited = false
      props.options.forEach((option) => {
        if (
          (option.title && option.title === form?.title) ||
          (option.link && option.link === form?.link)
        ) {
          showError('Option này đã tồn tại, vui lòng nhập lại!')
          optionExited = true
          return
        }
      })
      if (optionExited) {
        return
      }

      // Set loading state
      isLoading.value = true

      // Get first file from array if exists
      const imageFile = image.value && image.value.length > 0 ? image.value[0] : null
      
      await postNewOption(form.title, form.link, props.id, imageFile)
      
      // Show success message
      showSuccess('Tạo mới option thành công!')
      
      // Invalidate cache to reload options list
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(props.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(props.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(props.id) })
      
      // Reset form and close dialog
      handleResetForm()
      dialogValue.value = false
      emit('close')
    }
  } catch (error) {
    console.error('Failed to create option:', error)
    const errorMessage = error instanceof Error ? error.message : 'Tạo mới không thành công!'
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

// reset form on open form
const handleResetForm = () => {
  form.link = ''
  form.title = ''
  image.value = undefined
  uploadMessage.value = ''
  isLoading.value = false
}
</script>
