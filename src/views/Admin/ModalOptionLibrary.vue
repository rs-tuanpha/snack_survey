<template>
  <UiDialog v-model="dialogVisible" title="Thư viện option" max-width="max-w-2xl">
    <ul v-if="items.length" class="divide-y divide-ink/20 max-h-[60vh] overflow-y-auto">
      <li v-for="item in items" :key="item.id" class="flex items-center gap-4 px-1 py-3">
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
          >{{ item.link }}</a>
        </div>
        <UiButton size="xs" variant="danger" title="Xóa khỏi thư viện" @click="handleDelete(item.id)">
          <i class="mdi mdi-delete text-sm"></i>
        </UiButton>
      </li>
    </ul>
    <UiAlert v-else-if="!loading" type="warning" message="Thư viện trống. Options sẽ được lưu khi thêm vào topic." />

    <div class="flex justify-between items-center mt-4">
      <UiButton v-if="hasMore" size="sm" variant="secondary" :disabled="loading" @click="loadMore">
        {{ loading ? 'Đang tải...' : 'Load more' }}
      </UiButton>
      <span v-else class="font-sans text-[10px] text-muted">{{ items.length ? 'Hết danh sách' : '' }}</span>
      <UiButton size="sm" variant="secondary" @click="handleClose">Đóng</UiButton>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiAlert, UiButton, UiDialog } from '@/components/ui'
import { DEFAULT_CARD_IMG } from '@/core/constants/app'
import type { IOptionLibrary } from '@/core/interfaces/model/optionLibrary'
import {
  deleteOptionLibrary,
  getOptionLibraryPage,
  OPTION_LIBRARY_PAGE_SIZE
} from '@/services/optionLibrary.service'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

const emits = defineEmits<{ (e: 'onClose'): void }>()

const dialogVisible = ref(true)
const items = ref<IOptionLibrary[]>([])
const loading = ref(false)
const hasMore = ref(false)
const cursor = ref<QueryDocumentSnapshot<DocumentData> | null>(null)

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

const handleDelete = async (id: string) => {
  await deleteOptionLibrary(id)
  items.value = items.value.filter((item) => item.id !== id)
}

const handleClose = () => {
  dialogVisible.value = false
  emits('onClose')
}

onMounted(() => loadPage(true))
</script>
