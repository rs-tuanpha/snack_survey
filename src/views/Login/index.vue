<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="ma-0">
      <v-col cols="auto" class="pa-0">
        <v-card class="elevation-12" style="width: 375px;">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Đăng nhập</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleFormSubmit">
              <v-autocomplete
                v-model="selectedUser"
                :items="userOptions"
                label="Chọn tài khoản"
                prepend-icon="mdi-account"
                item-title="displayName"
                item-value="email"
                return-object
                :loading="loadingUsers"
                :rules="[rules.required]"
                @update:model-value="onUserSelect"
                clearable
                hide-selected
                variant="outlined"
                :filter="customFilter"
                :disabled="loadingUsers"
                :no-data-text="loadingUsers ? 'Đang tải danh sách...' : 'Không có tài khoản nào'"
                @keydown.enter.prevent="handleFormSubmit"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      <div class="d-flex flex-column">
                        <span class="text-primary font-weight-medium">{{ item.raw.email }}</span>
                        <span class="text-caption text-medium-emphasis">{{ item.raw.username }}</span>
                      </div>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex flex-column">
                    <span class="text-primary font-weight-medium">{{ item.raw.email }}</span>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.username }}</span>
                  </div>
                </template>
              </v-autocomplete>

              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                variant="outlined"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required]"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                @keydown.enter.prevent="handleFormSubmit"
              ></v-text-field>
              <v-alert v-if="error" type="error" dense>
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="handleFormSubmit" :loading="loading">Đăng nhập</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/auth.service'
import { getUsersList } from '@/services/user.service'
import { useUserStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useCookie } from '@/core/hooks/useCookie'
import { CookieKeys } from '@/core/utils/cookieUtils'

const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const selectedUser = ref<any>(null)
const users = ref<any[]>([])
const loadingUsers = ref(false)
const showPassword = ref(false)

const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

// Use cookie hooks for token management
const accessTokenCookie = useCookie(CookieKeys.ACCESS_TOKEN, '')
const refreshTokenCookie = useCookie(CookieKeys.REFRESH_TOKEN, '')
const userDataCookie = useCookie(CookieKeys.USER_DATA, '')

const rules = {
  required: (value: any) => !!value || 'Vui lòng chọn tài khoản.'
}

// Computed property để tạo options cho dropdown
const userOptions = computed(() => {
  return users.value.map((user) => ({
    ...user,
    displayName: user.username
  }))
})

// Custom filter function để search theo username và email
const customFilter = (value: any, query: string) => {
  if (!query) return true

  const searchTerm = query.toLowerCase()
  const username = value.username?.toLowerCase() || ''
  const email = value.email?.toLowerCase() || ''

  return username.includes(searchTerm) || email.includes(searchTerm)
}

// Method to handle user selection from dropdown
const onUserSelect = (user: any) => {
  if (user) {
    selectedUser.value = user
  } else {
    // Clear selection
    clearUserSelection()
  }
}

// Hàm khởi tạo - gọi API lấy danh sách users
const initializeUsers = async () => {
  try {
    loadingUsers.value = true

    const usersList = await getUsersList({ page: 1, limit: 100 })

    // Map users to match expected format
    users.value = usersList.map((user) => ({
      id: user._id,
      _id: user._id, // Keep original _id as well
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      team: user.team,
      role: user.role
    }))

    // Also update user store for consistency
    userStore.setUserList(users.value)
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = 'Không thể tải danh sách tài khoản. Vui lòng thử lại.'
  } finally {
    loadingUsers.value = false
  }
}

const handleLogin = async () => {
  // Get email from selected user
  const loginEmail = selectedUser.value?.email

  // Double-check validation (should already be validated by handleFormSubmit)
  if (!loginEmail || !password.value) {
    error.value = 'Vui lòng chọn tài khoản và nhập mật khẩu.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await authService.login({ email: loginEmail, password: password.value })

    // Validate response structure
    if (!response || !response.success || !response.data) {
      throw new Error('Invalid response from server')
    }

    if (!response.data.tokens || !response.data.user) {
      throw new Error('Missing authentication data in response')
    }

    // Prepare user data
    const userData = {
      id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.username,
      avatar: response.data.user.avatar,
      role: response.data.user.role,
      team: response.data.user.team
    }

    // Set tokens and user data using useCookie hooks
    accessTokenCookie.set(response.data.tokens.accessToken)
    if (response.data.tokens.refreshToken) {
      refreshTokenCookie.set(response.data.tokens.refreshToken)
    }
    userDataCookie.set(JSON.stringify(userData)) // Stringify the object

    // Update auth store state
    authStore.setAuthData({
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      user: userData
    })

    // Also set user in user store
    userStore.setUser(userData)

    router.push('/') // Redirecting to home page as /topics does not exist
  } catch (err: any) {
    console.error('Login error:', err)

    // Handle different types of errors
    if (err.message && err.message.includes('Invalid email or password')) {
      error.value = 'Invalid email or password. Please check your credentials.'
    } else if (err.message && err.message.includes('Invalid response')) {
      error.value = 'Server error. Please try again later.'
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Login failed. Please check your credentials and try again.'
    }
  } finally {
    loading.value = false
  }
}

// Method to clear user selection
const clearUserSelection = () => {
  selectedUser.value = null
}

// Method to handle form submission
const handleFormSubmit = () => {
  if (!validateForm()) {
    return
  }
  handleLogin()
}

// Method to validate form before submission
const validateForm = () => {
  if (!selectedUser.value) {
    error.value = 'Vui lòng chọn tài khoản.'
    return false
  }

  if (!password.value) {
    error.value = 'Vui lòng nhập mật khẩu.'
    return false
  }

  return true
}

// Gọi API khi component được mount
onMounted(() => {
  initializeUsers()
})
</script>
