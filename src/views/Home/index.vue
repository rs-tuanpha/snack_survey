<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Cookies from 'js-cookie'

import { useTopicStore } from '@/stores/topic'
import { useAccountsStore } from '@/stores/accounts'
import type { IUser } from '@/core/interfaces/model/user'

// const show = ref(true)
const topicStore = useTopicStore()
const accountsStore = useAccountsStore()

const accounts = computed(() => accountsStore.accounts)
const topics = computed(() => topicStore.openTopicList)
const currentUser = computed(() => accountsStore.currentUser)
const account = ref<IUser | null>(null)

const login = () => {
  if (account.value) {
    accountsStore.setCurrentUser(account.value)
    topicStore.getOpenTopicList()
  }
  Cookies.set('account_info', account.value, { expires: 7 })
}

onMounted(() => {
  accountsStore.loadAccounts()
})
</script>

<template>
  <div class="py-4">
    <v-container class="" v-if="!currentUser">
      <v-row justify="center">
        <v-col cols="6">
          <v-card class="mx-auto pa-4 pb-4" max-width="448" rounded="md">
            <v-autocomplete
              label="Chọn tài khoản"
              :items="accounts"
              item-title="username"
              item-value="id"
              v-model="account"
            >
            </v-autocomplete>
            <v-btn class="bg-blue-darken-2 float-right" @click="login">Đăng nhập</v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="">
      <v-row justify="center">
        <v-col cols="6">
          <v-row justify="center">
            <v-col v-for="{ id, name, description } in topics" :key="id" cols="12">
              <v-hover v-slot="{ isHovering, props }">
                <v-card
                  :title="name"
                  :text="description"
                  variant="outlined"
                  :elevation="isHovering ? 12 : 2"
                  v-bind="props"
                  :class="isHovering ? 'bg-indigo-lighten-2' : ''"
                  target="_blank"
                  :href="'vote-topic/' + id"
                >
                </v-card>
              </v-hover>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
