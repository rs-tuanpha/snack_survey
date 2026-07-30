<template>
  <!-- Base modals first; nested/confirm last so equal z-50 stacks correctly (later = on top) -->

  <!-- Create/Edit Topic Dialog -->
  <UiDialog v-model="formDialog" max-width="max-w-xl">
    <template #title>
      <div class="flex items-center gap-3">
        <span>{{ type === 'update' ? 'Cập nhật Topic' : 'Tạo Topic' }}</span>
        <span v-if="showAddBtn" class="inline-flex items-center rounded-full font-sans text-[11px] font-bold px-2.5 py-0.5 bg-[var(--color-rank-gold-bg,#FEF3C7)] text-amber-800">Đang sửa</span>
      </div>
    </template>
    <div class="flex flex-col gap-5">
      <div>
        <h3 class="theme-label text-[9px] text-muted mb-3">Thông tin cơ bản</h3>
        <div class="space-y-3">
          <UiInput v-model="topicFormData.name" label="Tên" />
          <UiInput v-model="topicFormData.description" label="Mô tả" />
        </div>
      </div>

      <hr class="border-stone-100" />

      <div>
        <h3 class="theme-label text-[9px] text-muted mb-3">Deadline</h3>
        <div class="flex gap-3">
          <div class="flex-1 relative">
            <i class="mdi mdi-calendar text-muted absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"></i>
            <input type="date" :value="dateStr" @change="onDateChange" class="w-full h-12 font-sans text-sm text-ink theme-control px-9 outline-none focus:border-terracotta/40" />
          </div>
          <div class="flex-1 relative">
            <i class="mdi mdi-clock-outline text-muted absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"></i>
            <input type="time" :value="timeStr" @change="onTimeChange" class="w-full h-12 font-sans text-sm text-ink theme-control px-9 outline-none focus:border-terracotta/40" />
          </div>
        </div>
      </div>

      <hr class="border-stone-100" />

      <div>
        <h3 class="theme-label text-[9px] text-muted mb-3">Cài đặt</h3>
        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <UiToggle :model-value="!!topicFormData.link" @update:model-value="(v: boolean) => topicFormData.link = v" :label="`Link: ${topicFormData.link ? 'Có' : 'Không'}`" />
          <UiToggle :model-value="!!topicFormData.option" @update:model-value="(v: boolean) => topicFormData.option = v" :label="`Vote nhiều: ${topicFormData.option ? 'Có' : 'Không'}`" />
        </div>
      </div>

      <hr class="border-stone-100" />

      <div>
        <h3 class="theme-label text-[9px] text-muted mb-3">Team</h3>
        <div class="flex gap-4">
          <UiRadio :model-value="topicFormData.team ?? ''" @update:model-value="(v: string) => topicFormData.team = v as any" value="All" label="All" />
          <UiRadio :model-value="topicFormData.team ?? ''" @update:model-value="(v: string) => topicFormData.team = v as any" value="PHP" label="PHP" />
          <UiRadio :model-value="topicFormData.team ?? ''" @update:model-value="(v: string) => topicFormData.team = v as any" value="FE" label="FE" />
        </div>
      </div>

      <div v-if="topicFormData.link">
        <hr class="border-stone-100 mb-3" />
        <h3 class="theme-label text-[9px] text-muted mb-3">Require</h3>
        <div class="flex gap-4">
          <UiRadio :model-value="topicFormData.requireField ?? ''" @update:model-value="(v: string) => topicFormData.requireField = v as any" value="title" label="Title" />
          <UiRadio :model-value="topicFormData.requireField ?? ''" @update:model-value="(v: string) => topicFormData.requireField = v as any" value="link" label="Link" />
          <UiRadio :model-value="topicFormData.requireField ?? ''" @update:model-value="(v: string) => topicFormData.requireField = v as any" value="all" label="All" />
        </div>
      </div>

      <div class="flex justify-between items-center gap-2 pt-2">
        <div v-if="type === 'update'" class="flex gap-2">
          <UiButton variant="secondary" size="sm" shape="rounded" @click="openOptionsFromEdit">
            <i class="mdi mdi-format-list-bulleted mr-1"></i> Options
          </UiButton>
          <UiButton variant="danger" size="sm" shape="rounded" @click="handleDeleteFromEdit">
            <i class="mdi mdi-delete mr-1"></i> Xóa
          </UiButton>
        </div>
        <div class="ml-auto">
          <UiButton variant="primary" shape="rounded" @click="confirm(type)">{{ textBtn }}</UiButton>
        </div>
      </div>

      <UiAlert v-if="alert" :type="colorAlert === 'red-lighten-1' ? 'error' : 'success'" :message="alert" />
    </div>
  </UiDialog>

  <!-- Extend Dialog -->
  <UiDialog v-model="extendDlg" title="Gia hạn topic" max-width="max-w-sm">
    <div class="flex flex-col gap-4">
      <p class="font-sans text-sm text-muted">Chọn deadline mới cho topic</p>
      <div class="flex gap-3">
        <div class="flex-1 relative">
          <i class="mdi mdi-calendar text-muted absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"></i>
          <input type="date" :value="extDateStr" @change="onExtDateChange" class="w-full h-12 font-sans text-sm text-ink theme-control px-9 outline-none focus:border-terracotta/40" />
        </div>
        <div class="flex-1 relative">
          <i class="mdi mdi-clock-outline text-muted absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"></i>
          <input type="time" :value="extTimeStr" @change="onExtTimeChange" class="w-full h-12 font-sans text-sm text-ink theme-control px-9 outline-none focus:border-terracotta/40" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UiButton variant="secondary" @click="extendDlg = false">Hủy</UiButton>
        <UiButton variant="primary" @click="confirmExtend">Xác nhận</UiButton>
      </div>
    </div>
  </UiDialog>

  <UiDialog v-model="listOptionDlg" max-width="max-w-2xl">
    <template #title>
      <div class="flex items-center justify-between w-full gap-2">
        <span>Danh sách option</span>
        <div class="flex gap-2">
          <UiButton size="xs" variant="secondary" shape="rounded" @click="isShowModalPickLibrary = true">
            Từ thư viện
          </UiButton>
          <UiButton size="xs" variant="primary" shape="rounded" @click="handleAddOption(topicId)">+ Thêm option</UiButton>
        </div>
      </div>
    </template>
    <ul v-if="options.length" class="divide-y divide-stone-100">
      <li v-for="(item, i) in options" :key="i" class="flex items-center gap-4 px-1 py-4">
        <img :src="item.thumbnail || DEFAULT_CARD_IMG" class="w-14 h-14 object-cover rounded-[10px] shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-sans text-base font-bold text-ink truncate">{{ item.title }}</p>
          <a v-if="item.link" :href="item.link" target="_blank" class="font-sans text-xs text-muted truncate block hover:text-terracotta hover:underline">{{ item.link }}</a>
          <span class="font-sans text-[11px] font-semibold text-muted">{{ item.voteCount }} vote{{ item.voteCount > 1 ? 's' : '' }}</span>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <i class="mdi mdi-circle-edit-outline text-sage cursor-pointer text-xl" @click="handleEditOption({ ...item, id: item.id })" title="Sửa option" />
          <i class="mdi mdi-close text-terracotta cursor-pointer text-xl" @click="deleteOption(item.id)" title="Xóa option" />
        </div>
      </li>
    </ul>
    <UiAlert v-else type="warning" message="Chưa có option nào!" />
  </UiDialog>

  <!-- Nested over option list -->
  <modal-create-option
    v-if="isShowModalCreateOption"
    @on-close="handleCloseCreateOption"
    :topicState="topicState"
  />
  <modal-edit-option
    v-if="isShowModalEditOption"
    @on-close="handleCloseEditOptionDialog"
    :option="optionState"
    :optionList="options"
    :topicState="topicState"
  />
  <modal-option-library
    v-if="isShowModalOptionLibrary"
    @on-close="isShowModalOptionLibrary = false"
  />
  <modal-pick-from-library
    v-if="isShowModalPickLibrary"
    :topic-id="topicId"
    :existing-options="options"
    @on-close="isShowModalPickLibrary = false"
    @on-added="refreshOptionList"
  />

  <!-- Top layer: confirm / error over form or other modals -->
  <UiDialog v-model="dialog" title="Xác nhận">
    <p class="font-sans text-sm text-ink">{{ text }}</p>
    <div class="flex justify-end gap-2 mt-4">
      <UiButton variant="secondary" @click="closeConfirmDialog">Không</UiButton>
      <UiButton variant="primary" @click="handleTopic(type)">Có</UiButton>
    </div>
  </UiDialog>

  <UiDialog v-model="errorDialog" title="Lỗi!">
    <UiAlert type="error" message="Đã có lỗi xảy ra!" />
    <div class="flex justify-end gap-2 mt-4">
      <UiButton variant="primary" block @click="errorDialog = false">Đóng</UiButton>
    </div>
  </UiDialog>

  <!-- Main Layout -->
  <div class="min-h-screen bg-[var(--color-cream,#FFF8F0)]">
  <div class="max-w-6xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif font-extrabold text-3xl text-ink">Quản lý Topic</h1>
      <div class="flex gap-2">
        <UiButton variant="secondary" size="md" shape="rounded" @click="isShowModalOptionLibrary = true">
          <i class="mdi mdi-bookshelf mr-1"></i> Thư viện
        </UiButton>
        <UiButton variant="primary" size="md" shape="rounded" @click="openCreateForm">
          <i class="mdi mdi-plus mr-1"></i> Thêm topic
        </UiButton>
      </div>
    </div>

    <div class="rounded-[20px] bg-white p-6 shadow-[0_2px_12px_0_rgba(0,0,0,0.04)] overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted whitespace-nowrap w-12">STT</th>
            <th class="text-left font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted">Tên topic</th>
            <th class="text-left font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted whitespace-nowrap w-20">Team</th>
            <th class="text-left font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted whitespace-nowrap w-24">Trạng thái</th>
            <th class="text-left font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted whitespace-nowrap w-36">Deadline</th>
            <th class="text-right font-sans font-bold text-[10px] uppercase tracking-wide px-2 py-3 border-b border-stone-200 text-muted whitespace-nowrap w-24">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, i) in paginatedTopics"
            :key="item.id"
            class="transition-colors"
          >
            <td class="px-2 py-3.5 border-b border-stone-100 font-sans text-sm text-ink">{{ (page - 1) * pageSize + i + 1 }}</td>
            <td class="px-2 py-3.5 border-b border-stone-100 font-sans text-sm font-bold text-ink">{{ item.name }}</td>
            <td class="px-2 py-3.5 border-b border-stone-100">
              <UiTeamBadge :label="item.team || 'All'" />
            </td>
            <td class="px-2 py-3.5 border-b border-stone-100">
              <UiStatusBadge :open="isTopicOpen(item)" />
            </td>
            <td class="px-2 py-3.5 border-b border-stone-100 font-sans text-xs text-muted whitespace-nowrap">{{ dayjs(new Date((item?.date as any)?.seconds * 1000)).format('DD/MM/YYYY HH:mm') }}</td>
            <td class="px-2 py-3.5 border-b border-stone-100">
              <div class="flex items-center justify-end gap-1">
                <UiIconButton icon="mdi-pencil" title="Sửa topic" @click="handleEditTopic(item.id)" />
                <UiIconButton
                  icon="mdi-calendar-clock"
                  accent
                  title="Gia hạn topic"
                  @click="openExtend(item)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!topics.length" class="text-center py-12">
        <p class="font-sans text-sm text-muted">Chưa có topic nào</p>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 mt-1">
        <span class="font-sans text-xs text-muted">Tổng: {{ topics.length }} topic</span>
        <div class="flex items-center gap-1">
          <button class="pointer-events-auto w-8 h-8 rounded-full text-sm font-bold bg-stone-100 text-ink hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none" :disabled="page <= 1" @click="goToPage(page - 1)">
            <i class="mdi mdi-chevron-left"></i>
          </button>
          <button v-for="p in totalPages" :key="p" class="min-w-8 h-8 px-2.5 rounded-full text-xs font-bold" :class="p === page ? 'bg-terracotta text-white' : 'bg-stone-100 text-ink hover:bg-stone-200'" @click="goToPage(p)">{{ p }}</button>
          <button class="w-8 h-8 rounded-full text-sm font-bold bg-stone-100 text-ink hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none" :disabled="page >= totalPages" @click="goToPage(page + 1)">
            <i class="mdi mdi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed, defineAsyncComponent } from 'vue'
import { UiButton, UiDialog, UiInput, UiToggle, UiAlert, UiRadio, UiStatusBadge, UiTeamBadge, UiIconButton } from '@/components/ui'
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/plugins/firebase'
import { getTopicById, useTopics, sortTopicsByDateDesc } from '@/services/topic.service'
import { getOptionsByTopicId } from '@/services/option.service'
import { initOption, initTopic } from './Admin.state'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import { mappingObject } from '@/core/utils/mappingObject'
import { DEFAULT_CARD_IMG } from '@/core/constants/app'
import dayjs from 'dayjs'

const ModalCreateOption = defineAsyncComponent(() => import('./ModalCreateOption.vue'))
const ModalEditOption = defineAsyncComponent(() => import('./ModalEditOption.vue'))
const ModalOptionLibrary = defineAsyncComponent(() => import('./ModalOptionLibrary.vue'))
const ModalPickFromLibrary = defineAsyncComponent(() => import('./ModalPickFromLibrary.vue'))

const topics = useTopics()
const text = ref<string>('')
const textBtn = ref<string>('Tạo mới')
const topicId = ref<string>('')
const topicCancelId = ref<string>('')
const alert = ref<string>('')
const errorDialog = ref<boolean>(false)
const formDialog = ref<boolean>(false)
const showAddBtn = ref<boolean>(false)
const dialog = ref<boolean>(false)
const type = ref<string>('create')
const reset = ref<boolean>(false)
const colorAlert = ref<string>('green-darken-1')
const options = ref<IOption[]>([])
const listOptionDlg = ref<boolean>(false)
const isShowModalCreateOption = ref<boolean>(false)
const isShowModalEditOption = ref<boolean>(false)
const isShowModalOptionLibrary = ref<boolean>(false)
const isShowModalPickLibrary = ref<boolean>(false)
const isFirstCheckStatus = ref<boolean>(true)
const page = ref(1)
const pageSize = 10
const extendDlg = ref(false)
const extendDate = ref<Date>(new Date())
const extendTopicId = ref<string>('')

const extDateStr = computed(() => {
  if (!extendDate.value) return ''
  return extendDate.value.toISOString().split('T')[0]
})

const extTimeStr = computed(() => {
  if (!extendDate.value) return ''
  const d = extendDate.value
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const onExtDateChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const [y, m, day] = val.split('-').map(Number)
  extendDate.value.setFullYear(y, m - 1, day)
  extendDate.value = new Date(extendDate.value)
}

const onExtTimeChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const [h, min] = val.split(':').map(Number)
  extendDate.value.setHours(h, min, 0, 0)
  extendDate.value = new Date(extendDate.value)
}

const sortedTopics = computed(() =>
  ([...(topics.value ?? [])] as ITopic[]).sort(sortTopicsByDateDesc)
)

const paginatedTopics = computed(() => {
  const start = (page.value - 1) * pageSize
  return sortedTopics.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.max(1, Math.ceil((sortedTopics.value?.length || 0) / pageSize)))

const goToPage = (p: number) => { page.value = p }

watch(topics, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
}, { deep: true })

const topicState = ref({ data: undefined as ITopic | undefined })
const optionState = ref<IOption>(initOption)
const topicFormData = reactive<ITopic>({ ...initTopic })

const toDate = (d: unknown): Date => {
  if (d instanceof Date) return d
  if (d && typeof d === 'object' && 'seconds' in (d as any)) return new Date((d as any).seconds * 1000)
  return new Date()
}

const dateStr = computed(() => {
  const d = topicFormData.date
  if (!d) return ''
  return toDate(d).toISOString().split('T')[0]
})

const timeStr = computed(() => {
  const d = topicFormData.date
  if (!d) return ''
  const date = toDate(d)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
})

const onDateChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const current = toDate(topicFormData.date)
  const [y, m, day] = val.split('-').map(Number)
  current.setFullYear(y, m - 1, day)
  topicFormData.date = current
}

const onTimeChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (!val) return
  const current = toDate(topicFormData.date)
  const [h, min] = val.split(':').map(Number)
  current.setHours(h, min, 0, 0)
  topicFormData.date = current
}

const isTopicOpen = (item: any) => {
  const deadline = item?.date?.toDate ? item.date.toDate() : toDate(item?.date)
  return item.status === true || deadline >= new Date()
}

watch(
  () => topics,
  async (topicsRef) => {
    if (!topicsRef.value.length || !isFirstCheckStatus.value) return
    isFirstCheckStatus.value = false
    const syncStatusList: Promise<void>[] = []
    const currentDay = new Date()
    topicsRef.value.forEach((topicItem) => {
      if (topicItem.status === true && topicItem.date.toDate() < currentDay) {
        const topicRef = doc(db, 'topics', topicItem.id)
        syncStatusList.push(
          updateDoc(topicRef, { ...topicItem, status: false, updatedAt: currentDay })
        )
      }
    })
    await Promise.all(syncStatusList)
  },
  { deep: true }
)

const openCreateForm = () => {
  cancelUpdate()
  formDialog.value = true
}

const confirm = (actionType: string) => {
  if (!topicFormData.name) return false
  if (topicFormData.date && topicFormData.date < new Date() && actionType === 'create') {
    colorAlert.value = 'red-lighten-1'
    alert.value = 'Thời gian phải lớn hơn hiện tại'
    setTimeout(() => { alert.value = ''; colorAlert.value = 'green-darken-1' }, 2000)
    return false
  }
  topicFormData.status = true
  text.value = actionType === 'create' ? 'Bạn có muốn thêm topic không?' : 'Bạn có muốn cập nhật topic không?'
  dialog.value = true
}

const handleAddOption = async (id: string) => {
  const topicData = await getTopicById(id)
  topicState.value.data = topicData
  isShowModalCreateOption.value = true
}

const handleDeleteTopic = (topicVal: string) => {
  text.value = 'Bạn có muốn xóa topic không?'
  dialog.value = true
  type.value = 'delete'
  if (topicId.value === topicVal) reset.value = true
  topicCancelId.value = topicVal
}

const handleDeleteFromEdit = () => {
  handleDeleteTopic(topicId.value)
}

const closeConfirmDialog = () => {
  dialog.value = false
  if (formDialog.value && topicId.value && type.value === 'delete') {
    type.value = 'update'
  }
}

const openOptionsFromEdit = async () => {
  formDialog.value = false
  await showOptionList(topicId.value)
}

const cancelUpdate = () => {
  textBtn.value = 'Tạo mới'
  type.value = 'create'
  showAddBtn.value = false
  topicId.value = ''
  mappingObject(topicFormData, { ...initTopic })
}

const handleEditTopic = async (id: string) => {
  const topicData = await getTopicById(id)
  if (topicData?.name) {
    topicId.value = topicData.id
    mappingObject(topicFormData, { ...topicData, updatedAt: new Date() })
    textBtn.value = 'Cập nhật'
    type.value = 'update'
    showAddBtn.value = true
    formDialog.value = true
  }
}

const getOptions = async (topicId: string, isSetOption: boolean = false) => {
  const topicData = await getOptionsByTopicId(topicId)
  let optionArr = [] as IOption[]
  setTimeout(() => {
    if (isSetOption) options.value = topicData.value as IOption[]
    else optionArr = topicData.value as IOption[]
  }, 200)
  return optionArr
}

const handleTopic = async (actionType: string) => {
  switch (actionType) {
    case 'create':
      try {
        const docRef = await addDoc(collection(db, 'topics'), {
          ...topicFormData,
          status: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        dialog.value = false
        formDialog.value = false
        alert.value = 'Thêm mới thành công'
        setTimeout(() => {
          alert.value = ''
        }, 2000)
        await showOptionList(docRef.id)
      } catch (e) {
        errorDialog.value = true
        if (e instanceof Error) console.error(e.message)
      }
      break
    case 'update':
      await update({ ...topicFormData, updatedAt: new Date() })
      break
    case 'delete':
      await deleteTopic()
      break
  }
}

const update = async (topic: object) => {
  const topicRef = doc(db, 'topics', topicId.value)
  try {
    await updateDoc(topicRef, topic)
    dialog.value = false
    formDialog.value = false
    alert.value = 'Cập nhật thành công'
    setTimeout(() => { alert.value = '' }, 2000)
  } catch (e) {
    errorDialog.value = true
    if (e instanceof Error) console.error(e.message)
  }
}

const deleteTopic = async () => {
  try {
    await deleteDoc(doc(db, 'topics', topicCancelId.value))
    dialog.value = false
    formDialog.value = false
    listOptionDlg.value = false
    alert.value = ''
    if (reset.value === true) cancelUpdate()
  } catch (e) {
    errorDialog.value = true
    if (e instanceof Error) console.error(e.message)
  }
}

const openExtend = (item: any) => {
  extendTopicId.value = item.id
  const d = item.date
  extendDate.value = d?.toDate ? d.toDate() : new Date(d as any)
  extendDlg.value = true
}

const confirmExtend = async () => {
  try {
    await updateDoc(doc(db, 'topics', extendTopicId.value), {
      date: extendDate.value,
      status: true,
      updatedAt: new Date()
    })
    extendDlg.value = false
    alert.value = 'Gia hạn thành công'
    setTimeout(() => { alert.value = '' }, 2000)
  } catch (e) {
    errorDialog.value = true
    if (e instanceof Error) console.error(e.message)
  }
}

const showOptionList = async (id: string) => {
  await getOptions(id, true)
  topicId.value = id
  listOptionDlg.value = true
  topicState.value.data = await getTopicById(id)
}

const refreshOptionList = async () => {
  if (!topicId.value) return
  await getOptions(topicId.value, true)
}

const handleCloseCreateOption = async () => {
  isShowModalCreateOption.value = false
  await refreshOptionList()
}

const deleteOption = async (optionId: string) => {
  await deleteDoc(doc(db, 'options', optionId))
  options.value = await getOptions(topicId.value, true)
}

const handleEditOption = async (option: IOption) => {
  optionState.value = option
  isShowModalEditOption.value = true
}

const handleCloseEditOptionDialog = async () => {
  await getOptions(topicId.value, true)
  isShowModalEditOption.value = false
}
</script>

<style scoped>
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: pointer;
}
</style>
