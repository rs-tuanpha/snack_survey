<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { db } from '@/plugins/firebase'
import { getAccountById } from '@/services/account.service'
import { getOptionsByTopicId, postNewOption, voteOption } from '@/services/option.service'
import { REG_URL_FORMAT } from '@/core/utils/regexValidate'
import stringMinify from '@/core/utils/stringMinify'
import useCommon from '@/core/hooks/useCommon'
import { useCommonStore } from '@/stores'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'

/**
 * Common hook for all components
 * @store
 *  storeGetters,
 *  storeDispatch,
 * @Router
 *  getRouter,
 *  getQuery,
 *  getParams,
 *  handleRouter
 */
/** end common hook */

const { getParams, handleRouter } = useCommon('useCommonStore')
const { id } = getParams()
const common = useCommonStore()
const currentAccount = ref<IUser | null>(null)
const currentTopic = useDocument<ITopic>(doc(db, 'topics', id.toString()))
const options = ref<IOption[]>([])
const currentVoteOption = ref<number | null>(null)
const currentVoteMultiOption = ref<number[]>([])
const alert = ref<string>('')
const colorAlert = ref<string>('green-darken-1')
const showOverlay = ref<boolean>(false)
const form = reactive({
  link: '',
  title: ''
})
const titleRules = [
  (value: string) => {
    if (value !== '') return true
    return 'Vui lòng nhập tiêu đề'
  }
]
const linkRules = [
  (value: string) => {
    if (value === '' || !REG_URL_FORMAT.test(value)) {
      return 'Vui lòng nhập link hợp lệ'
    }

    for (const option of options.value) {
      if (option.link === value) {
        return 'Link đã tồn tại, vui lòng nhập link khác'
      }
    }
    return true
  }
]

const checkAccountVoteOption = (option: IOption, account: IUser) => {
  for (const element of option.voteBy) {
    if (element.id === account.id) {
      return true
    }
  }
  return false
}

const sortOptionByVotes = () => {
  options.value = options.value.sort((a, b) => (a?.voteBy.length < b?.voteBy.length ? 1 : -1))
}

onMounted(async () => {
  const topicData = await getOptionsByTopicId(id.toString())
  options.value = topicData
  sortOptionByVotes()

  const accountId = localStorage.getItem('account_info')
  if (!accountId) {
    handleRouter.pushPath('/')
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
    await postNewOption(form.title, form.link, id.toString())
    options.value = await getOptionsByTopicId(id.toString())
    form.link = ''
    form.title = ''
    alert.value = 'Tạo thành công'
    setTimeout(() => {
      alert.value = ''
    }, 2000)
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
}

const handleChangeVote = (optionIndex: number) => {
  showOverlay.value = !showOverlay.value
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
    handleSubmitForm()
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
      handleSubmitForm()
      return
    }
  }

  currentAccount.value && options.value[optionIndex].voteBy.push(currentAccount.value)
  currentVoteOption.value = optionIndex
}

const handleSubmitForm = async () => {
  try {
    const res = await voteOption(options.value)
    showOverlay.value = !showOverlay.value
    alertVote.value = 'Cập nhật thành công'
  } catch (error) {
    alertVote.value = 'Cập nhật thất bại'
  } finally {
    setTimeout(() => {
      alertVote.value = ''
    }, 2000)
    sortOptionByVotes()
    currentVoteMultiOption.value = []

    if (currentTopic.value?.option && currentAccount.value) {
      options.value.forEach((option, index) => {
        checkAccountVoteOption(option, currentAccount.value!) &&
          currentVoteMultiOption.value.push(index)
      })
    }
    currentVoteOption.value = options.value.findIndex((option) =>
      checkAccountVoteOption(option, currentAccount.value!)
    )
  }
}
const handleSelectAddOption = () => {
  form.link = ''
  form.title = ''
}
const alertVote = ref<string>('')
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
      rounded
      width="100%"
      class="border-top-violet pa-3 mx-auto"
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

      <v-expansion-panels>
        <v-expansion-panel group:select="handleSelectAddOption">
          <v-expansion-panel-title
            expand-icon="mdi-plus"
            collapse-icon="mdi-minus"
            @click="handleSelectAddOption"
          >
            Thêm option
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-form @submit.prevent v-if="currentTopic?.link">
              <v-alert
                v-if="alert"
                border="start"
                variant="tonal"
                closable
                :color="colorAlert"
                class="mb-2"
              >
                {{ alert }}</v-alert
              >
              <v-text-field
                v-model="form.title"
                label="Tiêu đề"
                single-line
                :rules="titleRules"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="form.link"
                label="Link"
                single-line
                :rules="linkRules"
                variant="outlined"
              ></v-text-field>
              <v-btn
                type="submit"
                @click="handleAddTopic"
                class="mb-2 float-right"
                color="blue-darken-2"
                size="large"
                variant="flat"
                min-width="100"
                >Thêm mới option</v-btn
              >
            </v-form>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-sheet>
    <v-sheet
      elevation="1"
      max-width="638"
      rounded="lg"
      width="100%"
      class="mt-3 pa-3 mx-auto"
      border
    >
      <v-alert
        v-if="alertVote"
        border="start"
        variant="tonal"
        closable
        :color="colorAlert"
        class="mb-2"
      >
        {{ alertVote }}</v-alert
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
          <div class="d-flex align-self-center">
            <v-icon
              icon="mdi-thumb-up"
              size="x-large"
              :color="
                (
                  currentTopic?.option
                    ? currentVoteMultiOption.includes(index)
                    : index === currentVoteOption
                )
                  ? 'red-darken-1'
                  : 'blue-darken-3'
              "
              @click.prevent="handleChangeVote(index)"
            ></v-icon>
          </div>
        </li>
      </ul>
    </v-sheet>
    <div>
      <v-overlay :model-value="showOverlay" class="align-center justify-center">
        <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
      </v-overlay>
    </div>
  </v-container>
</template>
<style scoped lang="scss">
@import './styles.scss';
</style>
