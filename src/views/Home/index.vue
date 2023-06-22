<template>
    <div class="py-4">
      <v-container>
        <v-row justify="center">
          <v-col sm="12" md="6" lg="6" xl="3">
            <v-row align="center" class="spacer" no-gutters justify="center" v-if="!show">
              <v-col sm="12" md="10" lg="8" align="center">
                <v-avatar size="36px" :icon="(accountInfo.avatar !== '') ? '' : 'mdi-account-circle' ">
                  <v-img alt="Avatar" :src="accountInfo.avatar"></v-img>
                </v-avatar>
                <i> Tài khoản: </i><strong>{{ accountInfo.username }}</strong>
                <p><a href="#" @click="logout">Logout</a></p>
              </v-col>
            </v-row>
            <v-card
            class="mx-auto pa-4 pb-4"
            min-width="350"
            rounded="md"
            v-if="show">
              <v-autocomplete
              label="Chọn tài khoản"
              :items="getAccounts"
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
        <v-col sm="12" md="6" lg="6" xl="6">
          <v-row justify="center">
            <v-sheet class="pa-2" border rounded v-if="topics && topics.length" min-width="350">
              <p class="font-weight-bold">Chọn topic để vote</p>
              <v-col v-for="{id, name, description} in topics" :key="id" cols="12" sm="12">
              <v-hover v-slot="{ isHovering, props }">
                <v-card :title="name" :text="description" color="indigo-lighten-5"  :elevation="isHovering ? 12 : 2" v-bind="props" :class="isHovering ? 'bg-indigo-lighten-2' : ''"
                @click="goTopicVote(id)">
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
  import { onMounted, ref, reactive } from 'vue'
  import { getAccounts } from '@/services/fb.account.service'
  import { getOpenTopicList } from '@/services/fb.topic.service'
  import type { ITopic } from '@/core/interfaces/model/topic'

  import useCommon from '@/core/hooks/useCommon'
  const { handleRouter } = useCommon('useCommonStore')

  const show = ref<boolean>(true);
  const topics = ref<ITopic[]>([]);
  const account = ref<null>(null);
  const error = ref<boolean>(false);
  const message = ref<string>('');
  const alert = ref<boolean>(false);
  const accountInfo : {username: string | null, avatar: string | null, team: string | null} = reactive({username : '', avatar : '', team: ''});
  // Check existence of the account
  const login = async () => {
    if(!account.value) {
      error.value = true;
      message.value = 'Vui lòng chọn tài khoản'
      return false;
    }
    show.value = false;
    
    localStorage.setItem('account_info', account.value);
    for (const item in getAccounts.value) {
      if(getAccounts.value[item].id === account.value) {
        accountInfo.avatar = getAccounts.value[item].avatar;
        accountInfo.username = getAccounts.value[item].username;
        accountInfo.team = getAccounts.value[item].team;
        localStorage.setItem("account_avatar", getAccounts.value[item].avatar);
        localStorage.setItem("account_username", getAccounts.value[item].username);
        localStorage.setItem("account_team", getAccounts.value[item].team);
        topics.value = await getOpenTopicList(getAccounts.value[item].team);
        if(topics.value.length === 0) {
          alert.value = true;
        }
      }
    }
  }

  onMounted(async () => {
    if(localStorage.getItem('account_info') && localStorage.getItem('account_username')) {
      show.value = false;
      topics.value = await getOpenTopicList(localStorage.getItem('account_team'));
      if(topics.value.length === 0) {
        alert.value = true;
      }
      accountInfo.avatar = localStorage.getItem('account_avatar');
      accountInfo.username = localStorage.getItem('account_username');
      accountInfo.team = localStorage.getItem('account_team');
    }
  })

  const accountRules = [
    (value : boolean) => {
      if (value) return true
      return 'Vui lòng chọn tài khoản'
    },
  ]

  const goTopicVote = (id: string) => {
    handleRouter.pushName('topicVote', { params: {id: id}})
  }

  const logout = () => {
    localStorage.removeItem('account_info');
    localStorage.removeItem('account_avatar');
    localStorage.removeItem('account_username');
    localStorage.removeItem('account_team');
    topics.value = [];
    show.value = true;
    alert.value = false;
  }
</script>
