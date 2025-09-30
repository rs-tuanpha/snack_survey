<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Đăng nhập</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
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
                :filter="customFilter"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      <div class="d-flex flex-column">
                        <span class="text-primary font-weight-medium">{{ item.raw.username }}</span>
                        <span class="text-caption text-medium-emphasis">{{ item.raw.email }}</span>
                      </div>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex flex-column">
                    <span class="text-primary font-weight-medium">{{ item.raw.username }}</span>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.email }}</span>
                  </div>
                </template>
              </v-autocomplete>
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                :rules="[rules.required]"
              ></v-text-field>
              <v-alert v-if="error" type="error" dense>
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="handleLogin" :loading="loading">Đăng nhập</v-btn>
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

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const selectedUser = ref<any>(null)
const users = ref<any[]>([])
const loadingUsers = ref(false)

const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

// Use cookie hooks for token management
const accessTokenCookie = useCookie(CookieKeys.ACCESS_TOKEN, '')
const refreshTokenCookie = useCookie(CookieKeys.REFRESH_TOKEN, '')
const userDataCookie = useCookie(CookieKeys.USER_DATA, '')

const rules = {
  required: (value: string) => !!value || 'Required.',
  email: (value: string) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return pattern.test(value) || 'Invalid e-mail.'
  }
}

// Computed property để tạo options cho dropdown
const userOptions = computed(() => {
  return users.value.map(user => ({
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

// Hàm xử lý khi user chọn từ dropdown
const onUserSelect = (user: any) => {
  if (user) {
    selectedUser.value = user
    email.value = user.email
  }
}

// Hàm khởi tạo - gọi API lấy danh sách users
const initializeUsers = async () => {
  try {
    loadingUsers.value = true
    const usersList = await getUsersList({ page: 1, limit: 100 })

    // Map users to match expected format
    users.value = usersList.map(user => ({
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      team: user.team
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
  if (!email.value || !password.value) {
    error.value = 'Email and password are required.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await authService.login({ email: email.value, password: password.value })
    if (response.success) {
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
      userDataCookie.set(JSON.stringify(userData))

      // Update auth store state
      authStore.setAuthData({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        user: userData
      })

      // Also set user in user store
      userStore.setUser(userData)

      router.push('/') // Redirecting to home page as /topics does not exist
    } else {
      error.value = response.message
    }
  } catch (err) {
    error.value = 'Login failed. Please check your credentials.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Gọi API khi component được mount
onMounted(() => {
  initializeUsers()
})
</script>
