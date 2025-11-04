<template>
  <v-container>
    <v-row justify="center">
      <!-- Modal delete/disable confirmation -->
      <v-dialog
        v-model="actionDialog"
        persistent
        width="auto"
      >
        <v-card min-height="120">
          <v-card-text>{{ actionConfirmText }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              class="text-none"
              color="red-darken-1"
              variant="flat"
              @click="actionDialog = false"
              :disabled="isActionLoading"
            >
              Không
            </v-btn>
            <v-btn
              class="text-none"
              color="blue-darken-2"
              variant="flat"
              @click="confirmAction"
              :loading="isActionLoading"
              :disabled="isActionLoading"
            >
              Có
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Modal create user -->
      <form-create-user
        v-model="isShowModalCreateUser"
        hide-activator
        @close="isShowModalCreateUser = false"
      />
    </v-row>

    <v-row justify="center">
      <v-col sm="12" md="12" lg="12" xl="8">
        <v-sheet class="pa-2 mb-4" border rounded>
          <div class="d-flex justify-space-between align-center flex-wrap">
            <!-- Search and Filter Section -->
            <div class="d-flex align-center flex-wrap ga-2" style="flex: 1; min-width: 300px;">
              <v-text-field
                v-model="searchEmail"
                label="Tìm kiếm email"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                style="max-width: 250px;"
                @update:model-value="handleSearch"
                @keydown.enter="handleSearch"
              ></v-text-field>
              
              <v-checkbox
                v-model="filterActive"
                label="Active"
                hide-details
                density="compact"
                @update:model-value="handleFilterChange"
              ></v-checkbox>
              
              <v-checkbox
                v-model="filterInactive"
                label="Inactive"
                hide-details
                density="compact"
                @update:model-value="handleFilterChange"
              ></v-checkbox>
            </div>
            
            <!-- Create Button -->
            <div>
              <v-btn prepend-icon="mdi-plus" color="primary" @click="isShowModalCreateUser = true">
                Tạo mới user
              </v-btn>
            </div>
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
            :height="users && users.length > 10 ? '400px' : ''"
          >
            <thead>
              <tr>
                <th class="text-left" scope="col">STT</th>
                <th class="text-left" scope="col">Username</th>
                <th class="text-left" scope="col">Email</th>
                <th class="text-left" scope="col" style="width: 90px">Role</th>
                <th class="text-left" scope="col" style="width: 120px">Trạng thái</th>
                <th class="text-center" scope="col" style="width: 300px">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingUsers">
                <td colspan="6" class="text-center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </td>
              </tr>
              <tr v-else-if="usersError">
                <td colspan="6" class="text-center text-error">
                  Lỗi khi tải dữ liệu: {{ usersError }}
                </td>
              </tr>
              <tr v-else-if="!users || users.length === 0">
                <td colspan="6" class="text-center">Không có user nào</td>
              </tr>
              <tr v-else v-for="(item, index) in users" :key="item._id">
                <td>{{ (currentPage - 1) * pageLimit + index + 1 }}</td>
                <td>{{ item.username }}</td>
                <td>{{ item.email }}</td>
                <td>
                  {{ item.role === 'admin' ? 'Admin' : 'User' }}
                </td>
                <td>
                  {{ item.isActive !== false ? 'Active' : 'Inactive' }}
                </td>
                <td>
                  <template v-if="item.isActive !== false">
                    <v-btn
                      class="text-none w-auto ma-1"
                      color="orange-darken-2"
                      @click="handleDisableUser(item._id)"
                      :loading="toggleStatusMutation.isPending.value && pendingUserId === item._id"
                      :disabled="toggleStatusMutation.isPending.value"
                      >Disable</v-btn
                    >
                    <v-btn
                      class="text-none w-auto ma-1"
                      color="purple-darken-2"
                      @click="handleResetPassword(item._id)"
                      :loading="resetPasswordMutation.isPending.value && pendingUserId === item._id"
                      :disabled="resetPasswordMutation.isPending.value"
                      >Reset Password</v-btn
                    >
                  </template>
                  <template v-else>
                    <v-btn
                      class="text-none w-auto ma-1"
                      color="green-darken-2"
                      @click="handleReactivateUser(item._id)"
                      :loading="toggleStatusMutation.isPending.value && pendingUserId === item._id"
                      :disabled="toggleStatusMutation.isPending.value"
                      >Reactivate</v-btn
                    >
                  </template>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-row v-if="pagination && pagination.totalPages > 1" justify="center">
      <v-col sm="12" md="12" lg="12" xl="8">
        <v-sheet class="pa-4" border rounded>
          <div class="d-flex flex-column align-center">
            <!-- Pagination Info -->
            <div class="text-caption text-medium-emphasis mb-2">
              Hiển thị {{ ((pagination.page - 1) * pagination.limit) + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} 
              trong tổng số {{ pagination.total }} users
            </div>
            
            <!-- Pagination Component -->
            <v-pagination
              v-model="currentPage"
              :length="pagination.totalPages"
              :total-visible="7"
              @update:model-value="handlePageChange"
              :disabled="isLoadingUsers"
              color="primary"
            ></v-pagination>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, watch } from 'vue'
import { useUsersList, useToggleUserStatus, useAdminResetPassword } from '@/services/user.service'
import type { User } from '@/types/api'
import { useSnackbar } from '@/core/hooks/useSnackbar'

// Lazy load dialog components
const FormCreateUser = defineAsyncComponent(
  () => import('@/components/organisms/FormCreateUser.vue')
)

// State for search and filter
const searchEmail = ref<string>('')
const filterActive = ref<boolean>(true)
const filterInactive = ref<boolean>(true)
const currentPage = ref<number>(1)
const pageLimit = ref<number>(10)

// Computed query params
const queryParams = computed(() => {
  const params: { page?: number; limit?: number; search?: string; isActive?: boolean } = {
    page: currentPage.value,
    limit: pageLimit.value
  }

  // Add search if provided
  if (searchEmail.value && searchEmail.value.trim()) {
    params.search = searchEmail.value.trim()
  }

  // Add isActive filter if only one checkbox is selected
  if (filterActive.value && !filterInactive.value) {
    params.isActive = true
  } else if (!filterActive.value && filterInactive.value) {
    params.isActive = false
  }
  // If both are selected or both are unselected, don't filter by isActive

  return params
})

// Composables
const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useUsersList(() => queryParams.value)
const toggleStatusMutation = useToggleUserStatus()
const resetPasswordMutation = useAdminResetPassword()
const { showSuccess, showError } = useSnackbar()

// Computed - Map users and pagination from API response
const users = computed<User[]>(() => {
  if (!usersData.value?.data) return []
  return usersData.value.data
})

const pagination = computed(() => {
  if (!usersData.value?.pagination) return null
  return usersData.value.pagination
})

// State
const actionDialog = ref<boolean>(false)
const actionConfirmText = ref<string>('')
const pendingUserId = ref<string>('')
const actionType = ref<'disable' | 'reactivate' | 'resetPassword'>('disable')
const isActionLoading = computed(() => {
  return toggleStatusMutation.isPending.value || resetPasswordMutation.isPending.value
})

const isShowModalCreateUser = ref<boolean>(false)

// Watch for filter changes to reset page
watch([filterActive, filterInactive], () => {
  currentPage.value = 1
})

// Methods
const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Scroll to top when changing page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Methods
const handleDisableUser = (userId: string) => {
  actionConfirmText.value = 'Bạn có muốn disable user này không?'
  pendingUserId.value = userId
  actionType.value = 'disable'
  actionDialog.value = true
}

const handleReactivateUser = (userId: string) => {
  actionConfirmText.value = 'Bạn có muốn reactivate user này không?'
  pendingUserId.value = userId
  actionType.value = 'reactivate'
  actionDialog.value = true
}

const handleResetPassword = (userId: string) => {
  actionConfirmText.value = `Bạn có muốn reset password cho user này không?`
  pendingUserId.value = userId
  actionType.value = 'resetPassword'
  actionDialog.value = true
}

const confirmAction = async () => {
  try {
    if (actionType.value === 'disable') {
      await toggleStatusMutation.mutateAsync({
        userId: pendingUserId.value,
        statusData: { isActive: false }
      })
      showSuccess('Disable user thành công!')
    } else if (actionType.value === 'reactivate') {
      await toggleStatusMutation.mutateAsync({
        userId: pendingUserId.value,
        statusData: { isActive: true }
      })
      showSuccess('Reactivate user thành công!')
    } else if (actionType.value === 'resetPassword') {
      await resetPasswordMutation.mutateAsync({
        userId: pendingUserId.value,
        resetData: {newPassword: process.env.VUE_APP_DEFAULT_PASSWORD}
      })
      showSuccess(`Reset password thành công! Password mới là "${process.env.VUE_APP_DEFAULT_PASSWORD}"`)
    }

    actionDialog.value = false
    pendingUserId.value = ''
  } catch (e) {
    console.error('Failed to perform action:', e)
    const errorMessage = e instanceof Error ? e.message : 'Thao tác không thành công!'
    showError(errorMessage)
    actionDialog.value = false
  }
}
</script>

<style lang="scss" scoped>
#admin-table {
  tr > th,
  td {
    padding: 0 8px;
  }
}
</style>

