<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { useRoute } from 'vue-router'

import { Cookies } from '@/core/utils/storage'
import { db } from '@/plugins/firebase'
import { getAccountById } from '@/services/account.service'
import { getOptionsByTopicId, postNewOption, voteOption } from '@/services/option.service'
import stringMinify from '@/core/utils/stringMinify'
import { useCommonStore } from '@/stores'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'

const common = useCommonStore()
const route = useRoute()
const currentAccount = ref<IUser | null>(null)
const currentTopic = useDocument<ITopic>(doc(db, 'topics', route.params.id.toString()))
const options = ref<IOption[]>([])
const currentVoteOption = ref<number | null>(null)
const form = reactive({
  link: '',
  title: ''
})

const checkAccountVoteOption = (option: IOption, account: IUser) => {
  for (let i = 0; i < option.voteBy.length; i++) {
    if (option.voteBy[i].id === account.id) {
      return true
    }
  }
  return false
}

const sortOptionByVotes = () => {
  options.value = options.value.sort((a, b) => (a?.voteBy.length < b?.voteBy.length ? 1 : -1))
}

onMounted(async () => {
  const topicData = await getOptionsByTopicId(route.params.id.toString())
  options.value = topicData
  sortOptionByVotes()

  const accountId = Cookies.get('account_info')
  const userData = await getAccountById(accountId)
  currentAccount.value = userData
  currentVoteOption.value = userData
    ? topicData.findIndex((option) => checkAccountVoteOption(option, userData))
    : null
})

const handleAddTopic = async () => {
  if (form.link && form.title) {
    await postNewOption(form.title, form.link, route.params.id.toString())
    options.value = await getOptionsByTopicId(route.params.id.toString())
    form.link = ''
    form.title = ''
    alert('Create Option success!')
    sortOptionByVotes()
    const curAccount = currentAccount.value
    if (curAccount)
      currentVoteOption.value = options.value.findIndex((option) =>
        checkAccountVoteOption(option, curAccount)
      )
    return
  }
  alert('Please input valid information!')
}

const handleChangeVote = (optionIndex: number) => {
  const accountIndex =
    currentVoteOption?.value !== null && options?.value?.[currentVoteOption.value]?.voteBy?.length
      ? options.value[currentVoteOption.value].voteBy.findIndex(
          (account) => account.id === currentAccount.value?.id
        )
      : -1

  if (accountIndex !== -1) {
    options.value[currentVoteOption.value ?? 0].voteBy.splice(accountIndex, 1)
  }

  currentAccount.value && options.value[optionIndex].voteBy.push(currentAccount.value)
  currentVoteOption.value = optionIndex
}

const handleSubmitForm = async () => {
  await voteOption(options.value)

  sortOptionByVotes()
  if (currentAccount.value)
    currentVoteOption.value = options.value.findIndex((option) =>
      checkAccountVoteOption(option, currentAccount.value!)
    )
}
</script>

<template>
  <v-container>
    <v-sheet
      v-if="!common.loading && currentTopic?.status === 'close'"
      max-width="638"
      width="100%"
      class="mx-auto"
    >
      <v-alert variant="outlined" type="warning" prominent class="w-100 mb-2" border="top">
        This topic is closing
      </v-alert>
    </v-sheet>
    <v-sheet
      elevation="1"
      max-width="638"
      rounded="lg"
      width="100%"
      class="border-top-violet pa-6 mx-auto"
      border
    >
      <h1 class="text-h4">{{ currentTopic?.name }}</h1>
      <p class="mt-3 text-medium-emphasis text-body-1">{{ currentTopic?.description }}</p>
      <v-divider class="border-opacity-50"></v-divider>
      <v-form @submit.prevent v-if="currentTopic?.status === 'open'">
        <v-text-field v-model="form.title" label="Vote title"></v-text-field>
        <v-text-field v-model="form.link" label="Vote link"></v-text-field>
        <v-btn type="submit" block class="mt-2" @click="handleAddTopic">Submit</v-btn>
      </v-form>
    </v-sheet>
    <v-sheet
      elevation="1"
      max-width="638"
      rounded="lg"
      width="100%"
      class="mt-3 pa-6 mx-auto"
      border
    >
      <ul>
        <li
          v-for="(option, index) in options"
          :key="option.id"
          class="h-120px d-flex align-center mb-2 px-4 py-2 elevation-1"
        >
          <v-avatar color="primary">
            {{ option.voteBy.length }}
          </v-avatar>
          <div class="flex-grow-1 mx-4">
            <p class="mb-1 text-h6">{{ option.title }}</p>
            <a :href="option.link" target="_blank">{{ stringMinify(option.link, 50) }}</a>
            <div class="d-flex mt-1">
              <div v-for="user in option.voteBy.slice(0, 3)" :key="user.username" class="mr-1">
                <v-avatar color="secondary" class="m-1" size="30">
                  <v-img v-if="user.avatar" :src="user.avatar" :alt="user.username"></v-img>
                  <span v-else>{{ user.username.charAt(0).toLocaleUpperCase() }}</span>
                  <v-tooltip activator="parent" location="top">{{ user.username }}</v-tooltip>
                </v-avatar>
              </div>
              <div v-if="option.voteBy.length > 3" class="mr-1">
                <v-avatar color="secondary" class="m-1" size="30"> ... </v-avatar>
              </div>
            </div>
          </div>
          <div class="h-100">
            <v-btn
              class="h-100 btn-border"
              color="primary"
              :variant="index === currentVoteOption ? 'tonal' : 'plain'"
              @click="handleChangeVote(index)"
              >Vote</v-btn
            >
          </div>
        </li>
      </ul>
      <v-btn @click="handleSubmitForm">Submit</v-btn>
    </v-sheet>
  </v-container>
</template>
<style scoped lang="scss">
@import './styles.scss';
</style>
