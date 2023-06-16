<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { useRoute } from 'vue-router'

import stringMinify from '@/core/utils/stringMinify'
import { db } from '@/plugins/firebase'
import { getOptionsByTopicId, postNewOption } from '@/services/option.service'
import { useCommonStore } from '@/stores'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'

const common = useCommonStore()
const route = useRoute()
const currentTopic = useDocument<ITopic>(doc(db, 'topics', route.params.id.toString()))
const options = ref<IOption[]>([])
const form = reactive({
  link: '',
  title: ''
})

onMounted(async () => {
  const res = await getOptionsByTopicId(route.params.id.toString())
  options.value = res
})

const handleSubmitForm = async () => {
  if (form.link && form.title) {
    await postNewOption(form.title, form.link, route.params.id.toString())
    options.value = await getOptionsByTopicId(route.params.id.toString())
    form.link = ''
    form.title = ''
    alert('Create Option success!')
    return
  }
  alert('Please input valid information!')
}
</script>

<template>
  <v-container>
    <v-sheet
      v-if="!common.loading && currentTopic?.status == 'close'"
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
      <v-form @submit.prevent v-if="currentTopic?.status == 'open'">
        <v-text-field v-model="form.title" label="Vote title"></v-text-field>
        <v-text-field v-model="form.link" label="Vote link"></v-text-field>
        <v-btn type="submit" block class="mt-2" @click="handleSubmitForm">Submit</v-btn>
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
          v-for="option in options"
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
            <v-btn class="h-100 btn-border">Vote</v-btn>
          </div>
        </li>
      </ul>
    </v-sheet>
  </v-container>
</template>
<style scoped lang="scss">
@import './styles.scss';
</style>
