<template>
  <v-container>
    <v-row justify="center">
      <!-- Modal delete topic confirmation -->
      <dialog-delete-topic
        v-model="deleteDialog"
        :text="deleteConfirmText"
        :is-loading="deleteTopicMutation.isPending.value"
        @confirm="confirmDeleteTopic"
        @cancel="deleteDialog = false"
      />

      <!-- Modal create topic -->
      <form-create-topic
        v-model="isShowModalCreateTopic"
        hide-activator
        @close="isShowModalCreateTopic = false"
      />

      <!-- Modal edit topic -->
      <form-edit-topic
        v-if="editingTopic"
        v-model="isShowModalEditTopic"
        :topic="editingTopic"
        hide-activator
        @close="handleCloseEditTopicDialog"
      />

      <!-- Modal show list option of topic -->
      <dialog-list-options
        v-if="topicId && topicState.data"
        v-model="listOptionDlg"
        :topic-id="topicId"
        :topic="topicState"
        @close="handleCloseOptionsDialog"
      />
    </v-row>

    <v-row justify="center">
      <v-col sm="12" md="12" lg="12" xl="8">
        <v-sheet class="pa-2 mb-4" border rounded>
          <div class="d-flex justify-end">
            <v-btn prepend-icon="mdi-plus" color="primary" @click="isShowModalCreateTopic = true">
              Tạo mới topic
            </v-btn>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col sm="12" md="12" lg="12" xl="8">
        <v-sheet class="pa-2" border rounded>
          <v-table
            id="admin-table"
            fixed-header
            :height="topics && topics.length > 10 ? '400px' : ''"
          >
            <thead>
              <tr>
                <th class="text-left" scope="col">STT</th>
                <th class="text-left" scope="col">Tên topic</th>
                <th class="text-left" scope="col" style="width: 90px">Trạng thái</th>
                <th class="text-left" scope="col" style="width: 120px">Ngày bắt đầu</th>
                <th class="text-left" scope="col" style="width: 120px">Ngày kết thúc</th>
                <th class="text-left" scope="col" style="width: 120px">Loại topic</th>
                <th class="text-left" scope="col" style="width: 120px">Cho phép thêm option</th>
                <th class="text-center" scope="col" style="width: 280px">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingTopics">
                <td colspan="8" class="text-center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </td>
              </tr>
              <tr v-else-if="topicsError">
                <td colspan="8" class="text-center text-error">
                  Lỗi khi tải dữ liệu: {{ topicsError }}
                </td>
              </tr>
              <tr v-else-if="!topics || topics.length === 0">
                <td colspan="8" class="text-center">Không có topic nào</td>
              </tr>
              <tr v-else v-for="(item, index) in topics" :key="item._id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.title }}</td>
                <td>
                  {{ item.isActive ? 'Mở' : 'Đóng' }}
                </td>
                <td>
                  {{ item.startDate ? dayjs(item.startDate).format('DD/MM/YYYY HH:mm') : '-' }}
                </td>
                <td>
                  {{
                    item.endDate ? dayjs(item.endDate).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'
                  }}
                </td>
                <td>
                  {{ item.votingType === 'single' ? 'Đơn' : 'Nhiều' }}
                </td>
                <td>
                  {{ item.isMutable !== false ? 'Có' : 'Không' }}
                </td>
                <td>
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="blue-darken-2"
                    @click="handleEditTopic(item._id)"
                    >Sửa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="red-darken-1"
                    @click="handleDeleteTopic(item._id)"
                    >Xóa</v-btn
                  >
                  <v-btn
                    class="text-none w-auto ma-1"
                    color="purple-darken-2"
                    @click="showOptionList(item._id)"
                    >+Options</v-btn
                  >
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from 'vue'
import { useTopicsList, useDeleteTopic } from '@/services/topic.service'
import { initTopicState } from './Admin.state'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IState } from '@/core/interfaces/model/state'
import dayjs from 'dayjs'

// Lazy load all dialog components
const FormCreateTopic = defineAsyncComponent(
  () => import('@/components/organisms/FormCreateTopic.vue')
)
const FormEditTopic = defineAsyncComponent(() => import('@/components/organisms/FormEditTopic.vue'))
const DialogDeleteTopic = defineAsyncComponent(
  () => import('@/components/organisms/DialogDeleteTopic.vue')
)
const DialogListOptions = defineAsyncComponent(
  () => import('@/components/organisms/DialogListOptions.vue')
)

// Composables
const { data: topicsData, isLoading: isLoadingTopics, error: topicsError } = useTopicsList()
const deleteTopicMutation = useDeleteTopic()

// Computed - Map topics from API response (already converted to ITopic by adaptApiTopicToITopic)
const topics = computed<ITopic[]>(() => {
  if (!topicsData.value?.data) return []
  // Data is already converted to ITopic[] by adaptApiTopicToITopic in getTopicList
  return topicsData.value.data as unknown as ITopic[]
})

// State
const topicId = ref<string>('')
const deleteDialog = ref<boolean>(false)
const deleteConfirmText = ref<string>('Bạn có muốn xóa topic không?')
const topicToDelete = ref<string>('')
const listOptionDlg = ref<boolean>(false)
const isShowModalCreateTopic = ref<boolean>(false)
const isShowModalEditTopic = ref<boolean>(false)
const editingTopic = ref<ITopic | null>(null)

const topicState = ref<IState<ITopic>>({ ...initTopicState })

// Methods

const handleDeleteTopic = (topicIdToDelete: string) => {
  deleteConfirmText.value = 'Bạn có muốn xóa topic không?'
  topicToDelete.value = topicIdToDelete
  deleteDialog.value = true
}

const confirmDeleteTopic = async () => {
  try {
    await deleteTopicMutation.mutateAsync(topicToDelete.value)
    deleteDialog.value = false
    topicToDelete.value = ''
  } catch (e) {
    console.error('Failed to delete topic:', e)
    deleteDialog.value = false
  }
}

const handleEditTopic = async (id: string) => {
  const topicData = topics.value?.find((topic) => topic._id === id)
  if (topicData) {
    editingTopic.value = topicData
    isShowModalEditTopic.value = true
  }
}

const handleCloseEditTopicDialog = () => {
  editingTopic.value = null
  isShowModalEditTopic.value = false
}

const showOptionList = (id: string) => {
  // Find and set topic data
  const topicData = topics.value?.find((topic) => topic._id === id)
  if (!topicData) {
    console.error('Topic not found:', id)
    return
  }

  // Set topicId and topicState to display dialog
  topicId.value = id
  topicState.value.data = topicData

  // Open dialog - component will handle loading options internally
  listOptionDlg.value = true
}

const handleCloseOptionsDialog = () => {
  listOptionDlg.value = false
  // Reset state when dialog closes
  topicId.value = ''
  topicState.value = { ...initTopicState }
}
</script>

<style lang="scss" scoped>
.topic-tbl {
  max-height: 300px;
  overflow: auto;
}
.btn-wrapper {
  text-align: center;
}
#admin-table {
  tr > th,
  td {
    padding: 0 8px;
  }
}
</style>
