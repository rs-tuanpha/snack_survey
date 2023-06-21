<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { useRoute, useRouter } from 'vue-router'

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
const router = useRouter()
const currentAccount = ref<IUser | null>(null)
const currentTopic = useDocument<ITopic>(doc(db, 'topics', route.params.id.toString()))
const options = ref<IOption[]>([])
const currentVoteOption = ref<number | null>(null)
const currentVoteMultiOption = ref<number[]>([])
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

  const accountId = localStorage.getItem('account_info')
  if (!accountId) {
    alert('Vui lòng đăng nhập tài khoản của bạn')
    router.push('/')
    return
  }
  const userData = await getAccountById(accountId!)
  currentAccount.value = userData
  if (currentTopic.value?.option && userData) {
    topicData.forEach((option, index) => {
      checkAccountVoteOption(option, userData) && currentVoteMultiOption.value.push(index)
    })
    return
  }
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
    if (currentTopic.value?.option && currentAccount.value) {
      options.value.forEach((option, index) => {
        checkAccountVoteOption(option, currentAccount.value!) &&
          currentVoteMultiOption.value.push(index)
      })
    } else {
      currentVoteOption.value = options.value.findIndex((option) =>
        checkAccountVoteOption(option, currentAccount.value!)
      )
    }
    return
  }
  alert('Please input valid information!')
}

const handleChangeVote = (optionIndex: number) => {
  // handle vote multiple
  if (currentTopic.value?.option) {
    let isUnvote = -1
    for (let i = 0; i < options.value[optionIndex].voteBy.length; i++) {
      if (options.value[optionIndex].voteBy[i].id === currentAccount.value?.id) {
        isUnvote = i
        break
      }
    }

    if (isUnvote !== -1) {
      options.value[optionIndex].voteBy.splice(isUnvote, 1)
      currentVoteMultiOption.value.splice(currentVoteMultiOption.value.indexOf(optionIndex), 1)
    } else {
      options.value[optionIndex].voteBy.push(currentAccount.value!)
      currentVoteMultiOption.value.push(optionIndex)
    }
    return
  }
  // Handle vote 1
  const accountIndex =
    currentVoteOption?.value !== null && options?.value?.[currentVoteOption.value]?.voteBy?.length
      ? options.value[currentVoteOption.value].voteBy.findIndex(
          (account) => account.id === currentAccount.value?.id
        )
      : -1

  if (accountIndex !== -1) {
    options.value[currentVoteOption.value ?? 0].voteBy.splice(accountIndex, 1)
    if (optionIndex === currentVoteOption.value) {
      currentVoteOption.value = null
      return
    }
  }

  currentAccount.value && options.value[optionIndex].voteBy.push(currentAccount.value)
  currentVoteOption.value = optionIndex
}

const handleSubmitForm = async () => {
  await voteOption(options.value)

  sortOptionByVotes()
  currentVoteMultiOption.value = []

  if (currentTopic.value?.option && currentAccount.value) {
    options.value.forEach((option, index) => {
      checkAccountVoteOption(option, currentAccount.value!) &&
        currentVoteMultiOption.value.push(index)
    })
    return
  }
  currentVoteOption.value = options.value.findIndex((option) =>
    checkAccountVoteOption(option, currentAccount.value!)
  )
}
</script>

<template>
  <v-container>
    <v-sheet
      v-if="!common.loading && !currentTopic?.status"
      max-width="638"
      width="100%"
      class="mx-auto"
    >
      <v-alert variant="outlined" type="warning" prominent class="w-100 mb-2" border="top">
        Topic này đã đóng, vui lòng trở lại sau
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
      <v-row>
        <v-col sm="8">
          <p>{{ currentTopic?.description }}</p></v-col
        >
        <v-col sm="4">
          <p class="mt-3 text-medium-emphasis text-body-1">
            Thời hạn:
            {{ new Date((currentTopic?.date as any)?.seconds * 1000).toLocaleDateString() }}
          </p>
        </v-col>
      </v-row>
      <v-divider class="border-opacity-50"></v-divider>
      <v-form @submit.prevent v-if="currentTopic?.link">
        <v-text-field v-model="form.title" label="Vote title"></v-text-field>
        <v-text-field v-model="form.link" label="Vote link"></v-text-field>
        <v-btn type="submit" block class="mt-2" @click="handleAddTopic">Tạo topic</v-btn>
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
                <v-tooltip activator="parent" location="top">{{
                  `${option.voteBy.length - 3} others people`
                }}</v-tooltip>
              </div>
            </div>
          </div>
          <div class="h-100">
            <v-btn
              class="h-100 btn-border btn-width-primary"
              color="primary"
              block
              :variant="
                (
                  currentTopic?.option
                    ? currentVoteMultiOption.includes(index)
                    : index === currentVoteOption
                )
                  ? 'tonal'
                  : 'plain'
              "
              @click="handleChangeVote(index)"
              >{{
                `${
                  (
                    currentTopic?.option
                      ? currentVoteMultiOption.includes(index)
                      : index === currentVoteOption
                  )
                    ? 'Unvote'
                    : 'Vote'
                }`
              }}</v-btn
            >
          </div>
        </li>
      </ul>
      <v-btn @click="handleSubmitForm">Gửi</v-btn>
    </v-sheet>
  </v-container>
</template>
<style scoped lang="scss">
@import './styles.scss';
</style>
