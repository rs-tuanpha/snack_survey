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
                @click="updateOption"
                variant="elevated"
              >
                Cập nhật</v-btn
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
import {
  handleValidateAddOption,
  linkRules,
  titleRules,
  checkLinkRequired,
  checkTitleRequired
} from './Admin.validate'
import { ENotificationColor } from '@/core/constants/enum'
import { getOptionsByTopicId, putOptionData } from '@/services/option.service'
import type { IOptionVoteCountDto } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import type { ITopicCreateDto } from '@/core/interfaces/model/topic'

const props = defineProps<{
  option: IOptionVoteCountDto
  optionList: IOptionVoteCountDto[]
  topicState: IState<ITopicCreateDto>
}>()

const emits = defineEmits(['onClose', 'update:optionList'])

// State
const dialogVisible = ref(true)
const hasError = ref<boolean>(false)
const message = ref<string>('')
const optionFormData = reactive<IOptionVoteCountDto>({ ...props.option })

/**
 * close dialog
 */
const handleClose = () => {
  dialogVisible.value = false
  emits('onClose')
}
/**
 * validate topic data and create option
 */
const updateOption = async () => {
  try {
    if (
      props.topicState.data &&
      optionFormData &&
      handleValidateAddOption(
        { title: optionFormData.name, link: optionFormData.link },
        props.topicState.data
      ) === true
    ) {
      await putOptionData(optionFormData)
      const topicData = await getOptionsByTopicId(props.topicState.data.id)
      emits('update:optionList', topicData.value)
      hasError.value = false
      message.value = 'Cập nhật thành công'
    }
  } catch {
    hasError.value = true
    message.value = 'Cập nhật không thành công!'
  } finally {
    setTimeout(() => {
      message.value = ''
    }, 2000)
  }
}
</script>

<style scoped></style>
