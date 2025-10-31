<template>
  <v-container>
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

    <!-- Loading State -->
    <v-sheet
      v-if="isLoadingTopics"
      class="mx-auto pa-4"
      border
      rounded
      min-width="350"
      max-width="638"
      width="100%"
    >
      <div class="d-flex justify-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="ml-2">Đang tải topics...</span>
      </div>
    </v-sheet>

    <v-sheet
      v-else-if="filteredTopics.length"
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

    <!-- Pagination Controls -->
    <v-sheet
      v-if="totalPages > 1"
      class="mx-auto pa-4"
      border
      rounded
      min-width="350"
      max-width="638"
      width="100%"
    >
      <div class="d-flex flex-column align-center">
        <!-- Pagination Info -->
        <div class="text-caption text-medium-emphasis mb-2">
          Hiển thị {{ ((currentPage - 1) * pageSize) + 1 }}-{{ Math.min(currentPage * pageSize, totalTopics) }} 
          trong tổng số {{ totalTopics }} topics
        </div>
        
        <!-- Pagination Component -->
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          @update:model-value="handlePageChange"
          :disabled="isLoadingTopics"
          color="primary"
        ></v-pagination>
        
        <!-- Previous/Next Buttons -->
        <div class="d-flex gap-2 mt-2">
          <v-btn
            :disabled="currentPage <= 1 || isLoadingTopics"
            @click="goToPreviousPage"
            variant="outlined"
            size="small"
          >
            <v-icon left>mdi-chevron-left</v-icon>
            Trước
          </v-btn>
          
          <v-btn
            :disabled="currentPage >= totalPages || isLoadingTopics"
            @click="goToNextPage"
            variant="outlined"
            size="small"
          >
            Sau
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>
    </v-sheet>
    <v-sheet
      v-if="!isLoadingTopics && activeTab === 'open' && !filteredTopics.length"
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
import { ref, computed, onBeforeMount, watch } from 'vue'
import { getTopicList } from '@/services/topic.service'
import { getCurrentUserProfile } from '@/services/user.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'
import { EUserRole, ETopicTeam } from '@/core/constants/enum'
import useCommon from '@/core/hooks/useCommon'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useCookie } from '@/core/hooks/useCookie'
import { CookieKeys } from '@/core/utils/cookieUtils'

const { handleRouter } = useCommon('useCommonStore')
const userStore = useUserStore()
const authStore = useAuthStore()

// Use cookie hook for user data fallback
const userDataCookie = useCookie(CookieKeys.USER_DATA, '')
const userData = ref<IUser | null>(null)

// State
const activeTab = ref<'open' | 'close'>('open')
const topics = ref<ITopic[]>([])
const searchTerm = ref('')
// const showVoteDialog = ref(false)
// const voteList = ref<IUser[]>([])

// Pagination state
const currentPage = ref(1)
const totalPages = ref(1)
const totalTopics = ref(0)
const pageSize = 20
const isLoadingTopics = ref(false)

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

// Watch for search term changes to reset pagination
watch(searchTerm, () => {
  if (searchTerm.value) {
    currentPage.value = 1
  }
})

// Methods
const handleSearch = () => {
  // Search is handled by computed property
  // Reset to page 1 when searching
  currentPage.value = 1
  fetchTopics(1)
}

// Pagination methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchTopics(page)
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

const handlePageChange = (page: number) => {
  goToPage(page)
}

const goTopicVote = (id: string) => {
  handleRouter.pushName('topicVote', { params: { id } })
}

const getUserData = async () => {
  // Try to get from stores first
  if (userStore.user) {
    userData.value = userStore.user
    return
  }
  
  if (authStore.user) {
    userData.value = authStore.user
    userStore.setUser(authStore.user)
    return
  }

  // Fallback to API or cookie
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

const fetchTopics = async (page = 1) => {
  if (!userData.value?.team) return

  isLoadingTopics.value = true
  try {
    const response = await getTopicList({ 
      team: userData.value.team, 
      page, 
      limit: pageSize 
    })
    
    topics.value = response.data as any as ITopic[]
    currentPage.value = response.pagination.page
    totalPages.value = response.pagination.totalPages
    totalTopics.value = response.pagination.total
  } catch (error) {
    console.error('Error fetching topics:', error)
  } finally {
    isLoadingTopics.value = false
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
