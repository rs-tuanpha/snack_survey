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
      <h2 class="text-center mb-4">Hồ sơ của tôi</h2>

      <!-- Avatar Section -->
      <div class="d-flex flex-column align-center mb-6">
        <v-avatar size="120" color="primary" class="mb-4">
          <v-img v-if="userProfile?.avatar" :src="userProfile.avatar" :alt="userProfile.username" />
          <span v-else class="text-h3">{{ avatarInitial }}</span>
        </v-avatar>
        
        <v-file-input
          v-model="avatarFile"
          label="Chọn hình đại diện"
          accept="image/*"
          prepend-icon="mdi-camera"
          :disabled="uploadingAvatar"
          :error-messages="avatarUploadError"
          clearable
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
          style="max-width: 300px"
        ></v-file-input>

        <v-btn
          color="primary"
          :loading="uploadingAvatar"
          :disabled="!avatarFile || uploadingAvatar"
          @click="handleUpdateAvatar"
          class="mb-4"
        >
          Cập nhật avatar
        </v-btn>
      </div>

      <!-- User Info -->
      <div class="mb-4">
        <v-text-field
          label="Tên đăng nhập"
          :model-value="userProfile?.username || ''"
          disabled
          variant="outlined"
          density="compact"
        ></v-text-field>
        <v-text-field
          label="Email"
          :model-value="userProfile?.email || ''"
          disabled
          variant="outlined"
          density="compact"
        ></v-text-field>
      </div>

      <!-- Change Password Section (Expansion Panel) -->
      <v-expansion-panels v-model="passwordPanel" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <span class="text-body-2">Đổi mật khẩu</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-form @submit.prevent>
              <v-text-field
                label="Mật khẩu cũ"
                v-model="oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                :error="!!oldPasswordError"
                :error-messages="oldPasswordError"
                :rules="validateRules.oldPassword"
                :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showOldPassword = !showOldPassword"
                variant="outlined"
                density="compact"
                class="mb-2"
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
                variant="outlined"
                density="compact"
                class="mb-2"
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
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>

              <v-btn
                color="primary"
                block
                :loading="changingPassword"
                :disabled="!isPasswordFormValid"
                @click="handleChangePassword"
              >
                Đổi mật khẩu
              </v-btn>
            </v-form>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
        {{ snackbarMessage }}
      </v-snackbar>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile, updateCurrentUserProfile } from '@/services/user.service'
import authService from '@/services/auth.service'
import { uploadImageToFirebase } from '@/services/upload.service'
import { useSnackbar } from '@/core/hooks/useSnackbar'
import { THUMBNAIL_MAX_SIZE } from '@/core/constants/app'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()
const queryClient = useQueryClient()

// Get user profile
const { data: userProfile, refetch: refetchProfile } = useUserProfile()

// Avatar initial
const avatarInitial = computed(() => {
  if (!userProfile.value?.username) return 'U'
  return userProfile.value.username.charAt(0).toUpperCase()
})

// Avatar upload
const avatarFile = ref<File[] | File | undefined>(undefined)
const uploadingAvatar = ref(false)
const avatarUploadError = ref('')

// Password change
const passwordPanel = ref<number[]>([])
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const changingPassword = ref(false)
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

const isPasswordFormValid = computed(() => {
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


// Watch oldPassword changes to clear error
watch(oldPassword, () => {
  oldPasswordError.value = ''
})

// Handle avatar upload
const handleUpdateAvatar = async () => {
  if (!avatarFile.value || avatarFile.value.length === 0) {
    showError('Vui lòng chọn hình ảnh')
    return
  }

  let file: File | undefined;

  if (avatarFile.value instanceof File) {
    file = avatarFile.value;
  } else if (Array.isArray(avatarFile.value) && avatarFile.value.length > 0) {
    file = avatarFile.value[0];
  }

  if (!file) {
    showError('Vui lòng chọn hình ảnh hợp lệ');
    return;
  }

  // Check file size
  if (file.size > THUMBNAIL_MAX_SIZE) {
    avatarUploadError.value = 'File vượt quá 5MB'
    showError('File vượt quá 5MB')
    return
  }

  uploadingAvatar.value = true
  avatarUploadError.value = ''

  try {
    // Upload to Firebase
    const imageUrl = await uploadImageToFirebase(file)
    if (!imageUrl) {
      throw new Error('Upload ảnh thất bại')
    }

    // Update profile
    const updatedUser = await updateCurrentUserProfile({ avatar: imageUrl })
    
    // Convert User to IUser format
    const iUser = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isActive: updatedUser.isActive
    }
    
    // Update stores
    userStore.updateUser(iUser)
    authStore.setUser(iUser)
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() })
    
    // Refetch profile
    await refetchProfile()
    
    showSuccess('Cập nhật avatar thành công!')
    avatarFile.value = undefined
  } catch (error: any) {
    console.error('Failed to update avatar:', error)
    const errorMessage = error instanceof Error ? error.message : 'Cập nhật avatar thất bại!'
    avatarUploadError.value = errorMessage
    showError(errorMessage)
  } finally {
    uploadingAvatar.value = false
  }
}

// Handle password change
const handleChangePassword = async () => {
  if (!isPasswordFormValid.value) return

  changingPassword.value = true
  try {
    await authService.changePassword(oldPassword.value, newPassword.value)
    
    showSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
    
    // Clear form
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordPanel.value = []
    
    // Logout after 2 seconds
    setTimeout(() => {
      // Clear stores
      authStore.clearToken()
      userStore.setUser(null)
      
      // Redirect to login
      router.push({ path: '/login' })
    }, 2000)
  } catch (error: any) {
    // Show generic error in snackbar
    showError('Có lỗi xảy ra')
    
    // Show specific error in oldPassword field
    oldPasswordError.value = error.response?.data?.message || error.response?.data?.error || 'Mật khẩu không đúng'
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.v-sheet {
  background-color: white;
}
</style>
