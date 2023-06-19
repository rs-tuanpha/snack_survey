<template>
    <div class="py-4">
      <v-container>
        <v-row justify="center">
            <v-col sm="12" md="12" lg="12" xl="3">
            <v-card
            class="mx-auto pa-4 pb-4"
            min-width="350"
            rounded="md"
            v-if="show">
              <v-autocomplete
              label="Chọn tài khoản"
              :items="accounts"
              item-title="username"
              item-value="id"
              v-model="account"
              :error="error"
              :rules="accountRules"
              :error-messages="message"
            >
            </v-autocomplete>
            <v-btn class="bg-blue-darken-2 float-right" @click="login">Đăng nhập</v-btn>
            </v-card>	
        </v-col>
      </v-row>
    </v-container>

    <v-container>
      <v-row justify="center">
        <v-col sm="12" md="12" lg="12" xl="6">
          <v-row justify="center">
            <v-sheet class="pa-2" border rounded v-if="topics && topics.length" min-width="350">
              <p class="font-weight-bold">Chọn topic để vote</p>
              <v-col v-for="{id, name, description} in topics" :key="id" cols="12" sm="12">
              <v-hover v-slot="{ isHovering, props }">
                <v-card :title="name" :text="description" color="indigo-lighten-5"  :elevation="isHovering ? 12 : 2" v-bind="props" :class="isHovering ? 'bg-indigo-lighten-2' : ''"
                  target="_blank" :href="'vote-topic/'+ id">
                </v-card>
              </v-hover>
              </v-col>
            </v-sheet> 
          </v-row>
          <v-alert variant="outlined" type="warning" prominent border="top" v-if="alert">
            Hiện tại không có topic nào đang mở
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
    </div>
</template>
<script setup lang="ts">
  import { onMounted,ref } from 'vue'
  import { getAccounts } from '@/services/fb.account.service'
  import { getOpenTopicList } from '@/services/fb.topic.service'
  import type { ITopic } from '@/core/interfaces/model/topic'
  import Cookies from 'js-cookie'
  const show = ref<boolean>(true);
  const accounts = getAccounts;
  const topics = ref<ITopic[]>([]);
  const account = ref<null>(null);
  const error = ref<boolean>(false);
  const message = ref<string>('');
  const alert = ref<boolean>(false);
  // Check existence of the account
  const login = async () => {
    if(!account.value) {
      error.value = true;
      message.value = 'Vui lòng chọn tài khoản'
      return false;
    }
    show.value = false;
    topics.value = await getOpenTopicList();
    Cookies.set('account_info', account.value, { expires: 7 });
  }

  onMounted(async () => {
    if(Cookies.get('account_info')) {
      show.value = false;
      topics.value = await getOpenTopicList();
      if(topics.value.length === 0) {
        alert.value = true;
      }
    }
  })

  const accountRules = [
    value => {
      if (value) return true
      return 'Vui lòng chọn tài khoản'
    },
  ]
</script>
