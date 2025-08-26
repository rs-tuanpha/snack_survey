<template>
  <v-container>
    <!-- Header Section -->
    <v-row justify="center" class="mb-4">
      <v-col cols="12" md="10" lg="8">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-format-list-bulleted" class="mr-2" color="primary"></v-icon>
              <span class="text-h5">Danh sách Topics</span>
            </div>
            <v-btn
              v-if="isAdmin"
              color="primary"
              prepend-icon="mdi-plus"
              @click="navigateToCreate"
              class="text-none"
            >
              Tạo Topic
            </v-btn>
          </v-card-title>
          
          <!-- Filters and Search -->
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-tabs v-model="activeTab" bg-color="primary" class="rounded">
                  <v-tab value="open">Topics đang mở</v-tab>
                  <v-tab value="closed">Topics đã đóng</v-tab>
                </v-tabs>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchTerm"
                  label="Tìm kiếm topic"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
            </v-row>
            
            <!-- Team Filter -->
            <v-row class="mt-2">
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedTeam"
                  :items="teamOptions"
                  label="Lọc theo team"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="isLoading" justify="center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4 text-h6">Đang tải topics...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error" justify="center">
      <v-col cols="12" md="8">
        <v-alert type="error" variant="tonal" class="mb-4">
          <v-alert-title>Lỗi tải dữ liệu</v-alert-title>
          {{ error }}
          <template #append>
            <v-btn color="error" variant="text" @click="refetch">
              Thử lại
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Topics Display -->
    <v-row v-else justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Data Table View -->
        <v-card v-if="viewMode === 'table'" elevation="2" rounded="lg">
          <v-data-table
            :headers="tableHeaders"
            :items="filteredTopics"
            :search="searchTerm"
            :loading="isLoading"
            :items-per-page="itemsPerPage"
            :page="currentPage"
            @update:page="currentPage = $event"
            class="elevation-1"
          >
            <!-- Status Column -->
            <template #item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status, item.date)"
                variant="flat"
                size="small"
              >
                {{ getStatusText(item.status, item.date) }}
              </v-chip>
            </template>

            <!-- Team Column -->
            <template #item.team="{ item }">
              <v-chip
                :color="getTeamColor(item.team)"
                variant="outlined"
                size="small"
              >
                {{ item.team }}
              </v-chip>
            </template>

            <!-- Date Column -->
            <template v-slot:item.date="{ item }">
              <span v-if="item.date">
                {{ formatDate(item.date) }}
              </span>
              <span v-else class="text-grey">-</span>
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-1">
                <v-btn
                  color="primary"
                  variant="text"
                  size="small"
                  @click="viewTopicDetail(item.id)"
                  class="text-none"
                >
                  Xem chi tiết
                </v-btn>
                
                <template v-if="isAdmin">
                  <v-btn
                    color="blue-darken-2"
                    variant="text"
                    size="small"
                    @click="editTopic(item.id)"
                    class="text-none"
                  >
                    Sửa
                  </v-btn>
                  <v-btn
                    color="red-darken-1"
                    variant="text"
                    size="small"
                    @click="confirmDelete(item)"
                    class="text-none"
                  >
                    Xóa
                  </v-btn>
                </template>
              </div>
            </template>

            <!-- Empty State -->
            <template #no-data>
              <div class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-outline</v-icon>
                <p class="text-h6 mt-4 text-grey">
                  {{ activeTab === 'open' ? 'Không có topics đang mở' : 'Không có topics đã đóng' }}
                </p>
                <v-btn
                  v-if="isAdmin"
                  color="primary"
                  @click="navigateToCreate"
                  class="mt-4 text-none"
                >
                  Tạo Topic đầu tiên
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Card Grid View -->
        <div v-else>
          <v-row v-if="filteredTopics.length > 0">
            <v-col
              v-for="topic in paginatedTopics"
              :key="topic.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-hover #default="{ isHovering, props }">
                <v-card
                  v-bind="props"
                  :elevation="isHovering ? 8 : 2"
                  :class="{ 'on-hover': isHovering }"
                  class="topic-card"
                  height="200"
                  @click="viewTopicDetail(topic.id)"
                >
                  <v-card-title class="text-h6">
                    {{ topic.name }}
                  </v-card-title>
                  
                  <v-card-subtitle v-if="topic.description">
                    {{ truncateText(topic.description, 60) }}
                  </v-card-subtitle>
                  
                  <v-card-text>
                    <div class="d-flex flex-column gap-2">
                      <div class="d-flex align-center gap-2">
                        <v-chip
                          :color="getStatusColor(topic.status, topic.date)"
                          variant="flat"
                          size="small"
                        >
                          {{ getStatusText(topic.status, topic.date) }}
                        </v-chip>
                        <v-chip
                          :color="getTeamColor(topic.team)"
                          variant="outlined"
                          size="small"
                        >
                          {{ topic.team }}
                        </v-chip>
                      </div>
                      
                      <div v-if="topic.date" class="text-caption text-grey">
                        <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                        {{ formatDate(topic.date) }}
                      </div>
                    </div>
                  </v-card-text>

                  <v-card-actions v-if="isAdmin" class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn
                      color="blue-darken-2"
                      variant="text"
                      size="small"
                      @click.stop="editTopic(topic.id)"
                    >
                      Sửa
                    </v-btn>
                    <v-btn
                      color="red-darken-1"
                      variant="text"
                      size="small"
                      @click.stop="confirmDelete(topic)"
                    >
                      Xóa
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>

          <!-- Empty State for Cards -->
          <v-row v-else justify="center">
            <v-col cols="12" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-outline</v-icon>
              <p class="text-h6 mt-4 text-grey">
                {{ activeTab === 'open' ? 'Không có topics đang mở' : 'Không có topics đã đóng' }}
              </p>
              <v-btn
                v-if="isAdmin"
                color="primary"
                @click="navigateToCreate"
                class="mt-4 text-none"
              >
                Tạo Topic đầu tiên
              </v-btn>
            </v-col>
          </v-row>

          <!-- Pagination for Cards -->
          <v-row v-if="filteredTopics.length > itemsPerPage" justify="center" class="mt-4">
            <v-col cols="auto">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                color="primary"
              ></v-pagination>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>

    <!-- View Mode Toggle -->
    <v-fab
      location="bottom end"
      size="small"
      color="primary"
      @click="toggleViewMode"
    >
      <v-icon>{{ viewMode === 'table' ? 'mdi-view-grid' : 'mdi-table' }}</v-icon>
    </v-fab>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">
          Xác nhận xóa
        </v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa topic "<strong>{{ topicToDelete?.name }}</strong>" không?
          <br>
          <span class="text-red">Hành động này không thể hoàn tác.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="cancelDelete"
            class="text-none"
          >
            Hủy
          </v-btn>
          <v-btn
            color="red-darken-1"
            variant="flat"
            @click="handleDelete"
            :loading="deleteLoading"
            class="text-none"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTopicStore } from '@/stores/topic'
import { useAuthStore } from '@/stores/auth'
import type { ITopic } from '@/core/interfaces/model/topic'
import { ETopicTeam, EUserRole } from '@/core/constants/enum'

// Stores
const topicStore = useTopicStore()
const authStore = useAuthStore()
const router = useRouter()

// Component State
const activeTab = ref<'open' | 'closed'>('open')
const searchTerm = ref('')
const selectedTeam = ref<string | null>(null)
const viewMode = ref<'table' | 'cards'>('table')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const deleteDialog = ref(false)
const topicToDelete = ref<ITopic | null>(null)
const deleteLoading = ref(false)

// Snackbar state
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Team filter options
const teamOptions = [
  { title: 'Tất cả', value: null },
  { title: 'Frontend', value: ETopicTeam.FE },
  { title: 'Backend', value: ETopicTeam.BE },
  { title: 'All Teams', value: ETopicTeam.ALL }
]

// Data table headers
const tableHeaders = [
  { title: 'Tên Topic', key: 'name', sortable: true },
  { title: 'Mô tả', key: 'description', sortable: false },
  { title: 'Team', key: 'team', sortable: true },
  { title: 'Trạng thái', key: 'status', sortable: true },
  { title: 'Ngày hết hạn', key: 'date', sortable: true },
  { title: 'Thao tác', key: 'actions', sortable: false, width: '200px' }
]

// Vue Query integration
const {
  data: topics,
  isLoading,
  error,
  refetch
} = topicStore.useTopicsQuery(selectedTeam.value, activeTab.value)

// Computed properties
const isAdmin = computed(() => {
  return authStore.user?.role === EUserRole.ADMIN
})

const filteredTopics = computed(() => {
  if (!topics.value) return []
  
  let filtered = [...topics.value]
  
  // Filter by search term
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(topic => 
      topic.name.toLowerCase().includes(search) ||
      (topic.description && topic.description.toLowerCase().includes(search))
    )
  }
  
  return filtered
})

const paginatedTopics = computed(() => {
  if (viewMode.value === 'table') return filteredTopics.value
  
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTopics.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTopics.value.length / itemsPerPage.value)
})

// Methods
const getStatusColor = (status: boolean | null | string | undefined, date?: Date): string => {
  if (status === true && date && new Date(date) >= new Date()) {
    return 'success'
  } else if (status === false || (date && new Date(date) < new Date())) {
    return 'error'
  }
  return 'warning'
}

const getStatusText = (status: boolean | null | string | undefined, date?: Date): string => {
  if (status === true && date && new Date(date) >= new Date()) {
    return 'Đang mở'
  } else if (status === false || (date && new Date(date) < new Date())) {
    return 'Đã đóng'
  }
  return 'Không xác định'
}

const getTeamColor = (team?: string): string => {
  switch (team) {
    case ETopicTeam.FE:
      return 'blue'
    case ETopicTeam.BE:
      return 'green'
    case ETopicTeam.ALL:
      return 'purple'
    default:
      return 'grey'
  }
}

const formatDate = (date: Date): string => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'table' ? 'cards' : 'table'
}

// Navigation methods
const viewTopicDetail = (id: string) => {
  router.push({ name: 'topicVote', params: { id } })
}

const navigateToCreate = () => {
  router.push({ name: 'topicAmin' }) // Navigate to admin page for creation
}

const editTopic = (id: string) => {
  router.push({ name: 'topicAmin', query: { edit: id } })
}

// Delete functionality
const confirmDelete = (topic: ITopic) => {
  topicToDelete.value = topic
  deleteDialog.value = true
}

const cancelDelete = () => {
  deleteDialog.value = false
  topicToDelete.value = null
}

const handleDelete = async () => {
  if (!topicToDelete.value) return
  
  deleteLoading.value = true
  
  try {
    const deleteMutation = topicStore.useDeleteTopicMutation()
    await deleteMutation.mutateAsync(topicToDelete.value.id)
    
    showSnackbar('Topic đã được xóa thành công', 'success')
    deleteDialog.value = false
    topicToDelete.value = null
  } catch (error) {
    console.error('Failed to delete topic:', error)
    showSnackbar('Lỗi khi xóa topic', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const showSnackbar = (message: string, color: 'success' | 'error' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Watchers
watch([activeTab, selectedTeam], async () => {
  // Refetch data when filters change
  await refetch()
}, { immediate: false })

// Lifecycle
onMounted(async () => {
  try {
    await topicStore.loadTopics(selectedTeam.value, activeTab.value)
  } catch (error) {
    console.error('Failed to load topics on mount:', error)
    showSnackbar('Lỗi khi tải danh sách topics', 'error')
  }
})
</script>

<style scoped>
.topic-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.topic-card.on-hover {
  transform: translateY(-2px);
}

.v-data-table {
  border-radius: 8px;
}
</style>
