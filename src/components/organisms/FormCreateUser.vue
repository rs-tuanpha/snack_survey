<template>
  <v-dialog :model-value="dialogValue" @update:model-value="handleDialogUpdate" max-width="500" min-width="400">
    <template v-if="!hideActivator" v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        prepend-icon="mdi-plus"
        width="fit-content"
        color="primary"
        height="46"
        @click="handleResetForm"
      >
        Tạo mới user
      </v-btn>
    </template>
    <template v-slot:default>
      <v-card style="background-color: white; padding: 16px">
        <template v-slot:title>
          <p class="font-weight-black text-center">Thêm User</p>
        </template>
        <v-form @submit.prevent :fast-fail="false">
          <v-text-field
            v-model="form.username"
            label="Username"
            :rules="usernameRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            :rules="emailRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            :rules="passwordRules"
            :disabled="isLoading"
            single-line
            variant="outlined"
          ></v-text-field>

          <v-text-field
            v-model="form.avatar"
            label="Avatar URL (Tùy chọn)"
            :disabled="isLoading"
            single-line
            variant="outlined"
            class="mb-2"
          ></v-text-field>

          <v-select
            v-model="form.role"
            :items="roleOptions"
            label="Role"
            :disabled="isLoading"
            variant="outlined"
            class="mb-2"
          ></v-select>

          <v-switch
            v-model="form.isActive"
            hide-details
            color="green-darken-1"
            inset
            :label="`Trạng thái: ${form.isActive ? 'Active' : 'Inactive'}`"
            :disabled="isLoading"
            class="mb-2"
          ></v-switch>

          <v-btn
            text="Huỷ"
            color="red-darken-2"
            @click="handleCancel"
            variant="flat"
            :disabled="isLoading"
            class="mt-4"
          ></v-btn>
          <v-btn
            type="submit"
            @click="handleCreateUser"
            class="mb-2 float-right mt-4"
            color="blue-darken-2"
            variant="flat"
            min-width="100"
            :loading="isLoading"
            :disabled="isLoading"
            >Tạo mới user</v-btn
          >
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useCreateUser } from '@/services/user.service'
import type { CreateUserRequest } from '@/types/api'
import { useSnackbar } from '@/core/hooks/useSnackbar'
import { EUserRole } from '@/core/constants/enum'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  hideActivator?: boolean
}>(), {
  modelValue: undefined,
  hideActivator: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const isLoading = ref(false)
const createUserMutation = useCreateUser()
const { showSuccess, showError } = useSnackbar()

const form = reactive({
  username: '',
  email: '',
  password: '',
  avatar: '',
  role: EUserRole.USER,
  isActive: true
})

const roleOptions = [
  { title: 'User', value: EUserRole.USER },
  { title: 'Admin', value: EUserRole.ADMIN }
]

// Internal state for uncontrolled mode (when modelValue is not provided)
const internalIsOpen = ref(false)

// Computed to determine if we're in controlled mode
const isControlled = computed(() => props.modelValue !== undefined)

// Dialog value: use modelValue if controlled, otherwise use internal state
const dialogValue = computed({
  get: () => isControlled.value ? props.modelValue! : internalIsOpen.value,
  set: (value: boolean) => {
    if (isControlled.value) {
      emit('update:modelValue', value)
    } else {
      internalIsOpen.value = value
    }
  }
})

// Watch modelValue to sync internal state when controlled
watch(() => props.modelValue, (newValue) => {
  if (isControlled.value && newValue === false) {
    handleResetForm()
  }
})

// Validation rules
const usernameRules = [
  (value: string) => {
    if (!value) return 'Vui lòng nhập username'
    if (value.length < 3) return 'Username phải có ít nhất 3 ký tự'
    if (value.length > 30) return 'Username không được vượt quá 30 ký tự'
    return true
  }
]

const emailRules = [
  (value: string) => {
    if (!value) return 'Vui lòng nhập email'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Email không hợp lệ'
    return true
  }
]

const passwordRules = [
  (value: string) => {
    if (!value) return 'Vui lòng nhập password'
    if (value.length < 6) return 'Password phải có ít nhất 6 ký tự'
    return true
  }
]

const validateForm = (): string | true => {
  if (!form.username) {
    return 'Vui lòng nhập username'
  }
  if (form.username.length < 3 || form.username.length > 30) {
    return 'Username phải có từ 3 đến 30 ký tự'
  }
  if (!form.email) {
    return 'Vui lòng nhập email'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    return 'Email không hợp lệ'
  }
  if (!form.password) {
    return 'Vui lòng nhập password'
  }
  if (form.password.length < 6) {
    return 'Password phải có ít nhất 6 ký tự'
  }

  return true
}

const handleCreateUser = async () => {
  // Prevent spam clicking
  if (isLoading.value) {
    return
  }

  const validation = validateForm()
  if (validation !== true) {
    showError(validation)
    return
  }

  try {
    isLoading.value = true

    const createData: CreateUserRequest = {
      username: form.username,
      email: form.email,
      password: form.password,
      avatar: form.avatar || undefined,
      role: form.role,
      isActive: form.isActive
    }

    await createUserMutation.mutateAsync(createData)

    showSuccess('Tạo mới user thành công!')

    handleResetForm()
    dialogValue.value = false
    emit('close')
  } catch (error) {
    console.error('Failed to create user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Tạo mới không thành công!'
    showError(errorMessage)
  } finally {
    isLoading.value = false
  }
}

// Handle dialog update
const handleDialogUpdate = (value: boolean) => {
  dialogValue.value = value
  if (!value) {
    emit('close')
  }
}

// Handle cancel button
const handleCancel = () => {
  handleResetForm()
  dialogValue.value = false
  emit('close')
}

// reset form on open form
const handleResetForm = () => {
  form.username = ''
  form.email = ''
  form.password = ''
  form.avatar = ''
  form.role = EUserRole.USER
  form.isActive = true
  isLoading.value = false
}
</script>

