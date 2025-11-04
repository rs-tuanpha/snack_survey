<template>
  <v-dialog
    :model-value="dialogValue"
    @update:model-value="handleDialogUpdate"
    width="auto"
    min-width="600"
    max-width="900"
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Danh sách option</span>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="startAdd"
          :disabled="isEditing || isAdding"
          variant="flat"
        >
          Thêm Option
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :items="displayOptions"
          :headers="headers"
          :items-per-page="-1"
          hide-default-footer
          class="options-table"
          :loading="isLoadingOptions"
        >
          <!-- Title Column -->
          <template v-slot:[`item.title`]="{ item }">
            <v-text-field
              v-if="isItemEditing(item as unknown as IOption)"
              v-model="editingData.title"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="editingErrors.title"
            ></v-text-field>
            <span v-else>{{ (item as unknown as IOption).title || '-' }}</span>
          </template>

          <!-- Link Column -->
          <template v-slot:[`item.link`]="{ item }">
            <v-text-field
              v-if="isItemEditing(item as unknown as IOption)"
              v-model="editingData.link"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="editingErrors.link"
            ></v-text-field>
            <a
              v-else-if="(item as unknown as IOption).link"
              :href="(item as unknown as IOption).link"
              target="_blank"
              class="text-decoration-none"
            >
              {{ (item as unknown as IOption).link }}
            </a>
            <span v-else>-</span>
          </template>

          <!-- Image Column -->
          <template v-slot:[`item.image`]="{ item }">
            <div
              v-if="isItemEditing(item as unknown as IOption)"
              class="d-flex flex-column"
              style="width: 150px"
            >
              <div class="d-flex justify-space-between align-center">
                <v-file-input
                  :model-value="imageFile"
                  @update:model-value="handleFileChange"
                  label="Max 5MB"
                  accept="image/*"
                  density="compact"
                  hide-details
                  variant="plain"
                  prepend-icon="mdi-image"
                  overflow="hidden"
                  :error-messages="uploadMessage"
                  clearable
                >
                  <template #selection="{ totalBytes }">
                    <!-- Only show size -->
                    <span class="text-caption text-grey">
                      {{ Math.round((totalBytes / 1024 / 1024) * 100) / 100 }} MB
                    </span>
                  </template>
                </v-file-input>
              </div>
              <v-img
                v-if="editingData.image || (imageFile && imageFile.length > 0)"
                :src="previewImageUrl"
                height="80"
                width="80"
                cover
                class="mt-2 mx-auto"
              ></v-img>
            </div>
            <v-img
              v-else
              :src="(item as unknown as IOption).image || DEFAULT_CARD_IMG"
              height="80"
              width="80"
              cover
              class="mx-auto"
            ></v-img>
          </template>

          <!-- Actions Column -->
          <template v-slot:[`item.actions`]="{ item }">
            <div class="d-flex gap-2">
              <!-- Edit/Save/Cancel Buttons -->
              <template v-if="isItemEditing(item as unknown as IOption)">
                <v-btn
                  icon="mdi-check"
                  color="success"
                  size="small"
                  variant="text"
                  @click="
                    saveItem(
                      (item as unknown as IOption)._id === 'new'
                        ? 'new'
                        : (item as unknown as IOption)._id
                    )
                  "
                  :loading="loadingStates[(item as unknown as IOption)._id]"
                  :disabled="loadingStates[(item as unknown as IOption)._id]"
                ></v-btn>
                <v-btn
                  icon="mdi-close"
                  color="error"
                  size="small"
                  variant="text"
                  @click="cancelEdit()"
                  :disabled="loadingStates[(item as unknown as IOption)._id]"
                ></v-btn>
              </template>
              <template v-else>
                <v-btn
                  icon="mdi-pencil"
                  color="primary"
                  size="small"
                  variant="text"
                  @click="startEdit(item as unknown as IOption)"
                  :disabled="isEditing || isAdding"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="small"
                  variant="text"
                  @click="removeItem((item as unknown as IOption)._id)"
                  :disabled="isEditing || isAdding || loadingStates[(item as unknown as IOption)._id]"
                  :loading="loadingStates[(item as unknown as IOption)._id]"
                ></v-btn>
              </template>
            </div>
          </template>

          <!-- Empty State -->
          <template v-slot:no-data>
            <v-alert type="warning" variant="tonal" class="ma-4">
              Không có option nào được thêm!
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogValue = false">Đóng</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import {
  useCreateOption,
  useUpdateOption,
  useOptionsByTopic,
  useDeleteOption
} from '@/services/option.service'
import { handleValidateAddOption } from '@/views/Admin/Admin.validate'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IState } from '@/core/interfaces/model/state'
import { useSnackbar } from '@/core/hooks/useSnackbar'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '@/types/api'
import type { CreateOptionRequest, UpdateOptionRequest } from '@/types/api'
import { uploadImageToFirebase } from '@/services/upload.service'
import { THUMBNAIL_MAX_SIZE, DEFAULT_CARD_IMG } from '@/core/constants/app'
// Removed import of 'formatSize' as it does not exist

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    topicId: string
    topic?: ITopic | IState<ITopic>
  }>(),
  {
    modelValue: false,
    topicId: '',
    topic: undefined
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// Services and hooks
const { showSuccess, showError } = useSnackbar()
const queryClient = useQueryClient()
const createOptionMutation = useCreateOption()
const updateOptionMutation = useUpdateOption()
const deleteOptionMutation = useDeleteOption()

// Internal state for uncontrolled mode
const internalIsOpen = ref(false)

// Computed to determine if we're in controlled mode
const isControlled = computed(() => props.modelValue !== undefined)

// Dialog value: use modelValue if controlled, otherwise use internal state
const dialogValue = computed({
  get: () => (isControlled.value ? props.modelValue! : internalIsOpen.value),
  set: (value: boolean) => {
    if (isControlled.value) {
      emit('update:modelValue', value)
    } else {
      internalIsOpen.value = value
    }
  }
})

// Normalize topic: handle both ITopic and IState<ITopic>
const normalizedTopic = computed<ITopic | undefined>(() => {
  if (!props.topic) return undefined
  if ('data' in props.topic && props.topic.data) {
    return props.topic.data
  }
  return props.topic as ITopic
})

// Options query - load options when topicId is available
const {
  data: optionsData,
  isLoading: isLoadingOptions,
  refetch: refetchOptions
} = useOptionsByTopic(props.topicId || '', {})

// State Management
const localOptions = ref<IOption[]>([])
const editingId = ref<string | null>(null)
const addingNew = ref(false)
const editingData = reactive<Partial<IOption>>({
  title: '',
  link: '',
  image: ''
})
const originalData = ref<Partial<IOption>>({})
const loadingStates = reactive<Record<string, boolean>>({})
const editingErrors = reactive<{
  title?: string
  link?: string
}>({})
const imageFile = ref<File[] | undefined>(undefined)
const uploadMessage = ref('')

// Computed
const isEditing = computed(() => editingId.value !== null)
const isAdding = computed(() => addingNew.value)

// Extract options array from response (handle both OptionListResponse and direct array)
const optionsArray = computed<IOption[]>(() => {
  if (!optionsData.value?.data) return []

  // Check if data is already an array
  if (Array.isArray(optionsData.value.data)) {
    return optionsData.value.data as IOption[]
  }

  // Otherwise, it's OptionListResponse with nested data property
  if (typeof optionsData.value.data === 'object' && 'data' in optionsData.value.data) {
    const responseData = optionsData.value.data as any
    return Array.isArray(responseData.data) ? responseData.data : []
  }

  return []
})

// Sync localOptions with optionsArray
watch(
  optionsArray,
  (newOptions) => {
    if (newOptions && Array.isArray(newOptions)) {
      localOptions.value = [...newOptions]
    } else {
      localOptions.value = []
    }
  },
  { immediate: true, deep: true }
)

// Load options when dialog opens or topicId changes
watch(
  [() => dialogValue.value, () => props.topicId],
  async ([isOpen, topicId], [prevIsOpen, prevTopicId]) => {
    if (isOpen && topicId) {
      // Reload options when dialog opens or topicId changes
      if (isOpen !== prevIsOpen || topicId !== prevTopicId) {
        await refetchOptions()
      }
      resetEditingState()
    } else if (!isOpen) {
      resetEditingState()
    }
  }
)

// Table headers
const headers = [
  { title: 'Tiêu đề', key: 'title', sortable: false, value: 'title' },
  { title: 'Link', key: 'link', sortable: false, value: 'link' },
  {
    title: 'Hình ảnh',
    key: 'image',
    sortable: false,
    width: '150px',
    align: 'center',
    value: 'image'
  },
  {
    title: 'Tác vụ',
    key: 'actions',
    sortable: false,
    width: '120px',
    align: 'center',
    value: 'actions'
  }
] as const

// Display options with new item if adding
const displayOptions = computed(() => {
  if (addingNew.value) {
    const newItem: IOption = {
      _id: 'new',
      title: '',
      link: '',
      image: '',
      topicId: props.topicId,
      voteCount: 0,
      createdBy: '',
      createdAt: '',
      updatedAt: ''
    }
    return [newItem, ...localOptions.value]
  }
  return localOptions.value
})

// Helper: Check if item is in edit mode
const isItemEditing = (item: IOption): boolean => {
  return editingId.value === item._id || (addingNew.value && item._id === 'new')
}

// Helper: Create object URL for file preview
const createObjectURL = (file: File): string => {
  if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
    return window.URL.createObjectURL(file)
  }
  // Fallback for older browsers
  if (typeof window !== 'undefined' && (window as any).webkitURL) {
    return (window as any).webkitURL.createObjectURL(file)
  }
  return ''
}

// Computed: Get preview image URL
const previewImageUrl = computed(() => {
  if (imageFile.value && imageFile.value.length > 0) {
    return createObjectURL(imageFile.value[0])
  }
  return editingData.image || DEFAULT_CARD_IMG
})

// Handler Functions

/**
 * Handle file change for image upload
 */
const handleFileChange = (files: File | File[] | null | undefined) => {
  if (!files) {
    imageFile.value = undefined
    uploadMessage.value = ''
    return
  }

  // Handle both single File and File[] cases
  const fileArray = Array.isArray(files) ? files : [files]

  if (fileArray.length > 0) {
    const file = fileArray[0]

    // Check file size limit (5MB)
    if (file.size > THUMBNAIL_MAX_SIZE) {
      uploadMessage.value = 'File size exceeds 5MB limit!'
      imageFile.value = undefined
    } else {
      imageFile.value = fileArray
      uploadMessage.value = ''
    }
  } else {
    imageFile.value = undefined
    uploadMessage.value = ''
  }
}

/**
 * Start editing an item
 */
const startEdit = (item: IOption) => {
  if (isEditing.value || isAdding.value) return

  editingId.value = item._id
  editingData.title = item.title || ''
  editingData.link = item.link || ''
  editingData.image = item.image || ''
  imageFile.value = undefined
  originalData.value = { title: item.title, link: item.link, image: item.image }
  editingErrors.title = undefined
  editingErrors.link = undefined
  uploadMessage.value = ''
}

/**
 * Start adding a new item
 */
const startAdd = () => {
  if (isEditing.value || isAdding.value) return

  addingNew.value = true
  editingData.title = ''
  editingData.link = ''
  editingData.image = ''
  imageFile.value = undefined
  originalData.value = {}
  editingErrors.title = undefined
  editingErrors.link = undefined
  uploadMessage.value = ''
}

/**
 * Save item (create or update)
 */
const saveItem = async (itemId: string | 'new') => {
  // Clear previous errors
  editingErrors.title = undefined
  editingErrors.link = undefined

  // Validate
  if (!normalizedTopic.value) {
    showError('Topic không hợp lệ!')
    return
  }

  const validationResult = handleValidateAddOption(
    {
      title: editingData.title || '',
      link: editingData.link || ''
    },
    normalizedTopic.value
  )

  if (validationResult !== true) {
    showError(validationResult)
    return
  }

  // Check for duplicates (excluding current item)
  const duplicate = localOptions.value.find((opt) => {
    if (itemId !== 'new' && opt._id === itemId) return false
    return (
      (opt.title && opt.title === editingData.title) || (opt.link && opt.link === editingData.link)
    )
  })

  if (duplicate) {
    showError('Option này đã tồn tại, vui lòng nhập lại!')
    return
  }

  // Set loading state
  loadingStates[itemId] = true

  try {
    // Handle image upload
    let imageUrl: string | undefined = editingData.image

    if (imageFile.value && imageFile.value.length > 0) {
      const file = imageFile.value[0]
      const uploadedUrl = await uploadImageToFirebase(file)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      } else {
        showError('Upload ảnh thất bại!')
        loadingStates[itemId] = false
        return
      }
    }

    if (itemId === 'new') {
      // Create new option
      const createData: CreateOptionRequest = {
        title: editingData.title || '',
        topicId: props.topicId,
        ...(editingData.link && { link: editingData.link }),
        ...(imageUrl && { image: imageUrl })
      }

      await createOptionMutation.mutateAsync(createData)
      showSuccess('Tạo mới option thành công!')

      // Invalidate cache and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(props.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(props.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(props.topicId) })

      await refetchOptions()
    } else {
      // Update existing option
      const updateData: UpdateOptionRequest = {
        ...(editingData.title && { title: editingData.title }),
        ...(editingData.link !== undefined && { link: editingData.link || undefined }),
        ...(imageUrl !== undefined && { image: imageUrl })
      }

      await updateOptionMutation.mutateAsync({
        optionId: itemId,
        optionData: updateData
      })
      showSuccess('Cập nhật option thành công!')

      // Invalidate cache and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(props.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(props.topicId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options.detail(itemId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(props.topicId) })

      await refetchOptions()
    }

    // Clear imageFile after successful save
    imageFile.value = undefined

    // Reset editing state
    resetEditingState()
  } catch (error) {
    console.error('Failed to save option:', error)
    const errorMessage = error instanceof Error ? error.message : 'Thao tác không thành công!'
    showError(errorMessage)
  } finally {
    loadingStates[itemId] = false
  }
}

/**
 * Cancel editing/adding
 */
const cancelEdit = () => {
  resetEditingState()
}

/**
 * Remove item
 */
const removeItem = async (itemId: string) => {
  loadingStates[itemId] = true
  try {
    await deleteOptionMutation.mutateAsync(itemId)
    showSuccess('Xóa option thành công!')

    // Invalidate cache and refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.options.byTopic(props.topicId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.options.rank(props.topicId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.votes.status(props.topicId) })

    await refetchOptions()
  } catch (error) {
    console.error('Failed to delete option:', error)
    const errorMessage = error instanceof Error ? error.message : 'Xóa không thành công!'
    showError(errorMessage)
  } finally {
    loadingStates[itemId] = false
  }
}

/**
 * Reset editing state
 */
const resetEditingState = () => {
  editingId.value = null
  addingNew.value = false
  editingData.title = ''
  editingData.link = ''
  editingData.image = ''
  imageFile.value = undefined
  originalData.value = {}
  editingErrors.title = undefined
  editingErrors.link = undefined
  uploadMessage.value = ''
}

/**
 * Handle dialog update
 */
const handleDialogUpdate = (value: boolean) => {
  dialogValue.value = value
  if (!value) {
    resetEditingState()
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.options-table {
  :deep(.v-data-table__td) {
    padding: 8px 16px;
  }
}

.gap-2 {
  gap: 8px;
}
</style>
