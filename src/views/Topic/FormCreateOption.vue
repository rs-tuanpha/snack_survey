<template>
  <div class="flex gap-2 items-center">
    <UiButton variant="primary" size="md" @click="handleResetForm">
      <i class="mdi mdi-plus"></i> Thêm option
    </UiButton>
    <UiDialog v-model="isOpen" title="Thêm Option">
      <form @submit.prevent="handleAddOption">
        <UiAlert
          v-if="message"
          :type="hasError ? 'error' : 'success'"
          :message="message as string"
        />
        <div class="space-y-3 mt-3">
          <UiInput
            v-if="props.topicState && checkTitleRequired(props.topicState)"
            v-model="form.title"
            label="Tiêu đề"
          />
          <UiInput
            v-else
            v-model="form.title"
            label="Tiêu đề"
          />

          <UiInput
            v-if="props.topicState && checkLinkRequired(props.topicState)"
            v-model="form.link"
            label="Link"
          />
          <UiInput
            v-else
            v-model="form.link"
            label="Link"
          />

          <div v-if="props.topicState.link">
            <label class="block theme-label text-ink mb-2">
              Upload Image (optional, max 5MB)
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="theme-control w-full font-sans text-sm text-ink px-4 py-2.5 outline-none file:mr-3 file:py-1.5 file:px-3 file:border-0 file:rounded-full file:bg-terracotta file:text-white file:font-sans file:font-bold file:text-[12px] file:cursor-pointer"
            />
            <p v-if="uploadMessage" class="font-sans text-xs text-terracotta mt-1">{{ uploadMessage }}</p>
          </div>
        </div>

        <div class="flex justify-between items-center mt-4">
          <UiButton variant="secondary" size="sm" shape="rounded" :disabled="submitting" @click="isOpen = false">
            Huỷ
          </UiButton>
          <UiButton
            type="submit"
            variant="primary"
            size="sm"
            shape="rounded"
            :disabled="submitting"
            @click="handleAddOption"
          >
            {{ submitting ? 'Đang thêm...' : 'Thêm mới option' }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { UiAlert, UiButton, UiDialog, UiInput } from '@/components/ui'
import { DuplicateOptionError, isDuplicateInTopic, postNewOption } from '@/services/option.service'
import { reactive, ref } from 'vue'
import {
  handleValidateAddOption,
  checkLinkRequired,
  checkTitleRequired
} from '../Admin/Admin.validate'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import { THUMBNAIL_MAX_SIZE } from '@/core/constants/app'

const props = defineProps<{
  id: string
  topicState: ITopic
  options: IOption[]
}>()

const hasError = ref<boolean>(false)
const message = ref<string>('')
const uploadMessage = ref('')
const submitting = ref(false)

const form = reactive({
  link: '',
  title: ''
})

const isOpen = ref(false)
const image = ref<File | null>(null)

/** handle user upload and change thubmnail file event */
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    const file = target.files[0]

    // Check file size limit (5MB)
    if (file.size > THUMBNAIL_MAX_SIZE) {
      uploadMessage.value = 'File size exceeds 5MB limit!'
      image.value = null
    } else {
      image.value = file
      uploadMessage.value = ''
    }
  }
}

const resetFields = () => {
  form.title = ''
  form.link = ''
  image.value = null
  uploadMessage.value = ''
}

/**
 * Add option — unique by link within topic (title when link empty).
 */
const handleAddOption = async () => {
  if (submitting.value) return
  if (!props.topicState || handleValidateAddOption(form, props.topicState) !== true) return

  if (isDuplicateInTopic(form, props.options)) {
    hasError.value = true
    message.value = 'Option với link này đã tồn tại, vui lòng nhập link khác!'
    return
  }

  submitting.value = true
  hasError.value = false
  message.value = ''
  try {
    await postNewOption(form.title, form.link, props.id, image.value)
    hasError.value = false
    message.value = 'Tạo mới thành công'
    resetFields()
    setTimeout(() => {
      message.value = ''
      isOpen.value = false
      submitting.value = false
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

// reset form on open form
const handleResetForm = () => {
  resetFields()
  message.value = ''
  hasError.value = false
  isOpen.value = true
}
</script>
