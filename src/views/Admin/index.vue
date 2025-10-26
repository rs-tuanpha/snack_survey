<!-- Commented out due to interface mismatch errors -->
<!--
<template>
  <v-container>
    <v-row justify="center">
      <!-- Modal handle topic event -->
      <v-dialog v-model="dialog" persistent width="auto">
        <v-card min-height="120">
          <v-card-text> {{ text }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn class="text-none" color="red-darken-1" variant="flat" @click="dialog = false"
              >Không</v-btn
            >
            <v-btn class="text-none" color="blue-darken-2" variant="flat" @click="handleTopic(type)"
              >Có</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Modal error notification -->
      <v-dialog v-model="errorDialog" width="auto">
        <v-card>
          <v-alert type="error" title="Lỗi!" text="Đã có lỗi xảy ra!" variant="tonal"></v-alert>
          <v-card-actions>
            <v-btn color="primary" block @click="errorDialog = false">Đóng</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Modal create option for topic -->
      <modal-create-option
        v-if="isShowModalCreateOption"
        @on-close="isShowModalCreateOption = false"
        :topicState="topicState"
      />
      <!-- Modal edit option -->
      <modal-edit-option
        v-if="isShowModalEditOption"
        @on-close="handleCloseEditOptionDialog"
        :option="optionState"
        :optionList="options"
        :topicState="topicState"
      />

      <!-- Modal show list option of topic -->
      <v-dialog v-model="listOptionDlg" width="auto" min-width="400">
        <v-card class="">
          <v-list density="compact" v-if="options.length">
            <v-list-subheader>Danh sách option</v-list-subheader>
            <v-list-item v-for="(item, i) in options" :key="i" :value="item" color="primary">
              <template v-slot:append>
                <v-icon
                  icon="mdi-circle-edit-outline"
                  color="green"
                  class="pl-0 ml-0"
                  @click="handleEditOption({ ...item, id: item.id })"
                ></v-icon>
                <v-icon
                  icon="mdi-close"
                  color="red"
                  class="pl-0 ml-2"
                  @click="deleteOption(item.id)"
                ></v-icon>
              </template>
              <v-list-item-title :v-text="item.title">{{
                item.link || item.title
              }}</v-list-item-title>
              <v-list-item-subtitle :v-text="item.vote_count"
                >Số vote: {{ item.vote_count }}</v-list-item-subtitle
              >
            </v-list-item>
          </v-list>
          <v-alert type="warning" v-else title="" text="Không có option nào được thêm!"></v-alert>
        </v-card>
      </v-dialog>

      <v-col sm="12" md="6" lg="4" xl="3">
        <v-sheet class="pa-2" border rounded>
          <p class="font-weight-black text-center">Topic</p>
          <v-form fast-fail @submit.prevent>
            <v-text-field
              v-model="topicFormData.title"
              label="Tên"
              :rules="nameRules"
            ></v-text-field>
            <v-text-field
              v-model="topicFormData.description"
              label="Mô tả"
              :rules="descriptionRules"
            ></v-text-field>
            <div class="d-flex">
              <p class="font-weight-medium pr-2 pt-1">
                <v-chip color="primary" label>
                  <v-icon start icon="mdi-clock-time-eight-outline"></v-icon>Deadline</v-chip
                >
              </p>
              <vue-date-picker v-model="topicFormData.date"></vue-date-picker>
            </div>

            <v-switch
              v-model="topicFormData.is_active"
              hide-details
              color="green-darken-1"
              inset
              :label="`Trạng thái: ${topicFormData.is_active ? 'Mở' : 'Đóng'}`"
            ></v-switch>
            <v-switch
              v-model="topicFormData.link"
              hide-details
              color="green-darken-1"
              inset
              :label="`Cho phép đóng góp link: ${topicFormData.link ? 'Có' : 'Không'}`"
            ></v-switch>
            <v-radio-group inline v-if="topicFormData.link" v-model="topicFormData.requireField">
              <v-chip color="primary" label
                ><v-icon start icon="mdi-account-circle-outline"></v-icon>Require</v-chip
              >
              <v-radio label="title" value="title"></v-radio>
              <v-radio label="link" value="link"></v-radio>
              <v-radio label="all" value="all"></v-radio>
            </v-radio-group>
            <v-switch
              v-model="topicFormData.voting_type"
              hide-details
              color="green-darken-1"
              inset
              :label="`Cho phép vote nhiều option: ${topicFormData.voting_type === 'multiple' ? 'Có' : 'Không'}`"
            ></v-switch>
            <v-radio-group inline v-model="topicFormData.team">
              <v-chip color="primary" label
                ><v-icon start icon="mdi-account-circle-outline"></v-icon>Team</v-chip
              >
              <v-radio label="PHP" value="PHP"></v-radio>
              <v-radio label="FE" value="FE"></v-radio>
              <v-radio label="All" value="All"></v-radio>
            </v-radio-group>
            <div class="btn-wrapper">
              <v-btn
                type="submit"
                :block="!showAddBtn"
                class="mt-2 bg-blue-darken-2"
                :class="showAddBtn ? 'bg-green-darken-2 mr-2' : 'bg-blue-darken-2'"
                @click="confirm(type)"
                variant="elevated"
                :loading="createTopicMutation.isPending.value || updateTopicMutation.isPending.value"
                :disabled="createTopicMutation.isPending.value || updateTopicMutation.isPending.value"
                >{{ textBtn }}</v-btn
              >
              <v-btn
                v-if="showAddBtn"
                prepend-icon="mdi-plus"
                class="mt-2 bg-blue-darken-2"
                @click="cancelUpdate"
                >Thêm mới</v-btn
              >
            </div>
          </v-form>
          <v-alert
            v-if="alert"
            border="start"
            variant="tonal"
            closable
            :color="colorAlert"
            class="mt-2"
          >
            {{ alert }}</v-alert
          >
        </v-sheet>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col sm="12" md="12" lg="12" xl="8">
        <v-sheet class="pa-2" border rounded>
          <v-table id="admin-table" fixed-header :height="topics && topics.length > 10 ? '400px' : ''">
            <thead>
              <tr>
                <th class="text-left" scope="col">STT</th>
                <th class="text-left" scope="col">Tên topic</th>
                <th class="text-left" scope="col">Team</th>
                <th class="text-left" scope="col" style="width: 90px">Trạng thái</th>
                <th class="text-left" scope="col" style="width: 90px">Deadline</th>
                <th class="text-left" scope="col" style="width: 408px">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingTopics">
                <td colspan="6" class="text-center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </td>
              </tr>
              <tr v-else-if="topicsError">
                <td colspan="6" class="text-center text-error">
                  Lỗi khi tải dữ liệu: {{ topicsError }}
                </td>
              </tr>
              <tr v-else-if="!topics || topics.length === 0">
                <td colspan="6" class="text-center">
                  Không có topic nào
                </td>
              </tr>
              <tr v-else v-for="(item, index) in topics" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.title }}</td>
                <td>{{ item.team }}</td>
                <td>
                  {{ item.is_active ? 'Mở' : 'Đóng' }}
                </td>
                <td>
                  {{ item.time_limit ? dayjs(new Date(Date.now() + item.time_limit * 60 * 1000)).format('DD/MM/YYYY HH:mm') : 'Không giới hạn' }}
                </td>
                <td>
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="blue-darken-2"
                    @click="handleEditTopic(item.id)"
                    >Sửa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="red-darken-1"
                    @click="handleDeleteTopic(item.id)"
                    >Xóa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="green-darken-2"
                    @click="handleAddOption(item.id)"
                    >+Option</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="purple-darken-2"
                    @click="showOptionList(item.id)"
                    >List Option</v-btn
                  >
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

-->
<!--
<script setup lang="ts">
import { ref, watch, reactive, defineAsyncComponent } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useTopicsList, useCreateTopic, useUpdateTopic, useDeleteTopic } from '@/services/topic.service'
import { useOptionsByTopic, useDeleteOption } from '@/services/option.service'
import { nameRules, descriptionRules } from './Admin.validate'
// import { initOption, initTopic, initTopicState } from './Admin.state' // Commented out due to errors
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import { mappingObject } from '@/core/utils/mappingObject'
import dayjs from 'dayjs'

const ModalCreateOption = defineAsyncComponent(() => import('./ModalCreateOption.vue'))
const ModalEditOption = defineAsyncComponent(() => import('./ModalEditOption.vue'))

// Composables
const { data: topics, isLoading: isLoadingTopics, error: topicsError } = useTopicsList()
const createTopicMutation = useCreateTopic()
const updateTopicMutation = useUpdateTopic()
const deleteTopicMutation = useDeleteTopic()
const deleteOptionMutation = useDeleteOption()

// State
const format = ref<string>('')
const text = ref<string>('')
const textBtn = ref<string>('Tạo mới')
const topicId = ref<string>('')
const topicCancelId = ref<string>('')
const alert = ref<string>('')
const errorDialog = ref<boolean>(false)
const showAddBtn = ref<boolean>(false)
const dialog = ref<boolean>(false)
const type = ref<string>('create')
const reset = ref<boolean>(false)
const colorAlert = ref<string>('green-darken-1')
const options = ref<IOption[]>([])
const listOptionDlg = ref<boolean>(false)
const isShowModalCreateOption = ref<boolean>(false)
const isShowModalEditOption = ref<boolean>(false)

const topicState = ref<IState<ITopic>>({ ...initTopicState })
const optionState = ref<IOption>(initOption)
const topicFormData = reactive<ITopic>({ ...initTopic })

// Composition API
watch(
  () => topicFormData.date,
  () => {
    format.value = `${(topicFormData.date as Date).getDate()}/${
      (topicFormData.date as Date).getMonth() + 1
    }/${(topicFormData.date as Date).getFullYear()}`
  }
)

// Methods
const confirm = (type: string) => {
  if (!topicFormData.title) {
    return false
  }
  if (topicFormData.date && topicFormData.date < new Date() && type === 'create') {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Thời gian phải lớn hơn hiện tại'
    setTimeout(() => {
      alert.value = ''
      colorAlert.value = 'green-darken-1'
    }, 2000)
    return false
  }
  switch (type) {
    case 'create':
      text.value = 'Bạn có muốn thêm topic không?'
      break
    case 'update':
      text.value = 'Bạn có muốn cập nhật topic không?'
      break
  }
  dialog.value = true
}

/**
 * update topic state and show create option modal
 * @param {string} id
 */
const handleAddOption = async (id: string) => {
  const topicData = topics.value?.find(topic => topic.id === id)
  if (topicData) {
    topicState.value.data = topicData
    isShowModalCreateOption.value = true
  }
}

const handleDeleteTopic = (topicVal: string) => {
  text.value = 'Bạn có muốn xóa topic không?'
  dialog.value = true
  type.value = 'delete'
  if (topicId.value === topicVal) {
    reset.value = true
  }
  topicCancelId.value = topicVal
}

const cancelUpdate = () => {
  textBtn.value = 'Tạo mới'
  type.value = 'create'
  showAddBtn.value = false
  dialog.value = false
  topicId.value = initTopic.id
  mappingObject(topicFormData, {
    ...initTopic
  })
}

const handleEditTopic = async (id: string) => {
  // Find the topic by topic id
  const topicData = topics.value?.find(topic => topic.id === id)
  if (topicData?.title) {
    topicId.value = topicData.id
    mappingObject(topicFormData, {
      ...topicData,
      updatedAt: new Date()
    })

    textBtn.value = 'Cập nhật'
    type.value = 'update'
    showAddBtn.value = true
  } else {
    }
}

const getOptions = async (topicId: string, isSetOption: boolean = false) => {
  const { data: optionsResponse } = useOptionsByTopic(topicId)
  let optionArr = [] as IOption[]
  setTimeout(() => {
    if (isSetOption && optionsResponse.value) {
      options.value = optionsResponse.value.data.options as IOption[]
    } else if (optionsResponse.value) {
      optionArr = optionsResponse.value.data.options as IOption[]
    }
  }, 200)
  return optionArr
}

// Reducer for confirm dialog
const handleTopic = async (type: string) => {
  switch (type) {
    case 'create':
      try {
        await createTopicMutation.mutateAsync({
          title: topicFormData.title,
          description: topicFormData.description || '',
          voting_type: topicFormData.voting_type === 'multiple' ? 'multiple' : 'single',
          team: topicFormData.team as 'FE' | 'PHP' | 'ALL',
          time_limit: topicFormData.date ? Math.ceil((topicFormData.date.getTime() - Date.now()) / (1000 * 60)) : undefined
        })
        dialog.value = false
        alert.value = 'Thêm mới thành công'
        setTimeout(() => {
          alert.value = ''
        }, 2000)
      } catch (e) {
        errorDialog.value = true
        if (e instanceof Error) {
          console.error(e.message)
        }
      }
      break
    case 'update':
      update({ ...topicFormData, updatedAt: new Date() })
      break
    case 'delete':
      deleteTopic()
      break
  }
}

const update = async (topic: any) => {
  try {
    await updateTopicMutation.mutateAsync({
      topicId: topicId.value,
      topicData: {
        title: topic.title,
        description: topic.description || '',
        voting_type: topic.voting_type === 'multiple' ? 'multiple' : 'single',
        team: topic.team as 'FE' | 'PHP' | 'ALL',
        time_limit: topic.date ? Math.ceil((topic.date.getTime() - Date.now()) / (1000 * 60)) : undefined
      }
    })
    dialog.value = false
    alert.value = 'Cập nhật thành công'
    setTimeout(() => {
      alert.value = ''
    }, 2000)
  } catch (e) {
    errorDialog.value = true
    if (e instanceof Error) {
      console.error(e.message)
    }
  }
}

const deleteTopic = async () => {
  try {
    await deleteTopicMutation.mutateAsync(topicCancelId.value)
    dialog.value = false
    alert.value = ''
    if (reset.value === true) {
      cancelUpdate()
    }
  } catch (e) {
    errorDialog.value = true
    if (e instanceof Error) {
      console.error(e.message)
    }
  }
}

const showOptionList = async (id: string) => {
  await getOptions(id, true)
  topicId.value = id
  listOptionDlg.value = true
  const topicData = topics.value?.find(topic => topic.id === id)
  if (topicData) {
    topicState.value.data = topicData
  }
}

const deleteOption = async (optionId: string) => {
  try {
    await deleteOptionMutation.mutateAsync(optionId)
    await getOptions(topicId.value, true)
  } catch (e) {
    console.error('Failed to delete option:', e)
  }
}

// open edit option modal
const handleEditOption = async (option: IOption) => {
  optionState.value = option
  isShowModalEditOption.value = true
}
// close edit option modal
const handleCloseEditOptionDialog = async () => {
  await getOptions(topicId.value, true)
  isShowModalEditOption.value = false
}
</script>
-->
-->
<!--
<style lang="scss" scoped>
.topic-tbl {
  max-height: 300px;
  overflow: auto;
}
.btn-wrapper {
  text-align: center;
}
#admin-table {
  tr > th,
  td {
    padding: 0 8px;
  }
}
</style>
-->
