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
                :loading="authStore.loadingUsers"
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
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const selectedUser = ref<any>(null)

const authStore = useAuthStore()
const router = useRouter()

const rules = {
  required: (value: string) => !!value || 'Required.',
  email: (value: string) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return pattern.test(value) || 'Invalid e-mail.'
  }
}

// Computed property để tạo options cho dropdown
const userOptions = computed(() => {
  return authStore.availableUsers.map(user => ({
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
    await authStore.fetchAvailableUsers()
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = 'Không thể tải danh sách tài khoản. Vui lòng thử lại.'
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
    await authStore.login({ email: email.value, password: password.value })
    router.push('/') // Redirecting to home page as /topics does not exist
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