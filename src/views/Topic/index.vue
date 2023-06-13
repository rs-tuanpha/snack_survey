<script setup lang="ts">
import { onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

import stringMinify from '@/core/utils/stringMinify'
import { useOptionsStore } from '@/stores/options'
import { useCommonStore } from '@/stores'

const common = useCommonStore()
const optionStore = useOptionsStore()
const route = useRoute()
const currentTopic = computed(() => optionStore.currentTopic)
const options = computed(() => optionStore.options)

const form = reactive({
  link: '',
  title: ''
})

/**
 * Dispatch action to create option in firestore
 * Dispatch action to reload options data
 */
const handleSubmitForm = async () => {
  if (form.link && form.title) {
    await optionStore.createOption({ ...form })
    await optionStore.setOptions(route.params.id.toString())
    form.link = ''
    form.title = ''

    alert('Create Option success!')
    return
  }
  alert('Please input valid information!')
}

onMounted(() => {
  optionStore.setCurrentTopic(route.params.id.toString())
  optionStore.setOptions(route.params.id.toString())
})
</script>

<template>
  <v-container>
    <v-alert
      v-if="!common.loading && optionStore.currentTopic?.status == 'close'"
      variant="outlined"
      type="warning"
      prominent
      border="top"
    >
      This topic is closing
    </v-alert>

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
      <v-form @submit.prevent>
        <v-text-field v-model="form.title" label="Vote title"></v-text-field>
        <v-text-field v-model="form.link" label="Vote link"></v-text-field>
        <v-btn type="submit" block class="mt-2" @click="handleSubmitForm">Submit</v-btn>
      </v-form>
    </v-sheet>

    <v-sheet
      v-if="optionStore.currentTopic?.status == 'open'"
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
              <div v-for="user in option.voteBy.slice(0, 3)" :key="user.name" class="mr-1">
                <v-avatar color="secondary" class="m-1" size="30">
                  <v-img v-if="user.avatar" :src="user.avatar" :alt="user.name"></v-img>
                  <span v-else>{{ user.name.charAt(0).toLocaleUpperCase() }}</span>
                  <v-tooltip activator="parent" location="top">{{ user.name }}</v-tooltip>
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
