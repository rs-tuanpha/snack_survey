<template>
  <div class="py-4">
    <v-container>
      <v-row justify="center">
        <v-col sm="12" md="6" lg="6" xl="4">
          <v-row align="center" class="spacer" no-gutters justify="center" v-if="!show">
            <v-col sm="12" md="10" lg="8" align="center">
              <v-avatar size="36px" :icon="accountInfo.avatar !== '' ? '' : 'mdi-account-circle'">
                <v-img alt="Avatar" :src="accountInfo.avatar"></v-img>
              </v-avatar>
              <i> Tài khoản: </i><strong>{{ accountInfo.username }}</strong>
              <v-btn class="ma-2 logout-btn" color="red" @click="logout">
                <v-icon icon="mdi-logout-variant"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-card class="mx-auto pa-4 pb-4" min-width="350" rounded="md" v-if="show">
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
              <v-col v-for="{ id, name, voteBy } in topics" :key="id" cols="12" sm="12">
                <v-hover v-slot="{ isHovering, props }">
                  <v-card
                    color="indigo-lighten-5"
                    :elevation="isHovering ? 12 : 2"
                    v-bind="props"
                    :class="isHovering ? 'bg-indigo-lighten-2' : ''"
                    @click="goTopicVote(id)"
                  >
                    <template v-slot:title>
                      <div class="d-flex justify-space-between">
                        <div>{{ name }}</div>
                        <v-avatar color="primary" v-if="voteBy" @click.stop="onClickAvatar(voteBy)">
                          {{ voteBy.length }}
                        </v-avatar>
                      </div>
                    </template>
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
    <v-dialog v-model="dialog" width="auto">
      <v-card>
        <v-card-title>Danh sách vote</v-card-title>
        <v-divider></v-divider>
        <v-card-text max-height="300px" class="pa-3">
          <div v-for="user in listVoteBy" :key="user.username" class="mr-1">
            <div class="mt-1">
              <v-avatar color="secondary" class="m-1" size="30">
                <v-img v-if="user.avatar" :src="user.avatar" :alt="user.username"></v-img>
                <span v-else>{{ user.username.charAt(0).toLocaleUpperCase() }}</span>
                <v-tooltip activator="parent" location="top">{{ user.username }}</v-tooltip>
              </v-avatar>
              <span class="ml-1">{{ user.username }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { getAccounts } from '@/services/account.service'
import { getOpenTopicList } from '@/services/topic.service'
import { getAllOptions } from '@/services/option.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'

import useCommon from '@/core/hooks/useCommon'
const { handleRouter } = useCommon('useCommonStore')

const show = ref<boolean>(true)
const topics = ref<ITopic[]>([])
const options = ref<IOption[]>([])
const account = ref<null>(null)
const error = ref<boolean>(false)
const dialog = ref<boolean>(false)
const message = ref<string>('')
const alert = ref<boolean>(false)
const accountInfo: {
  username?: string
  avatar?: string
  team?: string
} = reactive({ username: '', avatar: '', team: '' })
const listVoteBy = ref<IUser[]>([])
// Check existence of the account
const login = async () => {
  if (!account.value) {
    error.value = true
    message.value = 'Vui lòng chọn tài khoản'
    return false
  }
  show.value = false

  localStorage.setItem('account_info', account.value)
  for (const item in getAccounts.value) {
    if (getAccounts.value[item].id === account.value) {
      accountInfo.avatar = getAccounts.value[item].avatar
      accountInfo.username = getAccounts.value[item].username
      accountInfo.team = getAccounts.value[item].team
      localStorage.setItem('account_avatar', getAccounts.value[item].avatar ?? '')
      localStorage.setItem('account_username', getAccounts.value[item].username ?? '')
      localStorage.setItem('account_team', getAccounts.value[item].team ?? '')
      topics.value = await getOpenTopicList(getAccounts.value[item].team ?? '')
      if (topics.value.length === 0) {
        alert.value = true
      }
      getTopicOptions()
    }
  }
}

onMounted(async () => {
  if (localStorage.getItem('account_info') && localStorage.getItem('account_username')) {
    show.value = false
    topics.value = await getOpenTopicList(localStorage.getItem('account_team'))
    if (topics.value.length === 0) {
      alert.value = true
    }
    getTopicOptions()
    accountInfo.avatar = localStorage.getItem('account_avatar') ?? ''
    accountInfo.username = localStorage.getItem('account_username') ?? ''
    accountInfo.team = localStorage.getItem('account_team') ?? ''
  }
})

const accountRules = [
  (value: boolean) => {
    if (value) return true
    return 'Vui lòng chọn tài khoản'
  }
]

const getTopicOptions = async () => {
  const topicData = await getAllOptions()
  options.value = topicData
  topics.value.forEach((topic) => {
    const result = options.value.filter((option) => option.topicId === topic.id)
    const map: { [key: string]: IUser } = {}
    const combinedArray = []
    result.forEach((option) => {
      option.voteBy.forEach((obj) => {
        if (!map[obj?.id]) {
          map[obj?.id] = obj
        }
      })
    })
    for (const id in map) {
      // eslint-disable-next-line no-prototype-builtins
      if (map.hasOwnProperty(id)) {
        combinedArray.push(map[id])
      }
    }
    topic.voteBy = combinedArray
  })
}

const goTopicVote = (id: string) => {
  handleRouter.pushName('topicVote', { params: { id: id } })
}

const logout = () => {
  localStorage.clear()
  topics.value = []
  show.value = true
  alert.value = false
}
const onClickAvatar = (voteBy: IUser[]) => {
  if (voteBy.length > 0) {
    listVoteBy.value = voteBy
    dialog.value = true
  }
}
</script>
<style scoped lang="scss">
@import './styles.scss';
</style>
