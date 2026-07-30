<template>
  <div class="flex gap-2 items-center">
    <UiButton variant="primary" size="md" @click="handleResetForm">
      <i class="mdi mdi-plus"></i> Thêm option
    </UiButton>
    <UiDialog v-model="isOpen" title="Thêm Option">
      <form @submit.prevent>
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
          <UiButton variant="secondary" size="sm" shape="rounded" @click="isOpen = false">
            Huỷ
          </UiButton>
          <UiButton type="submit" variant="primary" size="sm" shape="rounded" @click="handleAddOption">
            Thêm mới option
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { UiAlert, UiButton, UiDialog, UiInput } from '@/components/ui'
import { postNewOption } from '@/services/option.service'
import { reactive, ref } from 'vue'
import {
  handleValidateAddOption,
  linkRules,
  titleRules,
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
const message = ref<String>('')
const uploadMessage = ref('')

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

/**
 * handle add option
 * check if option exited, noti error
 * else add option to firebase
 */
const handleAddOption = async () => {
  try {
    if (props.topicState && handleValidateAddOption(form, props.topicState) === true) {
      let optionExited = false
      props.options.forEach((option) => {
        if (
          (option.title && option.title === form?.title) ||
          (option.link && option.link === form?.link)
        ) {
          hasError.value = true
          message.value = 'Option này đã tồn tại, vui lòng nhập lại!'
          optionExited = true
          return
        }
      })
      if (optionExited) {
        return
      }
      await postNewOption(form.title, form.link, props.id, image.value)
      hasError.value = false
      message.value = 'Tạo mới thành công'
      handleResetForm()
    }
  } catch {
    hasError.value = false
    message.value = 'Tạo mới không thành công!'
  } finally {
    setTimeout(() => {
      form.title = ''
      form.link = ''
      image.value = null
      message.value = ''
      isOpen.value = false
    }, 2000)
  }
}

// reset form on open form
const handleResetForm = () => {
  form.link = ''
  form.title = ''
  image.value = null
  isOpen.value = true
}
</script>
