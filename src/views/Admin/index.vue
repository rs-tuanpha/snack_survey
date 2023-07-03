<template>
  <v-container>
    <v-row justify="center">
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

      <v-dialog v-model="errorDialog" width="auto">
        <v-card>
          <v-alert type="error" title="Lỗi!" text="Đã có lỗi xảy ra!" variant="tonal"></v-alert>
          <v-card-actions>
            <v-btn color="primary" block @click="errorDialog = false">Đóng</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="addOptionDlg" max-width="400">
        <v-card class="pb-4">
          <v-card-text>
            <p class="font-weight-black text-center">Option</p>
            <v-form fast-fail @submit.prevent>
              <v-text-field v-model="option.title" label="Tiêu đề"></v-text-field>
              <v-text-field v-model="option.link" label="Link" :rules="linkRules"></v-text-field>
              <v-btn
                type="submit"
                block
                class="mt-2 bg-blue-darken-2"
                @click="createOption"
                variant="elevated"
              >
                {{ txtOptionBtn }}</v-btn
              >
            </v-form>
            <v-alert
              v-if="alertOption"
              border="start"
              variant="tonal"
              closable
              :color="colorAlert"
              class="mt-2"
            >
              {{ alertOption }}</v-alert
            >
          </v-card-text>
        </v-card>
      </v-dialog>

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
                  @click="showEdittingOption(item.id)"
                ></v-icon>
                <v-icon
                  icon="mdi-close"
                  color="red"
                  class="pl-0 ml-2"
                  @click="deleteOption(item.id)"
                ></v-icon>
              </template>
              <v-list-item-title :v-text="item.title">{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-alert type="warning" v-else title="" text="Không có option nào được thêm!"></v-alert>
        </v-card>
      </v-dialog>

      <v-col sm="12" md="6" lg="4" xl="3">
        <v-sheet class="pa-2" border rounded>
          <p class="font-weight-black text-center">Topic</p>
          <v-form fast-fail @submit.prevent>
            <v-text-field v-model="topicInfo.name" label="Tên" :rules="nameRules"></v-text-field>
            <v-text-field
              v-model="topicInfo.description"
              label="Mô tả"
              :rules="descriptionRules"
            ></v-text-field>
            <div class="d-flex">
              <p class="font-weight-medium pr-2 pt-1">
                <v-chip color="primary" label>
                  <v-icon start icon="mdi-clock-time-eight-outline"></v-icon>Deadline</v-chip
                >
              </p>
              <VueDatePicker v-model="topicInfo.date"></VueDatePicker>
            </div>

            <v-switch
              v-model="topicInfo.status"
              hide-details
              color="green-darken-1"
              inset
              :label="`Trạng thái: ${topicInfo.status ? 'Mở' : 'Đóng'}`"
            ></v-switch>
            <v-switch
              v-model="topicInfo.link"
              hide-details
              color="green-darken-1"
              inset
              :label="`Cho phép đóng góp link: ${topicInfo.link ? 'Có' : 'Không'}`"
            ></v-switch>
            <v-switch
              v-model="topicInfo.option"
              hide-details
              color="green-darken-1"
              inset
              :label="`Cho phép vote nhiều option: ${topicInfo.option ? 'Có' : 'Không'}`"
            ></v-switch>
            <v-radio-group inline v-model="topicInfo.team">
              <v-chip color="primary" label
                ><v-icon start icon="mdi-account-circle-outline"></v-icon>Team</v-chip
              >
              <v-radio label="BE" value="BE"></v-radio>
              <v-radio label="FE" value="FE"></v-radio>
              <v-radio label="All" value="All"></v-radio>
            </v-radio-group>
            <v-btn
              type="submit"
              block
              class="mt-2 bg-blue-darken-2"
              @click="confirm(type)"
              variant="elevated"
              >{{ txtbtn }}</v-btn
            >
            <v-btn
              v-if="showAddBtn"
              prepend-icon="mdi-plus"
              class="mt-2 bg-blue-darken-2"
              @click="cancelUpdate"
              >Thêm mới</v-btn
            >
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
                <th class="text-left">STT</th>
                <th class="text-left">Tên topic</th>
                <th class="text-left">Trạng thái</th>
                <th class="text-left" width="400">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topics" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.status === true ? 'Mở' : 'Đóng' }}</td>
                <td>
                  <v-btn class="text-none w-auto ma-1" color="blue-darken-2" @click="edit(item.id)"
                    >Sửa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="red-darken-1"
                    @click="confirmDelete(item.id)"
                    >Xóa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="blue-darken-2"
                    @click="showOptionFrm(item.id)"
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
import { ref, watch, reactive } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { getTopics } from '@/services/fb.topic.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import { getOptionsByTopicId, postNewOption, getOptionById } from '@/services/option.service'
import { descriptionRules, linkRules, nameRules } from './Admin.validate'

// State
const db = getFirestore()
const format = ref<string>('')
const topics = getTopics
const text = ref<string>('')
const txtbtn = ref<string>('Tạo mới')
const topicId = ref<string>('')
const topicCancelId = ref<string>('')
const alert = ref<string>('')
const errorDialog = ref<boolean>(false)
const showAddBtn = ref<boolean>(false)
const dialog = ref<boolean>(false)
const type = ref<string>('create')
const reset = ref<boolean>(false)
const topicInfo: ITopic = reactive({
  id: '',
  name: '',
  description: '',
  date: new Date(),
  status: true,
  link: true,
  option: true,
  team: 'All'
})
const colorAlert = ref<string>('green-darken-1')
const addOptionDlg = ref<boolean>(false)
const option = reactive({ title: '', link: '' })
const alertOption = ref<string>('')
const options = ref<IOption[]>([])
const listOptionDlg = ref<boolean>(false)
const txtOptionBtn = ref<string>('Tạo mới')
const optionId = ref<string>('')
format.value = `${(topicInfo.date as Date).getDate()}/${(topicInfo.date as Date).getMonth() + 1}/${(
  topicInfo.date as Date
).getFullYear()}`

// Composition API
watch(
  () => topicInfo.date,
  () => {
    format.value = `${(topicInfo.date as Date).getDate()}/${
      (topicInfo.date as Date).getMonth() + 1
    }/${(topicInfo.date as Date).getFullYear()}`
  }
)

// Methods
const confirm = (type: string) => {
  if (!topicInfo.name) {
    return false
  }
  if (topicInfo.date && topicInfo.date < new Date() && type === 'create') {
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

const confirmDelete = (topicVal: string) => {
  text.value = 'Bạn có muốn xóa topic không?'
  dialog.value = true
  type.value = 'delete'
  if (topicId.value === topicVal) {
    reset.value = true
  }
  topicCancelId.value = topicVal
}

const cancelUpdate = () => {
  txtbtn.value = 'Tạo mới'
  type.value = 'create'
  showAddBtn.value = false
  dialog.value = false
  topicInfo.name = ''
  topicInfo.description = ''
  topicInfo.date = new Date()
  topicInfo.status = true
  topicInfo.link = true
  topicInfo.option = true
  topicInfo.team = 'All'
}

const edit = async (topicVal: string) => {
  // Find the topic by topic id
  const docRef = doc(db, 'topics', topicVal)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    let dateString = docSnap.data().date
    topicId.value = docSnap.id
    topicInfo.name = docSnap.data().name
    topicInfo.description = docSnap.data().description
    topicInfo.date = dateString.toDate()
    topicInfo.status = docSnap.data().status
    topicInfo.link = docSnap.data().link
    topicInfo.option = docSnap.data().option
    topicInfo.team = docSnap.data().team
    txtbtn.value = 'Cập nhật'
    type.value = 'update'
    showAddBtn.value = true
  } else {
    console.log('No such document!')
  }
}

const handleTopic = async (type: string) => {
  switch (type) {
    case 'create':
      try {
        await addDoc(collection(db, 'topics'), topicInfo)
        dialog.value = false
        alert.value = 'Thêm mới thành công'
        topicInfo.name = ''
        topicInfo.description = ''
        topicInfo.date = new Date()
        topicInfo.status = true
        topicInfo.link = true
        topicInfo.option = true
        topicInfo.team = 'All'
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
      update(topicInfo)
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

const showOptionFrm = (itemId: string) => {
  addOptionDlg.value = true
  topicId.value = itemId
  option.title = ''
  option.link = ''
  txtOptionBtn.value = 'Tạo mới'
  type.value = ''
}

const createOption = async () => {
  try {
    if (option.title && option.link) {
      if (type.value !== 'updateOption') {
        alertOption.value = 'Tạo mới thành công'
        await postNewOption(option.title, option.link, topicId.value)
      } else {
        const topicRef = doc(db, 'options', optionId.value)
        await updateDoc(topicRef, option)
        alertOption.value = 'Cập nhật thành công'
        options.value = await getOptionsByTopicId(topicId.value)
      }
      setTimeout(() => {
        option.title = ''
        option.link = ''
        alertOption.value = ''
        txtOptionBtn.value = 'Tạo mới'
      }, 2000)
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message)
    }
  }
}

const showOptionList = async (itemId: string) => {
  topicId.value = itemId
  listOptionDlg.value = true
  options.value = await getOptionsByTopicId(itemId)
}

const deleteOption = async (optionId: string) => {
  await deleteDoc(doc(db, 'options', optionId))
  options.value = await getOptionsByTopicId(topicId.value)
}

const showEdittingOption = async (id: string) => {
  addOptionDlg.value = true
  const info = await getOptionById(id)
  option.title = info.title
  option.link = info.link
  txtOptionBtn.value = 'Cập nhật'
  type.value = 'updateOption'
  optionId.value = id
}
</script>
<style scoped>
.topic-tbl {
  max-height: 300px;
  overflow: auto;
}
</style>
