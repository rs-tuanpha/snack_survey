<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-title
        expand-icon="mdi-plus"
        collapse-icon="mdi-minus"
        @click="handleResetForm"
      >
        Thêm option
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-form @submit.prevent>
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

          <v-btn
            type="submit"
            @click="handleAddOption"
            class="mb-2 float-right"
            color="blue-darken-2"
            size="large"
            variant="flat"
            min-width="100"
            >Thêm mới option</v-btn
          >
        </v-form>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
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

const form = reactive({
  link: '',
  title: ''
})

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
        if (option.title === form?.title || option.link === form?.link) {
          hasError.value = true
          message.value = 'Option này đã tồn tại, vui lòng nhập lại!'
          optionExited = true
          return
        }
      })
      if (optionExited) {
        return
      }
      await postNewOption(form.title, form.link, props.id)
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
      message.value = ''
    }, 2000)
  }
}

// reset form on open form
const handleResetForm = () => {
  form.link = ''
  form.title = ''
}
</script>

<style scoped></style>
