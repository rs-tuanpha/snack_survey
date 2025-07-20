<template>
  <v-container>
    <v-sheet
      max-width="638"
      min-width="350"
      width="100%"
      class="mx-auto pa-4 pb-4 d-flex flex-column"
      elevation="1"
      rounded
    >
      <h2 class="text-center mb-4">Đăng nhập</h2>

      <v-autocomplete
        label="Chọn tài khoản"
        :items="accounts"
        item-title="username"
        item-value="email"
        v-model="email"
        :error="!!accountError"
        :error-messages="accountError"
        :rules="accountRules"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <v-list-item-subtitle>{{ item.raw.email }}</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-autocomplete>

      <v-text-field
        label="Mật khẩu"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        :error="!!passwordError"
        :error-messages="passwordError"
        :rules="passwordRules"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
      ></v-text-field>

      <v-btn
        color="primary"
        block
        class="mt-4"
        :loading="loading"
        :disabled="!isFormValid"
        @click="handleLogin"
      >
        Đăng nhập
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccountList, login } from '@/services/account.service'
import type { IUser } from '@/core/interfaces/model/user'
import Cookies from 'js-cookie'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const accounts = ref<IUser[]>([])
const email = ref<string | null>(null)
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const accountError = ref('')
const passwordError = ref('')

const accountRules = [(v: any) => !!v || 'Vui lòng chọn tài khoản']

const passwordRules = [
  (v: string) => !!v || 'Vui lòng nhập mật khẩu',
  (v: string) => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
  (v: string) => /[a-zA-Z]/.test(v) || 'Mật khẩu phải có ít nhất một chữ cái',
  (v: string) => /[0-9]/.test(v) || 'Mật khẩu phải có ít nhất một số'
]

const isFormValid = computed(() => {
  return (
    email.value &&
    password.value &&
    password.value.length >= 8 &&
    /[a-zA-Z]/.test(password.value) &&
    /[0-9]/.test(password.value)
  )
})

const fetchAccounts = async () => {
  try {
    const data = await getAccountList()
    accounts.value = data
    userStore.setUserList(data)
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }
}

const handleLogin = async () => {
  if (!isFormValid.value || !email.value) return

  loading.value = true
  try {
    const selectedUser = accounts.value.find((acc) => acc.email === email.value)

    if (selectedUser) {
      const response = await login(selectedUser.email, password.value)
      const cookieConfig = {
        expires: 30, // 30 days
        secure: true,
        sameSite: 'strict'
      }
      // Store token in cookie
      Cookies.set('auth_token', response.data.tokens.accessToken, cookieConfig)

      // Store isFirstLogin flag if true
      if (response.data.user.is_first_login) {
        Cookies.set('is_first_login', 'true', cookieConfig)
      }
      // Store user info in cookie
      Cookies.set('account_id', selectedUser.id, cookieConfig)
      Cookies.set('account_email', selectedUser.email, cookieConfig)
      Cookies.set('account_username', selectedUser.username, cookieConfig)
      Cookies.set('account_avatar', selectedUser.avatar || '', cookieConfig)
      Cookies.set('account_team', selectedUser.team || '', cookieConfig)

      // Navigate based on isFirstLogin
      if (response.data.user.is_first_login) {
        router.push('/change_password')
      } else {
        router.push('/')
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    passwordError.value = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAccounts()
})
</script>

<style scoped>
.v-sheet {
  background-color: white;
}
</style>
