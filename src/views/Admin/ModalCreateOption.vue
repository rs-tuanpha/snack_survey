<template>
  <!-- Modal create option for topic -->
  <v-dialog v-model="dialogVisible" persistent max-width="400">
    <v-card class="pb-4">
      <v-card-text>
        <p class="font-weight-black text-center">Option</p>
        <v-form @submit.prevent>
          <v-text-field
            v-if="props.topicState.data && checkTitleRequired(props.topicState.data)"
            v-model="optionFormData.title"
            label="Tiêu đề"
            :rules="titleRules"
          ></v-text-field>
          <v-text-field v-else v-model="optionFormData.title" label="Tiêu đề"></v-text-field>

          <v-text-field
            v-if="props.topicState.data && checkLinkRequired(props.topicState.data)"
            v-model="optionFormData.link"
            label="Link"
            :rules="linkRules"
          ></v-text-field>
          <v-text-field v-else v-model="optionFormData.link" label="Link"></v-text-field>
          <v-row>
            <v-col>
              <v-btn
                type="submit"
                block
                class="mt-2 bg-red-darken-2"
                @click="handleClose"
                variant="elevated"
              >
                Đóng</v-btn
              >
            </v-col>
            <v-col>
              <v-btn
                type="submit"
                block
                class="mt-2 bg-blue-darken-2"
                @click="createOption"
                variant="elevated"
              >
                Tạo mới</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-alert
          v-if="message"
          border="start"
          variant="tonal"
          closable
          :color="hasError ? ENotificationColor.ERROR : ENotificationColor.SUCCESS"
          class="mt-2"
        >
          {{ message }}</v-alert
        >
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { initOption } from './Admin.state'
import {
  handleValidateAddOption,
  linkRules,
  titleRules,
  checkTitleRequired,
  checkLinkRequired
} from './Admin.validate'
import { getOptionsByTopicId, postNewOption } from '@/services/option.service'
import { ENotificationColor } from '@/core/constants/enum'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import type { ITopic } from '@/core/interfaces/model/topic'

const props = defineProps<{
  topicState: IState<ITopic>
}>()
const emits = defineEmits(['onClose'])

// State
const dialogVisible = ref(true)
const hasError = ref<boolean>(false)
const message = ref<string>('')
const optionFormData = reactive<IOption>(initOption)

/**
 * close dialog
 */
const handleClose = () => {
  optionFormData.title = ''
  optionFormData.link = ''
  dialogVisible.value = false
  emits('onClose')
}
/**
 * validate topic data and create option
 */
const createOption = async () => {
  try {
    if (
      props.topicState.data &&
      optionFormData &&
      handleValidateAddOption(optionFormData, props.topicState.data) === true
    ) {
      const optionList = await getOptionsByTopicId(props.topicState.data.id)
      optionList.forEach((option) => {
        if (option.title === optionFormData?.title || option.link === optionFormData?.link) {
          hasError.value = true
          message.value = 'Option này đã tồn tại, vui lòng nhập lại!'
          return
        }
      })
      await postNewOption(optionFormData.title, optionFormData.link, props.topicState.data.id)
      hasError.value = false
      message.value = 'Tạo mới thành công'
    }
  } catch {
    hasError.value = false
    message.value = 'Tạo mới không thành công!'
  } finally {
    setTimeout(() => {
      optionFormData.title = ''
      optionFormData.link = ''
      message.value = ''
    }, 2000)
  }
}
</script>

<style scoped></style>
