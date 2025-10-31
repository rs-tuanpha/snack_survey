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
      <form-create-option
        v-if="topicState.data"
        v-model="isShowModalCreateOption"
        :id="topicId"
        :topicState="topicState"
        :options="options"
        hide-activator
        @close="isShowModalCreateOption = false"
      />
      <!-- Modal edit option -->
      <form-edit-option
        v-if="optionState._id && topicState.data"
        v-model="isShowModalEditOption"
        :option="optionState"
        :options="options"
        :topicState="topicState"
        hide-activator
        @close="handleCloseEditOptionDialog"
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
                  @click="handleEditOption(item)"
                ></v-icon>
                <v-icon
                  icon="mdi-close"
                  color="red"
                  class="pl-0 ml-2"
                  @click="deleteOption(item._id)"
                ></v-icon>
              </template>
              <v-list-item-title>{{ item.link || item.title }}</v-list-item-title>
              <v-list-item-subtitle>Số vote: {{ item.voteCount || 0 }}</v-list-item-subtitle>
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
            
            <!-- Start Date -->
            <div class="d-flex mb-2">
              <p class="font-weight-medium pr-2 pt-1">
                <v-chip color="primary" label>
                  <v-icon start icon="mdi-calendar-start"></v-icon>Ngày bắt đầu</v-chip
                >
              </p>
              <vue-date-picker
                v-model="topicFormData.startDate"
                :min-date="minDate"
                :enable-time-picker="true"
                :is-24="true"
                placeholder="Chọn ngày bắt đầu"
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
                v-model="topicFormData.endDate"
                :min-date="topicFormData.startDate || minDate"
                :enable-time-picker="true"
                :is-24="true"
                placeholder="Chọn ngày kết thúc"
              ></vue-date-picker>
            </div>

            <v-switch
              v-model="topicFormData.isActive"
              hide-details
              color="green-darken-1"
              inset
              :label="`Trạng thái: ${topicFormData.isActive ? 'Mở' : 'Đóng'}`"
            ></v-switch>
            
            <v-radio-group inline v-model="topicFormData.voteType" class="mt-2">
              <v-chip color="primary" label
                ><v-icon start icon="mdi-vote"></v-icon>Loại vote</v-chip
              >
              <v-radio label="Đơn" value="single"></v-radio>
              <v-radio label="Nhiều" value="multiple"></v-radio>
            </v-radio-group>
            
            <v-radio-group inline v-model="topicFormData.team" class="mt-2">
              <v-chip color="primary" label
                ><v-icon start icon="mdi-account-circle-outline"></v-icon>Team</v-chip
              >
              <v-radio label="PHP" value="PHP"></v-radio>
              <v-radio label="FE" value="FE"></v-radio>
              <v-radio label="ALL" value="ALL"></v-radio>
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
                <th class="text-left" scope="col" style="width: 90px">Ngày kết thúc</th>
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
              <tr v-else v-for="(item, index) in topics" :key="item._id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.title }}</td>
                <td>{{ item.team }}</td>
                <td>
                  {{ item.isActive ? 'Mở' : 'Đóng' }}
                </td>
                <td>
                  {{ item.endDate ? dayjs(item.endDate).format('DD/MM/YYYY HH:mm') : 'Không giới hạn' }}
                </td>
                <td>
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="blue-darken-2"
                    @click="handleEditTopic(item._id)"
                    >Sửa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="red-darken-1"
                    @click="handleDeleteTopic(item._id)"
                    >Xóa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="green-darken-2"
                    @click="handleAddOption(item._id)"
                    >+Option</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="purple-darken-2"
                    @click="showOptionList(item._id)"
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

<script setup lang="ts">
import { ref, reactive, defineAsyncComponent, computed } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useTopicsList, useCreateTopic, useUpdateTopic, useDeleteTopic } from '@/services/topic.service'
import { useOptionsByTopic, useDeleteOption } from '@/services/option.service'
import { nameRules, descriptionRules } from './Admin.validate'
import { initOption, initTopic, initTopicState } from './Admin.state'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import { mappingObject } from '@/core/utils/mappingObject'
import dayjs from 'dayjs'
import { ETopicTeam, ETopicVoteType } from '@/core/constants/enum'
import type { CreateTopicRequest, UpdateTopicRequest } from '@/types/api'

const FormCreateOption = defineAsyncComponent(() => import('@/components/organisms/FormCreateOption.vue'))
const FormEditOption = defineAsyncComponent(() => import('@/components/organisms/FormEditOption.vue'))

// Composables
const { data: topicsData, isLoading: isLoadingTopics, error: topicsError } = useTopicsList()
const createTopicMutation = useCreateTopic()
const updateTopicMutation = useUpdateTopic()
const deleteTopicMutation = useDeleteTopic()
const deleteOptionMutation = useDeleteOption()

// Computed - Map topics from API response (already converted to ITopic by adaptApiTopicToITopic)
const topics = computed<ITopic[]>(() => {
  if (!topicsData.value?.data) return []
  // Data is already converted to ITopic[] by adaptApiTopicToITopic in getTopicList
  return topicsData.value.data as unknown as ITopic[]
})

// State
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
const optionState = ref<IOption>({ ...initOption } as IOption)
const topicFormData = reactive<{
  _id?: string
  title: string
  description?: string
  team: ETopicTeam
  voteType: ETopicVoteType
  isActive: boolean
  startDate?: Date | null
  endDate?: Date | null
}>({
  _id: '',
  title: '',
  description: '',
  team: ETopicTeam.ALL,
  voteType: ETopicVoteType.SINGLE,
  isActive: true,
  startDate: null,
  endDate: null,
})

const minDate = computed(() => new Date())

// Methods
const confirm = (typeVal: string) => {
  if (!topicFormData.title) {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Vui lòng nhập tên topic'
    setTimeout(() => {
      alert.value = ''
      colorAlert.value = 'green-darken-1'
    }, 2000)
    return false
  }
  
  // Validate dates
  if (!topicFormData.startDate || !topicFormData.endDate) {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Vui lòng chọn ngày bắt đầu và ngày kết thúc'
    setTimeout(() => {
      alert.value = ''
      colorAlert.value = 'green-darken-1'
    }, 2000)
    return false
  }

  if (topicFormData.endDate <= topicFormData.startDate) {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Ngày kết thúc phải sau ngày bắt đầu'
    setTimeout(() => {
      alert.value = ''
      colorAlert.value = 'green-darken-1'
    }, 2000)
    return false
  }

  if (topicFormData.endDate <= new Date() && typeVal === 'create') {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Ngày kết thúc phải sau thời điểm hiện tại'
    setTimeout(() => {
      alert.value = ''
      colorAlert.value = 'green-darken-1'
    }, 2000)
    return false
  }

  switch (typeVal) {
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
  const topicData = topics.value?.find(topic => topic._id === id)
  if (topicData) {
    // topicData is already ITopic from adaptApiTopicToITopic
    topicState.value.data = topicData
    topicId.value = id
    // Load options for the topic
    await getOptions(id, true)
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
  topicId.value = ''
  mappingObject(topicFormData, {
    ...initTopic,
    team: ETopicTeam.ALL,
    voteType: ETopicVoteType.SINGLE,
    isActive: true,
    startDate: null,
    endDate: null,
  })
}

const handleEditTopic = async (id: string) => {
  // Find the topic by topic id
  const topicData = topics.value?.find(topic => topic._id === id)
  if (topicData) {
    topicId.value = topicData._id
    mappingObject(topicFormData, {
      _id: topicData._id,
      title: topicData.title,
      description: topicData.description || '',
      team: topicData.team as ETopicTeam,
      voteType: (topicData.votingType ?? ETopicVoteType.SINGLE) as ETopicVoteType,
      isActive: topicData.isActive !== false,
      startDate: topicData.startDate ? new Date(topicData.startDate) : null,
      endDate: topicData.endDate ? new Date(topicData.endDate) : null,
    })

    textBtn.value = 'Cập nhật'
    type.value = 'update'
    showAddBtn.value = true
  }
}

const getOptions = async (topicIdParam: string, isSetOption: boolean = false) => {
  const { data: optionsResponse, isLoading: isLoadingOptions } = useOptionsByTopic(topicIdParam)
  let optionArr = [] as IOption[]
  
  // Wait for data to be available (poll until loaded or timeout)
  let attempts = 0
  while (isLoadingOptions.value && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  if (optionsResponse.value?.data) {
    // Data is already IOption[] from the service (no adapter needed for options)
    const optionData = optionsResponse.value.data as unknown as IOption[]
    if (isSetOption) {
      options.value = optionData
    } else {
      optionArr = optionData
    }
  }
  return optionArr
}

// Reducer for confirm dialog
const handleTopic = async (typeVal: string) => {
  switch (typeVal) {
    case 'create':
      try {
        const createData: CreateTopicRequest = {
          title: topicFormData.title,
          description: topicFormData.description || undefined,
          voteType: topicFormData.voteType as 'single' | 'multiple',
          team: topicFormData.team,
          startDate: topicFormData.startDate!.toISOString(),
          endDate: topicFormData.endDate!.toISOString(),
          isActive: topicFormData.isActive,
        }
        
        await createTopicMutation.mutateAsync(createData)
        dialog.value = false
        alert.value = 'Thêm mới thành công'
        cancelUpdate()
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
      update()
      break
    case 'delete':
      deleteTopic()
      break
  }
}

const update = async () => {
  try {
    const updateData: UpdateTopicRequest = {
      title: topicFormData.title,
      description: topicFormData.description || undefined,
      voteType: topicFormData.voteType as 'single' | 'multiple',
      team: topicFormData.team,
      startDate: topicFormData.startDate!.toISOString(),
      endDate: topicFormData.endDate!.toISOString(),
      isActive: topicFormData.isActive,
    }
    
    await updateTopicMutation.mutateAsync({
      topicId: topicId.value,
      topicData: updateData,
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
  const topicData = topics.value?.find(topic => topic._id === id)
  if (topicData) {
    // topicData is already ITopic from adaptApiTopicToITopic
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
  topicId.value = option.topicId
  
  // Find and set topic state
  const topicData = topics.value?.find(topic => topic._id === option.topicId)
  if (topicData) {
    topicState.value.data = topicData
  }
  
  // Load options for the topic
  await getOptions(option.topicId, true)
  
  isShowModalEditOption.value = true
}

// close edit option modal
const handleCloseEditOptionDialog = async () => {
  await getOptions(topicId.value, true)
  isShowModalEditOption.value = false
}
</script>

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
