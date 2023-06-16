<template>
  <v-container>
  <v-row justify="center">
    <v-dialog v-model="dialog" persistent width="auto">
      <v-card min-height="120">
        <v-card-text> {{ text }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="text-none" color="red-darken-1" variant="flat" @click="dialog = false">Không</v-btn>
          <v-btn class="text-none" color="blue-darken-2" variant="flat" @click="handleTopic(type)">Có</v-btn>
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

    <v-col sm="12" md="12" lg="12" xl="3">
      <v-sheet class="pa-2" border rounded>
        <p class="font-weight-black text-center">Topic</p>
        <v-form fast-fail @submit.prevent>
          <v-text-field v-model="name" label="Tên" :rules="nameRules" variant="outlined"></v-text-field>
          <v-text-field v-model="description" label="Mô tả" variant="outlined"></v-text-field>
          <VueDatePicker v-model="date" ></VueDatePicker>
          <v-switch v-model="status" hide-details color="green-darken-1" inset :label="`Trạng thái: ${ status ? 'Mở' : 'Đóng'}`"></v-switch>
          <v-switch v-model="link" hide-details color="green-darken-1" inset :label="`Cho phép đóng góp link: ${ link ? 'Có' : 'Không'}`"></v-switch>
          <v-switch v-model="option" hide-details color="green-darken-1" inset :label="`Cho phép vote nhiều option: ${ option ? 'Có' : 'Không'}`"></v-switch>
          <v-btn type="submit" block class="mt-2 bg-blue-darken-2" @click="confirm(type)" variant="elevated">{{ txtbtn }}</v-btn>
          <v-btn v-show="showAddBtn" icon="mdi-plus" size="small" class="mt-2 bg-blue-darken-2" @click="cancelUpdate"></v-btn>
        </v-form>
        <v-alert v-model="alert" v-show="alert != ''" border="start" variant="tonal" closable color="green-darken-1" class="mt-2"> {{ alert }}
       </v-alert>
      </v-sheet>
    </v-col>
  </v-row>

  <v-row justify="center">
    <v-col sm="12" md="12" lg="12" xl="6">
      <v-sheet class="pa-2" border rounded>
        <v-table fixed-header height="300px">
          <thead>
            <tr>
              <th class="text-left">
                Tên topic
              </th>
              <th class="text-left w-50">
                Mô tả
              </th>
              <th class="text-left">
                Trạng thái
              </th>
              <th class="text-left">
                Tác vụ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in topics" :key="item.id"> 
              <td>{{ item.name }}</td>
              <td>{{ item.description }}</td>
              <td>{{ item.status === true ? 'Mở' : 'Đóng' }}</td>
              <td>
                <v-btn class="text-none w-auto ma-1" color="blue-darken-2" @click="edit(item.id)">Sửa</v-btn>
                <v-btn class="text-none w-auto ma-1" color="red-darken-1" @click="confirmDelete(item.id)">Xóa</v-btn>
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
import { ref, watch } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getTopics } from '@/services/fb.topic.service'
const db = getFirestore();
const date = ref<object>(new Date());
const name = ref<string>('');
const nameRules = [
    value => {
      if (value) return true
      return 'Vui lòng chọn tài khoản'
    },
  ]
const description = ref<string>('');
const status = ref<boolean>(true);
const link = ref<boolean>(true);
const option = ref<boolean>(true);
const format = ref<string>('');
const topics = getTopics;
const text = ref<string>('');
const txtbtn = ref<string>('Tạo mới');
const topicId = ref<string>('');
const topicCancelId = ref<string>('');
const alert = ref<string>('');
const errorDialog = ref<boolean>(false);
const showAddBtn = ref<boolean>(false);
const dialog = ref<boolean>(false);
const type = ref<string>('create');
const reset = ref<boolean>(false);
format.value = `${date.value.getDate()}/${date.value.getMonth() + 1}/${date.value.getFullYear()}`;

watch(() => date.value, () => {
  format.value =  `${date.value.getDate()}/${date.value.getMonth() + 1}/${date.value.getFullYear()}`;
})

// Methods
const confirm = (type : string) => {
  switch(type) {
    case "create": text.value = 'Bạn có muốn thêm topic không?'; break;
    case "update": text.value = 'Bạn có muốn cập nhật topic không?'; break;
  }
  dialog.value = true;
}

const confirmDelete = (topicVal : string) => {
  text.value = 'Bạn có muốn xóa topic không?';
  dialog.value = true;
  type.value = 'delete';
  if(topicId.value === topicVal) {
    reset.value = true;
  }
  topicCancelId.value = topicVal;
}

const cancelUpdate = () => {
  txtbtn.value = 'Tạo mới';
  type.value = 'create';
  showAddBtn.value = false;
  status.value = true;
  link.value = true;
  option.value = true;
  description.value = '';
  name.value = '';
  dialog.value = false;
  date.value = new Date();
}

const edit = async (topicVal : string) => {
  // Find the topic by topic id
  const docRef = doc(db, "topics", topicVal);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    name.value = docSnap.data().name;
    description.value = docSnap.data().description;
    let dateString = docSnap.data().date;
    topicId.value = docSnap.id;
    date.value = dateString.toDate();
    status.value = docSnap.data().status;
    link.value = docSnap.data().link;
    option.value = docSnap.data().option;
    txtbtn.value = 'Cập nhật';
    type.value = 'update';
    showAddBtn.value = true;
  } else {
    console.log("No such document!");
  }
}

const handleTopic = async (type : string) => {
  let topic = {
    'name' : name.value,
    'description' : description.value,
    'date' : date.value,
    'status' : status.value,
    'link' : link.value,
    'option' : option.value
  }
  switch (type) {
    case 'create':
      try {
        await addDoc(collection(db, "topics"), topic);
        dialog.value = false;
        alert.value = 'Thêm mới thành công';
        status.value = true;
        link.value = true;
        option.value = true;
        description.value = '';
        name.value = '';
        date.value = new Date();
        setTimeout( ()=> {
          alert.value = '';
        }, 2000)
      } catch(e) {
        errorDialog.value = true;
        console.error(e.message);
      }
    break;
    case 'update': update(topic); break;
    case 'delete': deleteTopic(); break;
  }
}

const update = async (topic : object) => {
  const topicRef = doc(db, "topics", topicId.value);
  try {
    await updateDoc(topicRef, topic);
    dialog.value = false;
    alert.value = 'Cập nhật thành công';
    setTimeout( ()=> {
      alert.value = '';
    }, 2000)
  } catch(e) {
    errorDialog.value = true;
    console.error(e.message);
  }
}

const deleteTopic = async () => {
  try {
    await deleteDoc(doc(db, "topics", topicCancelId.value));
    dialog.value = false;
    alert.value = '';
    if(reset.value === true) {
      cancelUpdate();
    }
  } catch(e) {
    errorDialog.value = true;
    console.error(e.message);
  }
}
</script>
