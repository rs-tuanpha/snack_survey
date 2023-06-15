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
              <td>{{ item.status == true ? 'Mở' : 'Đóng' }}</td>
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
<script lang="ts">
import { defineComponent } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker';
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
import { getTopics } from '@/services/fb.topic.service'
const db = getFirestore();
  export default defineComponent({
    components: { VueDatePicker },
    data: () => ({
      date: new Date(),
      name: '',
      nameRules: [
          value => {
          if (value?.length > 0) return true
            return 'Vui lòng nhập tên topic'
          },
      ],
      description:  '',
      status: true,
      link: true,
      option: true,
      dialog: false,
      format: '',
      topics: [],
      text: '',
      type : 'create',
      txtbtn: 'Tạo mới',
      topicId: '',
      alert: '',
      errorDialog: false,
      showAddBtn: false
    }),
  created() {
    this.topics = getTopics;
    const day = this.date.getDate();
    const month = this.date.getMonth() + 1;
    const year = this.date.getFullYear();
    this.format =  `${day}/${month}/${year}`;
  },
  watch: {
    date() {
      const day = this.date.getDate();
      const month = this.date.getMonth() + 1;
      const year = this.date.getFullYear();
      this.format =  `${day}/${month}/${year}`;
    }
  },
  methods: {
    confirm(type : string) {
      if(type == "create") {
        this.text = 'Bạn có muốn thêm topic không?';
      }
      if(type == "update") {
        this.text = 'Bạn có muốn cập nhật topic không?';
      }
      if(type == "delete") {
        this.text = 'Bạn có muốn xóa topic không?';
      }
      if(this.name != '') {
        this.dialog = true; 
      }
    },
    confirmEdit() {
      if(this.name != '') {
        this.dialog = true; 
      }
    },
    confirmDelete(topicId : string) {
      this.text = 'Bạn có muốn xóa topic không?';
      this.dialog = true;
      this.type = 'delete';
      this.topicId = topicId
    },
    async edit(topicId : string) {
      // Find the topic by topic id
      const docRef = doc(db, "topics", topicId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.name = docSnap.data().name;
        this.description = docSnap.data().description;
        var date = docSnap.data().date;
        this.topicId = docSnap.id;
        this.date = date.toDate();
        this.status = docSnap.data().status;
        this.link = docSnap.data().link;
        this.option = docSnap.data().option;
        this.txtbtn = 'Cập nhật';
        this.type = 'update';
        this.showAddBtn = true;
      } else {
        console.log("No such document!");
      }
    },
    async handleTopic(type : string) {
      let topic = {
        'name' : this.name,
        'description' : this.description,
        'date' : this.date,
        'status' : this.status,
        'link' : this.link,
        'option' : this.option
      }
      if(type == 'create') {
        try {
          await addDoc(collection(db, "topics"), topic);
          this.alert = 'Thêm mới thành công';
          this.status = true;
          this.link = true;
          this.option = true;
          this.description = '';
          this.name = '';
          this.dialog = false;
          this.date = new Date();
        } catch(e) {
          this.errorDialog = true;
          console.error(e.message);
        }
      }
      if(type == 'update') {
        this.update(topic)
      }
      if(type == 'delete') {
        this.deleteTopic();
      }
    },
    async update(topic : object) {
      const topicRef = doc(db, "topics", this.topicId);
      try {
        await updateDoc(topicRef, topic);
        this.dialog = false;
        this.alert = 'Cập nhật thành công';
      } catch(e) {
        this.errorDialog = true;
        console.error(e.message);
      }
    },
    async deleteTopic() {
      try {
        await deleteDoc(doc(db, "topics", this.topicId));
        this.dialog = false;
      } catch(e) {
        this.errorDialog = true;
        console.error(e.message);
      }
    },
    cancelUpdate() {
      this.txtbtn = 'Tạo mới';
      this.type = 'create';
      this.showAddBtn = false;
      this.status = true;
      this.link = true;
      this.option = true;
      this.description = '';
      this.name = '';
      this.dialog = false;
      this.date = new Date();
    }
  }
})
</script>
