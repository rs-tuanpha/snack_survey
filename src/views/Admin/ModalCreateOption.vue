<template>
  <!-- Modal create option for topic -->
  <UiDialog v-model="dialogVisible" title="Option">
    <form @submit.prevent="createOption">
      <UiInput
        v-if="props.topicState.data && checkTitleRequired(props.topicState.data)"
        v-model="optionFormData.title"
        label="Tiêu đề"
      />
      <UiInput v-else v-model="optionFormData.title" label="Tiêu đề" />

      <UiInput
        v-if="props.topicState.data && checkLinkRequired(props.topicState.data)"
        v-model="optionFormData.link"
        label="Link"
      />
      <UiInput v-else v-model="optionFormData.link" class="mt-4" label="Link" />

      <div class="flex gap-4 mt-4">
        <UiButton type="button" block variant="secondary" :disabled="submitting" @click="handleClose">
          Đóng
        </UiButton>
        <UiButton type="submit" block variant="primary" :disabled="submitting">
          {{ submitting ? 'Đang tạo...' : 'Tạo mới' }}
        </UiButton>
      </div>
    </form>
    <UiAlert
      v-if="message"
      class="mt-2"
      :type="hasError ? 'error' : 'success'"
      :message="message"
    />
  </UiDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { UiButton, UiDialog, UiInput, UiAlert } from '@/components/ui'
import { initOption } from './Admin.state'
import {
  handleValidateAddOption,
  checkTitleRequired,
  checkLinkRequired
} from './Admin.validate'
import { DuplicateOptionError, postNewOption } from '@/services/option.service'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import type { ITopic } from '@/core/interfaces/model/topic'

const props = defineProps<{
  topicState: IState<ITopic>
}>()
const emits = defineEmits(['onClose'])

const dialogVisible = ref(true)
const hasError = ref(false)
const message = ref('')
const submitting = ref(false)
const optionFormData = reactive<IOption>({ ...initOption })

const handleClose = () => {
  if (submitting.value) return
  optionFormData.title = ''
  optionFormData.link = ''
  dialogVisible.value = false
  emits('onClose')
}

/**
 * Create option — unique by link within topic (enforced in postNewOption).
 */
const createOption = async () => {
  if (submitting.value) return
  const topicStateData = props.topicState.data
  if (!topicStateData || handleValidateAddOption(optionFormData, topicStateData) !== true) return

  submitting.value = true
  hasError.value = false
  message.value = ''
  try {
    await postNewOption(optionFormData.title, optionFormData.link, topicStateData.id)
    hasError.value = false
    message.value = 'Tạo mới thành công'
    setTimeout(() => {
      optionFormData.title = ''
      optionFormData.link = ''
      message.value = ''
      submitting.value = false
      handleClose()
    }, 1200)
  } catch (e) {
    hasError.value = true
    if (e instanceof DuplicateOptionError) {
      message.value = 'Option với link này đã tồn tại, vui lòng nhập link khác!'
    } else {
      message.value = 'Tạo mới không thành công!'
    }
    submitting.value = false
  }
}
</script>
