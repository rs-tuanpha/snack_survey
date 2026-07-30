<template>
  <div class="min-h-screen flex flex-col px-6 py-8">
    <div class="w-full max-w-6xl mx-auto mb-4">
      <UiButton variant="secondary" size="sm" shape="rounded" @click="goHome">
        <i class="mdi mdi-arrow-left"></i> Quay lại
      </UiButton>
    </div>
    <div class="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <!-- LEFT: Sidebar -->
      <div class="w-full lg:w-1/3">
        <!-- Topic Info -->
        <div class="theme-panel-md bg-surface p-6 mb-4">
          <div class="flex items-center gap-2 mb-2">
            <span
              v-if="currentTopic"
              class="theme-chip text-[10px] uppercase px-2.5 py-0.5"
              :class="currentTopic?.status ? 'bg-sage text-white' : 'bg-retro-pink text-ink'"
            >
              {{ currentTopic?.status ? 'Mở' : 'Đóng' }}
            </span>
          </div>
          <h1 class="font-serif font-black text-2xl text-ink mb-1">{{ currentTopic?.name }}</h1>
          <p class="font-sans text-sm text-muted mb-4">{{ currentTopic?.description }}</p>
          <div class="flex flex-wrap items-center gap-3">
            <div class="theme-chip text-[10px] font-bold text-muted px-3 py-1.5 inline-flex items-center gap-1.5">
              <i class="mdi mdi-calendar"></i>
              {{ currentTopic?.date ? dayjs(new Date((currentTopic?.date as any)?.seconds * 1000)).format('DD/MM/YYYY') : '---' }}
            </div>
            <div v-if="Boolean(countdown)" class="theme-chip text-[10px] font-bold text-terracotta px-3 py-1.5 inline-flex items-center gap-1.5">
              <i class="mdi mdi-clock-time-eight-outline"></i> Còn {{ countdown }}
            </div>
          </div>
        </div>

        <!-- Ranking List -->
        <div v-if="topOptions.length" class="theme-panel-md bg-surface p-5">
          <h4 class="font-sans font-black text-sm uppercase tracking-[.1em] text-muted mb-4">🏆 TOP</h4>
          <div class="space-y-3">
            <div
              v-for="(opt, oi) in topOptions.slice(0, 3)"
              :key="opt.id"
              class="theme-panel relative flex items-center gap-3 px-4 py-3"
              :class="[oi === 0 ? 'bg-retro-yellow/30' : '', oi === 1 ? 'bg-stone-100' : '', oi === 2 ? 'bg-amber-50/60' : '']"
            >
              <img :src="RANK_ICON[oi]" class="absolute -top-0 -left-0 z-20 w-10 h-10 shrink-0" />
              <div class="relative shrink-0">
                <img :src="opt.thumbnail || DEFAULT_CARD_IMG" class="w-12 h-12 object-cover border-[length:var(--border-w)] border-[color:var(--stroke)] rounded-[var(--radius-media)]" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-sans text-base font-bold text-ink truncate">{{ opt.title }}</p>
                <p class="font-mono text-xs text-muted">{{ uniqueVoters(opt.voteBy).length }} người vote</p>
              </div>
              <span class="theme-chip text-sm font-black text-ink px-3 py-1 bg-retro-yellow !shadow-[var(--elev-0)] shrink-0">{{ uniqueVoters(opt.voteBy).length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Options -->
      <div class="flex-1 min-w-0">
        <!-- Alerts -->
        <div class="flex items-center gap-2 mb-4">
          <div class="flex-1">
            <UiAlert v-if="!common.loading && !currentTopic?.status && !alertVote" type="warning" message="Topic này đã đóng, vui lòng trở lại sau" />
            <UiAlert v-if="alertVote" :type="(alertVoteType as 'success' | 'error')" :message="alertVote" />
          </div>
          <form-create-option v-if="currentTopic?.link && currentTopic?.status" :id="id.toString()" :options="options" :topic-state="currentTopic" />
        </div>

        <!-- Options Grid -->
        <div class="theme-panel-md bg-surface p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="theme-label text-muted">Tất cả options ({{ options.length }})</h4>
          </div>
          <div v-if="options.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <option-card
              v-for="(option, index) in options"
              :key="option.id"
              :index="index"
              :option="option"
              :current-account="currentAccount"
              :rank="option.id ? optionRankMap[option.id] ?? null : null"
              @on-click-see-more="onClickSeeMore(option)"
              @handle-change-vote="handleChangeVote(index)"
            />
          </div>
          <section v-else>
            <p class="font-sans text-base text-muted text-center py-8">Chưa có option nào</p>
          </section>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="showOverlay" class="fixed inset-0 bg-ink/40 z-40 flex items-center justify-center">
      <div class="w-8 h-8 border-[2px] border-ink border-t-terracotta rounded-full animate-spin"></div>
    </div>

    <!-- Vote List Dialog -->
    <UiDialog v-model="dialog" title="Danh sách vote">
      <div class="max-h-[300px] overflow-y-auto space-y-2">
        <div v-for="user in listVoteBy" :key="user.username" class="flex items-center gap-2">
          <UiAvatar :src="user.avatar" :fallback="user.username" size="sm" />
          <span class="font-sans text-sm text-ink">{{ user.username }}</span>
        </div>
      </div>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useCollection, useDocument } from 'vuefire'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import { RANK_ICON, DEFAULT_CARD_IMG } from '@/core/constants/app'

import { UiAlert, UiAvatar, UiButton, UiDialog } from '@/components/ui'
import { ETopicTeam } from '@/core/constants/enum'
import useCommon from '@/core/hooks/useCommon'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IUser } from '@/core/interfaces/model/user'
import { getAccountById } from '@/services/account.service'
import {
  getOptionsRefById,
  handleMultipleVote,
  handleSingleVote,
  getRankByTopicId
} from '@/services/option.service'
import { getTopicRef, updateTopic } from '@/services/topic.service'
import { useCommonStore } from '@/stores'
import { isSameVoter, uniqueVoters } from '@/core/utils/voter'
import OptionCard from './OptionCard.vue'

const FormCreateOption = defineAsyncComponent(() => import('./FormCreateOption.vue'))

const { getParams, handleRouter } = useCommon('useCommonStore')
const { id } = getParams()
const common = useCommonStore()

const goHome = () => handleRouter.pushName('home', {})

const currentAccount = ref<IUser | null>(null)
const showOverlay = ref<boolean>(false)
const currentTime = ref(new Date().getTime())
const listVoteBy = ref<IUser[]>([])
const dialog = ref<boolean>(false)
const alertVote = ref<string>('')
const alertVoteType = ref<string>('success')

const topicRef = computed(() => getTopicRef(id.toString()))
const currentTopic = useDocument<ITopic>(topicRef)
const topOptionsRef = computed(() => getRankByTopicId(id.toString()))
const topOptions = useCollection<IOption>(topOptionsRef)
const optionsRef = computed(() => getOptionsRefById(id.toString()))
const options = useCollection<IOption>(optionsRef)

const voteState = computed(() => {
  if (!currentAccount.value) return []
  return options.value
    .map((option, index) => ({
      optionId: option.id,
      index,
      isVoted: uniqueVoters(option.voteBy).some((voter) => isSameVoter(voter, currentAccount.value))
    }))
    .filter((vote) => vote.isVoted)
    .map((vote) => vote.index)
})

const optionRankMap = computed(() => {
  const map: Record<string, number> = {}
  const sorted = [...options.value].sort(
    (a, b) => uniqueVoters(b.voteBy).length - uniqueVoters(a.voteBy).length
  )
  sorted.slice(0, 3).forEach((opt, i) => {
    if (opt.id) map[opt.id] = i
  })
  return map
})

const timeRemaining = computed(() => {
  if (currentTopic.value?.date) {
    const difference = new Date((currentTopic.value?.date as any)?.seconds * 1000).getTime() - currentTime.value
    if (difference <= 0) { update(); return { days: 0, hours: 0, minutes: 0, seconds: 0 } }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000)
    }
  }
  return { days: -1, hours: -1, minutes: -1, seconds: -1 }
})

const countdown = computed(() => {
  const { days, hours, minutes, seconds } = timeRemaining.value
  const parts: string[] = []
  if (days > 0) parts.push(`${days} ngày`)
  if (hours > 0) parts.push(`${hours} giờ`)
  if (minutes > 0) parts.push(`${minutes} phút`)
  if (seconds > 0) parts.push(`${seconds} giây`)
  return parts.join(', ')
})

const update = async () => {
  const topicInfo = currentTopic.value ?? { id: '', name: '', description: '', date: new Date(), status: true, link: true, option: true, team: ETopicTeam.ALL }
  topicInfo.status = false
  updateTopic(topicInfo.id, topicInfo)
}

const handleChangeVote = debounce(async (optionIndex: number) => {
  if (!currentTopic.value?.status) { showAlert('Topic này đã đóng!', 'error'); return }
  try {
    showOverlay.value = true
    const optionId = options.value[optionIndex].id
    if (!currentAccount.value) throw new Error('User not authenticated')
    if (currentTopic.value?.option) await handleMultipleVote(optionId, currentAccount.value)
    else {
      const previousOptionId = voteState.value.length > 0 ? options.value[voteState.value[0]].id : null
      await handleSingleVote(optionId, currentAccount.value, previousOptionId)
    }
  } catch (error) { console.error('Vote error:', error); showAlert('Cập nhật thất bại', 'error')
  } finally { showOverlay.value = false }
}, 300)

const showAlert = (message: string, type: string) => {
  alertVote.value = message
  alertVoteType.value = type
  setTimeout(() => { alertVote.value = '' }, 2000)
}

const onClickSeeMore = (option: IOption) => {
  listVoteBy.value = uniqueVoters(option.voteBy)
  dialog.value = true
}

onMounted(async () => {
  const isResetAccount = localStorage.getItem('isResetAccount')
  if (isResetAccount !== 'true') {
    localStorage.clear()
    localStorage.setItem('isResetAccount', 'true')
    handleRouter.pushPath('/')
  }
  setInterval(() => { currentTime.value = new Date().getTime() }, 1000)
  const accountId = localStorage.getItem('account_info')
  if (!accountId) { handleRouter.pushPath('/'); return }
  currentAccount.value = await getAccountById(accountId!)
})
</script>
