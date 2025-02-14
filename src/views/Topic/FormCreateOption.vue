<template>
  <v-dialog v-model="isOpen" max-width="340">
    <template v-slot:activator="{ props: activatorProps }">
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
    <template v-slot:default="{ isActive }">
      <v-card title="Thêm Option" style="background-color: white; padding: 8px">
        <v-form @submit.prevent :fast-fail="false">
          <v-alert
            v-if="message"
            border="start"
            variant="tonal"
            closable
            :color="hasError ? ENotificationColor.ERROR : ENotificationColor.SUCCESS"
            class="mb-2"
          >
            {{ message }}</v-alert
          >
          <v-text-field
            v-if="props.topicState && checkTitleRequired(props.topicState)"
            v-model="form.title"
            label="Tiêu đề"
            :rules="titleRules"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="form.title"
            label="Tiêu đề"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-if="props.topicState && checkLinkRequired(props.topicState)"
            v-model="form.link"
            label="Link"
            :rules="linkRules"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="form.link"
            label="Link"
            single-line
            variant="outlined"
          ></v-text-field>
          <v-file-input
              v-if="props.topicState.link"
              label="Upload Image (optional, max 5MB)"
              accept="image/*"
              outlined
              @change="handleFileChange"
              :error-messages="uploadMessage"
            ></v-file-input>

          <v-btn
            text="Huỷ"
            color="red-darken-2"
            @click="isActive.value = false"
            variant="flat"
          ></v-btn>
          <v-btn
            type="submit"
            @click="handleAddOption"
            class="mb-2 float-right"
            color="blue-darken-2"
            variant="flat"
            min-width="100"
            >Thêm mới option</v-btn
          >
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { postNewOption } from '@/services/option.service'
import { reactive, ref } from 'vue'
import {
  handleValidateAddOption,
  linkRules,
  titleRules,
  checkLinkRequired,
  checkTitleRequired
} from '../Admin/Admin.validate'
import { ENotificationColor } from '@/core/constants/enum'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import { THUMBNAIL_MAX_SIZE } from '@/core/constants/app'

const props = defineProps<{
  id: string
  topicState: ITopic
  options: IOption[]
}>()

const emits = defineEmits<{
  (e: 'reloadOptions'): void
  (e: 'updateOptionsData'): void
}>()

const hasError = ref<boolean>(false)
const message = ref<String>('')
const uploadMessage = ref('')

const form = reactive({
  link: '',
  title: ''
})

const isOpen = ref(false);
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
      emits('reloadOptions')
      emits('updateOptionsData')
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
  isOpen.value = true;
}
</script>
