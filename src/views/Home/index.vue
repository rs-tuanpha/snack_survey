<template>
  <v-container>
    <v-sheet max-width="638" width="100%" class="mx-auto d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-avatar
          size="36px"
          :icon="userStore.getUser?.avatar ? '' : 'mdi-account-circle'"
          class="mr-2"
        >
          <v-img alt="Avatar" :src="userStore.getUser?.avatar"></v-img>
        </v-avatar>
        <i> Tài khoản: </i><strong>{{ userStore.getUser?.username }}</strong>
      </div>
      <v-btn class="ma-2 logout-btn" color="red" @click="handleLogout">
        <v-icon icon="mdi-logout-variant"></v-icon>
      </v-btn>
    </v-sheet>

    <v-sheet max-width="638" width="100%" class="mx-auto mb-2 pa-2" elevation="1" rounded>
      <v-tabs v-model="activeTab" bg-color="primary" class="mb-1 rounded">
        <v-tab value="open" width="50%">Topics đang mở</v-tab>
        <v-tab value="close" width="50%">Topics đã đóng</v-tab>
      </v-tabs>
      <v-text-field
        v-model="searchTerm"
        class="w-full mx-auto"
        density="compact"
        label="Tìm topic"
        append-inner-icon="mdi-magnify"
        single-line
        hide-details
        @click:append-inner="handleSearch"
      ></v-text-field>
    </v-sheet>

    <v-sheet
      v-if="filteredTopics.length"
      class="mx-auto pa-2"
      border
      rounded
      min-width="350"
      max-width="638"
      width="100%"
    >
      <v-col v-for="topic in filteredTopics" :key="topic.id" cols="12" sm="12">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            color="indigo-lighten-5"
            :elevation="isHovering ? 12 : 2"
            v-bind="props"
            :class="isHovering ? 'bg-indigo-lighten-2' : ''"
            @click="goTopicVote(topic.id)"
          >
            <template v-slot:title>
              <div class="d-flex justify-space-between">
                <div>{{ topic.name }}</div>
              </div>
            </template>
          </v-card>
        </v-hover>
      </v-col>
    </v-sheet>
    <v-sheet
      v-if="activeTab === 'open' && !filteredTopics.length"
      class="mx-auto pa-2"
      border
      rounded
      min-width="350"
      max-width="638"
      width="100%"
    >
      <v-alert variant="outlined" type="warning" prominent border="top">
        Hiện tại không có topic nào đang mở
      </v-alert>
    </v-sheet>
  </v-container>

  <v-dialog v-model="showVoteDialog" width="auto">
    <v-card>
      <v-card-title>Danh sách vote</v-card-title>
      <v-divider></v-divider>
      <v-card-text max-height="300px" class="pa-3">
        <div v-for="user in voteList" :key="user.username" class="mr-1">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTopicList } from '@/services/topic.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'
import useCommon from '@/core/hooks/useCommon'
import { useUserStore } from '@/stores/user'
import Cookies from 'js-cookie'

const { handleRouter } = useCommon('useCommonStore')
const userStore = useUserStore()
const userData = useUserStore().getUser!

// State
const activeTab = ref<'open' | 'close'>('open')
const topics = ref<ITopic[]>([])
const searchTerm = ref('')
const showVoteDialog = ref(false)
const voteList = ref<IUser[]>([])

// Computed
const filteredTopics = computed(() => {
  const tabFiltered = topics.value.filter((topic) =>
    activeTab.value === 'open' ? topic.status : !topic.status
  )

  if (!searchTerm.value) return tabFiltered

  return tabFiltered.filter((topic) =>
    topic.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// Methods
const handleSearch = () => {
  // Search is handled by computed property
}

const goTopicVote = (id: string) => {
  handleRouter.pushName('topicVote', { params: { id } })
}

const handleLogout = () => {
  Cookies.remove('auth_token', { path: '/' })
  localStorage.clear()
  handleRouter.pushPath('/login')
}

const fetchTopics = async () => {
  if (!userData.team) return

  try {
    topics.value = await getTopicList({ team: userData.team })
  } catch (error) {
    console.error('Error fetching topics:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchTopics()
})
</script>

<style scoped lang="scss">
@import './styles.scss';
</style>
