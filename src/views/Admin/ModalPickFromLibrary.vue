<template>
  <UiDialog v-model="dialogVisible" title="Thêm từ thư viện" max-width="max-w-2xl">
    <ul v-if="items.length" class="divide-y divide-ink/20 max-h-[60vh] overflow-y-auto">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 px-1 py-3 cursor-pointer hover:bg-cream/50"
        @click="toggle(item.id)"
      >
        <input
          type="checkbox"
          class="w-4 h-4 accent-ink shrink-0"
          :checked="isSelected(item.id)"
          @click.stop
          @change="toggle(item.id)"
        />
        <img
          :src="item.thumbnail || DEFAULT_CARD_IMG"
          class="w-12 h-12 object-cover rounded-[10px] shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="font-sans text-sm font-bold text-ink truncate">{{ item.title || '(No title)' }}</p>
          <a
            v-if="item.link"
            :href="item.link"
            target="_blank"
            class="font-sans text-xs text-muted truncate block hover:text-terracotta hover:underline"
            @click.stop
          >{{ item.link }}</a>
        </div>
      </li>
    </ul>
    <UiAlert v-else-if="!loading" type="warning" message="Thư viện trống." />

    <UiAlert v-if="message" class="mt-2" :type="hasError ? 'error' : 'success'" :message="message" />

    <div class="flex flex-wrap justify-between items-center gap-2 mt-4">
      <UiButton v-if="hasMore" size="sm" variant="secondary" :disabled="loading" @click="loadMore">
        {{ loading ? 'Đang tải...' : 'Load more' }}
      </UiButton>
      <span v-else class="font-sans text-[10px] text-muted">{{ items.length ? 'Hết danh sách' : '' }}</span>
      <div class="flex gap-2 ml-auto">
        <UiButton size="sm" variant="secondary" @click="handleClose">Đóng</UiButton>
        <UiButton
          size="sm"
          variant="primary"
          :disabled="!selectedIds.length || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? 'Đang thêm...' : `Thêm (${selectedIds.length})` }}
        </UiButton>
      </div>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiAlert, UiButton, UiDialog } from '@/components/ui'
import { DEFAULT_CARD_IMG } from '@/core/constants/app'
import type { IOption } from '@/core/interfaces/model/option'
import type { IOptionLibrary } from '@/core/interfaces/model/optionLibrary'
import { postOptionsFromLibrary } from '@/services/option.service'
import {
  getOptionLibraryPage,
  OPTION_LIBRARY_PAGE_SIZE
} from '@/services/optionLibrary.service'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

const props = defineProps<{
  topicId: string
  existingOptions: IOption[]
}>()

const emits = defineEmits<{ (e: 'onClose'): void; (e: 'onAdded'): void }>()

const dialogVisible = ref(true)
const items = ref<IOptionLibrary[]>([])
const loading = ref(false)
const submitting = ref(false)
const hasMore = ref(false)
const cursor = ref<QueryDocumentSnapshot<DocumentData> | null>(null)
const selectedIds = ref<string[]>([])
const message = ref('')
const hasError = ref(false)

const isSelected = (id: string) => selectedIds.value.includes(id)

const toggle = (id: string) => {
  if (isSelected(id)) selectedIds.value = selectedIds.value.filter((x) => x !== id)
  else selectedIds.value = [...selectedIds.value, id]
}

const loadPage = async (reset = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const page = await getOptionLibraryPage(OPTION_LIBRARY_PAGE_SIZE, reset ? null : cursor.value)
    items.value = reset ? page.items : [...items.value, ...page.items]
    cursor.value = page.lastDoc
    hasMore.value = page.hasMore
  } finally {
    loading.value = false
  }
}

const loadMore = () => loadPage(false)

const handleSubmit = async () => {
  if (!selectedIds.value.length || submitting.value) return
  submitting.value = true
  message.value = ''
  try {
    const selected = items.value.filter((item) => selectedIds.value.includes(item.id))
    const result = await postOptionsFromLibrary(
      selected,
      props.topicId,
      [...props.existingOptions]
    )
    hasError.value = false
    message.value =
      `Đã thêm ${result.added} option` + (result.skipped ? `, bỏ qua ${result.skipped} trùng` : '')
    emits('onAdded')
    if (result.added > 0) {
      setTimeout(() => handleClose(), 800)
    }
  } catch {
    hasError.value = true
    message.value = 'Thêm từ thư viện thất bại'
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  emits('onClose')
}

onMounted(() => loadPage(true))
</script>
