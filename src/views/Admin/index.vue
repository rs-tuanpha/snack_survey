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
                  @click="handleEditOption({ ...item })"
                ></v-icon>
                <v-icon
                  icon="mdi-close"
                  color="red"
                  class="pl-0 ml-2"
                  @click="deleteOption(item.id)"
                ></v-icon>
              </template>
              <v-list-item-title :v-text="item.title">{{ item.link }}</v-list-item-title>
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
              v-model="topicFormData.name"
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
              v-model="topicFormData.status"
              hide-details
              color="green-darken-1"
              inset
              :label="`Trạng thái: ${topicFormData.status ? 'Mở' : 'Đóng'}`"
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
              v-model="topicFormData.option"
              hide-details
              color="green-darken-1"
              inset
              :label="`Cho phép vote nhiều option: ${topicFormData.option ? 'Có' : 'Không'}`"
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
          <v-table fixed-header :height="topics.length > 10 ? '400px' : ''">
            <thead>
              <tr>
                <th class="text-left" scope="col">STT</th>
                <th class="text-left" scope="col">Tên topic</th>
                <th class="text-left" scope="col">Team</th>
                <th class="text-left" scope="col">Trạng thái</th>
                <th class="text-left" scope="col">Deadline</th>
                <th class="text-left w-400" scope="col">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topics" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.team }}</td>
                <td>{{ item.status === true ? 'Mở' : 'Đóng' }}</td>
                <td>
                  {{
                    new Date((item?.date as any)?.seconds * 1000).toLocaleDateString() +
                    ' ' +
                    new Date((item?.date as any)?.seconds * 1000).toLocaleTimeString()
                  }}
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
                    color="blue-darken-2"
                    @click="handleAddOption(item.id)"
                    >+Option</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="blue-darken-2"
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

<script setup lang="ts">
import { ref, watch, reactive, defineAsyncComponent } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/plugins/firebase'
import { getTopicById, getTopics } from '@/services/topic.service'
import { getOptionsByTopicId } from '@/services/option.service'
import { nameRules, descriptionRules } from './Admin.validate'
import { initOption, initTopic, initTopicState } from './Admin.state'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import { mappingObject } from '@/core/utils/mappingObject'

const ModalCreateOption = defineAsyncComponent(() => import('./ModalCreateOption.vue'))
const ModalEditOption = defineAsyncComponent(() => import('./ModalEditOption.vue'))

// State
const format = ref<string>('')
const topics = getTopics
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
  if (!topicFormData.name) {
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
  const topicData = await getTopicById(id)
  topicState.value.data = topicData
  isShowModalCreateOption.value = true
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
  const topicData = await getTopicById(id)
  if (topicData?.name) {
    topicId.value = topicData.id
    mappingObject(topicFormData, {
      ...topicData,
      date: topicData?.date.toDate(),
      updatedAt: new Date()
    })

    textBtn.value = 'Cập nhật'
    type.value = 'update'
    showAddBtn.value = true
  } else {
    console.log('No such document!')
  }
}

const getOptions = (topicId: string, isSetOption: boolean = false) => {
  const topicData = getOptionsByTopicId(topicId)
  let optionArr = [] as IOption[]
  topicData.then((data) => {
    setTimeout(() => {
      if (isSetOption) {
        options.value = data.value as IOption[]
      } else {
        optionArr = data.value as IOption[]
      }
    }, 200)
  })
  return optionArr
}

// Reducer for confirm dialog
const handleTopic = async (type: string) => {
  switch (type) {
    case 'create':
      try {
        await addDoc(collection(db, 'topics'), { ...topicFormData, updatedAt: new Date() })
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

const update = async (topic: object) => {
  const topicRef = doc(db, 'topics', topicId.value)
  try {
    await updateDoc(topicRef, topic)
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
    await deleteDoc(doc(db, 'topics', topicCancelId.value))
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
  topicId.value = id
  listOptionDlg.value = true
  topicState.value.data = await getTopicById(id)
  getOptions(id, true)
}

const deleteOption = async (optionId: string) => {
  await deleteDoc(doc(db, 'options', optionId))
  options.value = getOptions(topicId.value, true)
}

// open edit option modal
const handleEditOption = async (option: IOption) => {
  optionState.value = option
  isShowModalEditOption.value = true
}
// close edit option modal
const handleCloseEditOptionDialog = async () => {
  getOptions(topicId.value, true)
  isShowModalEditOption.value = false
}
</script>
<style scoped>
.topic-tbl {
  max-height: 300px;
  overflow: auto;
}
.btn-wrapper {
  text-align: center;
}
.w-400 {
  width: 400px;
}
</style>
