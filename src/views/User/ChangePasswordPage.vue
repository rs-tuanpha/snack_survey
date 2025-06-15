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
      <h2 class="text-center mb-4">Đổi mật khẩu</h2>

      <v-text-field
        label="Mật khẩu cũ"
        v-model="oldPassword"
        :type="showOldPassword ? 'text' : 'password'"
        :error="!!oldPasswordError"
        :error-messages="oldPasswordError"
        :rules="validateRules.oldPassword"
        :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showOldPassword = !showOldPassword"
      ></v-text-field>

      <v-text-field
        label="Mật khẩu mới"
        v-model="newPassword"
        :type="showNewPassword ? 'text' : 'password'"
        :error="!!newPasswordError"
        :error-messages="newPasswordError"
        :rules="validateRules.passwordRules"
        :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showNewPassword = !showNewPassword"
      ></v-text-field>

      <v-text-field
        label="Xác nhận mật khẩu mới"
        v-model="confirmPassword"
        :type="showConfirmPassword ? 'text' : 'password'"
        :error="!!confirmPasswordError"
        :error-messages="confirmPasswordError"
        :rules="validateRules.confirmPassword"
        :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showConfirmPassword = !showConfirmPassword"
      ></v-text-field>

      <v-btn
        color="primary"
        block
        class="mt-4"
        :loading="loading"
        :disabled="!isFormValid"
        @click="handleChangePassword"
      >
        Đổi mật khẩu
      </v-btn>

      <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
        {{ snackbarMessage }}
      </v-snackbar>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/axios.service'
import Cookies from 'js-cookie'

const router = useRouter()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const oldPasswordError = ref('')
const newPasswordError = ref('')
const confirmPasswordError = ref('')

const validateRules = {
  oldPassword: [
    (v: string) => !!v || 'Vui lòng nhập mật khẩu cũ',
    (v: string) => v != newPassword.value || 'Mật khẩu mới không được trùng mật khẩu cũ'
  ],
  passwordRules: [
    (v: string) => !!v || 'Vui lòng nhập mật khẩu mới',
    (v: string) => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
    (v: string) => /[a-zA-Z]/.test(v) || 'Mật khẩu phải có ít nhất một chữ cái',
    (v: string) => /[0-9]/.test(v) || 'Mật khẩu phải có ít nhất một số',
    (v: string) => v != oldPassword.value || 'Mật khẩu mới không được trùng mật khẩu cũ'
  ],
  confirmPassword: [
    (v: any) => !!v || 'Vui lòng xác nhận mật khẩu mới',
    (v: string) => v === newPassword.value || 'Mật khẩu xác nhận không khớp'
  ]
}

// Snackbar state
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const isFormValid = computed(() => {
  return (
    oldPassword.value &&
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value.length >= 8 &&
    /[a-zA-Z]/.test(newPassword.value) &&
    /[0-9]/.test(newPassword.value) &&
    newPassword.value === confirmPassword.value
  )
})

const showMessage = (message: string, isError: boolean = false) => {
  snackbarMessage.value = message
  snackbarColor.value = isError ? 'error' : 'success'
  showSnackbar.value = true
}

// Watch oldPassword changes to clear error
watch(oldPassword, () => {
  oldPasswordError.value = ''
})

const handleChangePassword = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const response: any = await api.post('/api/auth/change_password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })

    showMessage(response.message)

    // Clear isFirstLogin cookie if change password successful
    Cookies.remove('is_first_login', { path: '/' })

    // Redirect to home after 3 seconds
    setTimeout(() => {
      router.push({ path: '/' })
    }, 3000)
  } catch (error: any) {
    // Show generic error in snackbar
    showMessage('Có lỗi xảy ra', true)

    // Show specific error in oldPassword field
    oldPasswordError.value = error.response?.data?.error || 'Mật khẩu không đúng'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-sheet {
  background-color: white;
}
</style>
