<template>
  <v-container>
    <v-sheet max-width="638" width="100%" class="mx-auto d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-avatar
          size="36px"
          :icon="userData?.avatar ? '' : 'mdi-account-circle'"
          class="mr-2"
        >
          <v-img alt="Avatar" :src="userData?.avatar"></v-img>
        </v-avatar>
        <i> Tài khoản: </i><strong>{{ userData?.username }}</strong>
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
      <v-col v-for="topic in filteredTopics" :key="topic._id" cols="12" sm="12">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            color="indigo-lighten-5"
            :elevation="isHovering ? 12 : 2"
            v-bind="props"
            :class="isHovering ? 'bg-indigo-lighten-2' : ''"
            @click="goTopicVote(topic._id)"
          >
            <template v-slot:title>
              <div class="d-flex justify-space-between">
                <div>{{ topic.title }}</div>
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

  <!-- <v-dialog v-model="showVoteDialog" width="auto">
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
  </v-dialog> -->
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { getTopicList } from '@/services/topic.service'
import { getCurrentUserProfile } from '@/services/user.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'
import { EUserRole, ETopicTeam } from '@/core/constants/enum'
import useCommon from '@/core/hooks/useCommon'
import { useUserStore } from '@/stores/user'
import { useCookie } from '@/core/hooks/useCookie'
import { CookieKeys } from '@/core/utils/cookieUtils'

const { handleRouter, storage } = useCommon('useCommonStore')
const userStore = useUserStore()

// Use cookie hook for user data
const userDataCookie = useCookie(CookieKeys.USER_DATA, '')
const tokenCookie = useCookie(CookieKeys.ACCESS_TOKEN, '')
const refreshTokenCookie = useCookie(CookieKeys.REFRESH_TOKEN, '')
const userData = ref<IUser | null>(null)

// State
const activeTab = ref<'open' | 'close'>('open')
const topics = ref<ITopic[]>([])
const searchTerm = ref('')
// const showVoteDialog = ref(false)
// const voteList = ref<IUser[]>([])

// Computed
const filteredTopics = computed(() => {
  const tabFiltered = topics.value.filter((topic) =>
    activeTab.value === 'open' ? topic.isActive : !topic.isActive
  )

  if (!searchTerm.value) return tabFiltered

  return tabFiltered.filter((topic) =>
    topic.title.toLowerCase().includes(searchTerm.value.toLowerCase())
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
  tokenCookie.remove()
  refreshTokenCookie.remove()
  userDataCookie.remove()
  storage.removeLocalStorage('user')
  storage.removeLocalStorage('topics')
  storage.removeLocalStorage('app_preferences')
  handleRouter.pushPath('/login')
}

const getUserData = async () => {
  try {
    const userProfile = await getCurrentUserProfile()

    // Map API response to IUser format
    userData.value = {
      id: userProfile._id,
      email: userProfile.email,
      username: userProfile.username,
      avatar: userProfile.avatar,
      role: userProfile.role as EUserRole,
      team: userProfile.team as ETopicTeam
    }
    userStore.setUser(userData.value)
  } catch (error) {
    console.error('Error fetching user data:', error)
    // Fallback to cookie data if API fails
    const cookieUserData = userDataCookie.value
    if (cookieUserData && typeof cookieUserData === 'string') {
      try {
        userData.value = JSON.parse(cookieUserData)
      } catch (parseError) {
        console.error('Error parsing cookie user data:', parseError)
      }
    }
  }
}

const fetchTopics = async () => {
  if (!userData.value?.team) return

  try {
    topics.value = await getTopicList({ team: userData.value.team, page: 1, limit: 99 })
  } catch (error) {
    console.error('Error fetching topics:', error)
  }
}

// Lifecycle
onBeforeMount(async () => {
  await getUserData()
  await fetchTopics()
})
</script>

<style scoped lang="scss">
@use './styles.scss';
</style>
