<template>
  <div class="min-h-screen flex items-center justify-center px-6" v-if="show">
    <div class="w-full max-w-[440px] flex flex-col gap-7 items-center">
      <UiBrandBlock :subtitle="authSubtitle" />
      <div class="w-full bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)]">
        <div v-if="mode === 'register'" class="relative">
          <label class="block text-[11px] font-bold tracking-[0.6px] text-ink mb-2 uppercase">Tên người dùng</label>
          <input
            v-model="username"
            placeholder="Nguyễn Văn A"
            class="w-full h-12 font-sans text-[15px] text-ink px-4 rounded-[14px] bg-white border border-stone-200 outline-none placeholder:text-stone-400 focus:border-terracotta/40"
            :class="errorClass"
            @focus="suggestionsOpen = true"
            @keyup.enter="submit"
          />
          <div
            v-if="suggestionsOpen && suggestedAccounts.length"
            class="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-xl max-h-48 overflow-y-auto shadow-lg"
          >
            <div
              v-for="acct in suggestedAccounts"
              :key="acct.id"
              class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-cream transition-colors duration-75 border-b border-stone-100 last:border-b-0"
              @click="pickSuggestion(acct)"
            >
              <UiAvatar :src="acct.avatar" :fallback="acct.username" size="sm" />
              <div class="flex-1 min-w-0">
                <span class="font-sans text-sm font-bold text-ink block truncate">{{
                  acct.username
                }}</span>
                <span v-if="acct.email" class="font-sans text-[10px] text-muted truncate block">{{
                  acct.email
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold tracking-[0.6px] text-ink mb-2 uppercase">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="w-full h-12 font-sans text-[15px] text-ink px-4 rounded-[14px] bg-white border border-stone-200 outline-none placeholder:text-stone-400 focus:border-terracotta/40"
            :class="errorClass"
            @keyup.enter="submit"
          />
        </div>

        <div v-if="mode !== 'forgot'">
          <label class="block text-[11px] font-bold tracking-[0.6px] text-ink mb-2 uppercase">Mật khẩu</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full h-12 font-sans text-[15px] text-ink px-4 rounded-[14px] bg-white border border-stone-200 outline-none placeholder:text-stone-400 focus:border-terracotta/40"
            :class="errorClass"
            @keyup.enter="submit"
          />
        </div>

        <div v-if="mode === 'register'">
          <label class="block text-[11px] font-bold tracking-[0.6px] text-ink mb-2 uppercase">Xác nhận mật khẩu</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            class="w-full h-12 font-sans text-[15px] text-ink px-4 rounded-[14px] bg-white border border-stone-200 outline-none placeholder:text-stone-400 focus:border-terracotta/40"
            :class="errorClass"
            @keyup.enter="submit"
          />
        </div>

        <div
          v-if="message"
          class="font-sans text-[12px] font-semibold -mt-2 ml-1"
          :class="error ? 'text-terracotta' : 'text-[var(--color-status,#0D9488)]'"
        >
          {{ message }}
        </div>

        <UiButton variant="primary" size="lg" block :disabled="loading" @click="submit">
          {{ submitLabel }}
        </UiButton>

        <p v-if="mode === 'login'" class="font-sans text-sm text-center text-muted">
          <button
            type="button"
            class="font-bold text-ink underline hover:text-terracotta transition-colors"
            @click="setMode('forgot')"
          >
            Quên mật khẩu?
          </button>
        </p>

        <p v-if="mode === 'forgot'" class="font-sans text-sm text-center text-muted">
          <button
            type="button"
            class="font-bold text-ink underline hover:text-terracotta transition-colors"
            @click="setMode('login')"
          >
            Quay lại đăng nhập
          </button>
        </p>

        <p v-if="mode !== 'forgot'" class="font-sans text-sm text-center text-muted">
          {{ mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?' }}
          <button
            type="button"
            class="font-bold text-ink underline hover:text-terracotta transition-colors ml-1"
            @click="setMode(mode === 'login' ? 'register' : 'login')"
          >
            {{ mode === 'login' ? 'Đăng ký' : 'Đăng nhập' }}
          </button>
        </p>
      </div>
    </div>
  </div>

  <div class="min-h-screen flex flex-col px-6 py-8 bg-[var(--color-cream,#FFF8F0)]" v-if="!show">
    <div class="w-full max-w-4xl mx-auto flex flex-col gap-7">
      <div class="flex justify-between items-center">
        <h1 class="font-serif font-extrabold text-3xl text-ink">Snack Survey</h1>
        <div class="flex items-center gap-4">
          <span class="font-sans text-lg font-bold text-ink">{{ accountInfo.username }}</span>
          <UiButton variant="primary" size="sm" shape="rounded" @click="logout">Đăng xuất</UiButton>
        </div>
      </div>

      <UiSearchPanel
        v-model="searchTerm"
        label="Tìm topic"
        placeholder="Tìm topic..."
        @search="debouncedSearch"
      />

      <div v-if="searchedTopics && searchedTopics.length" class="flex flex-col gap-4">
        <div v-for="topic in searchedTopics" :key="topic.id">
          <UiTopicCard
            :title="topic.name"
            :open="isTopicOpen(topic)"
            :date-label="formatTopicDate(topic)"
            :time-label="isTopicOpen(topic) ? topicCountdown(topic) : 'Đã kết thúc'"
            :voters="topic.voteBy"
            :top-options="topicTopOptions[topic.id]"
            @click="goTopicVote(topic.id)"
            @click-voters="onClickAvatar"
          />
        </div>
        <div v-if="hasMore" class="flex justify-center pt-2">
          <UiButton variant="secondary" size="md" shape="rounded" :disabled="loadingMore" @click="loadMoreTopics">
            {{ loadingMore ? 'Đang tải...' : 'Xem thêm' }}
          </UiButton>
        </div>
      </div>

      <div v-else-if="!loading" class="rounded-[20px] bg-white p-5 shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]">
        <UiAlert type="warning" message="Hiện tại không có topic nào" />
      </div>
    </div>
  </div>

  <UiDialog v-model="dialog" title="Danh sách vote">
    <hr class="border-stone-100 my-3" />
    <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
      <div v-for="user in listVoteBy" :key="user.username" class="flex items-center gap-2 py-1">
        <UiAvatar
          :src="user.avatar || ''"
          :fallback="user.username"
          size="sm"
          :title="user.username"
        />
        <span class="font-sans text-sm text-ink ml-1">{{ user.username }}</span>
      </div>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch, computed, onBeforeUnmount } from 'vue'
import { fetchAccounts } from '@/services/account.service'
import { getAllTopicsForTeam, TOPIC_PAGE_SIZE } from '@/services/topic.service'
import { debounce } from 'vue-debounce'
import { getOptionsByTopicIds } from '@/services/option.service'
import { signIn, signUp, resetPassword, signOut as authSignOut } from '@/services/auth.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { UiButton, UiDialog, UiAvatar, UiAlert, UiTopicCard, UiSearchPanel, UiBrandBlock } from '@/components/ui'
import { uniqueVoters } from '@/core/utils/voter'
import dayjs from 'dayjs'

import useCommon from '@/core/hooks/useCommon'
const { handleRouter } = useCommon('useCommonStore')

const show = ref<boolean>(true)
const topics = ref<ITopic[]>([])
const searchedTopics = ref<ITopic[]>([])
const options = ref<IOption[]>([])
const error = ref<boolean>(false)
const dialog = ref<boolean>(false)
const message = ref<string>('')
const loading = ref(false)
const loadingMore = ref(false)
const searchTerm = ref('')
const mode = ref<'login' | 'register' | 'forgot'>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const username = ref('')
const suggestionsOpen = ref(false)

const authSubtitle = computed(() => {
  if (mode.value === 'register') return 'Tạo tài khoản mới'
  if (mode.value === 'forgot') return 'Đặt lại mật khẩu qua email'
  return 'Đăng nhập để tiếp tục'
})

const submitLabel = computed(() => {
  if (loading.value) return 'Đang xử lý...'
  if (mode.value === 'forgot') return 'Gửi link đặt lại'
  if (mode.value === 'register') return 'Đăng ký'
  return 'Đăng nhập'
})
const accountInfo: {
  username?: string
  avatar?: string
  team?: string
} = reactive({ username: '', avatar: '', team: '' })
const listVoteBy = ref<IUser[]>([])
const hasMore = ref(false)
const visibleCount = ref(TOPIC_PAGE_SIZE)
/** Closed topics stay hidden until the user clicks "Xem thêm". */
const includeClosed = ref(false)
const accounts = ref<IUser[]>([])

const removeDiacritics = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const isTopicOpen = (topic: ITopic) => {
  const deadline = (topic.date as any)?.seconds
    ? new Date((topic.date as any).seconds * 1000)
    : topic.date
  return topic.status === true && !!deadline && deadline >= new Date()
}

const topicDeadline = (topic: ITopic) => {
  const raw = (topic.date as any)?.seconds
    ? new Date((topic.date as any).seconds * 1000)
    : topic.date
  return raw ? new Date(raw as Date) : null
}

const formatTopicDate = (topic: ITopic) => {
  const d = topicDeadline(topic)
  return d ? dayjs(d).format('DD/MM/YYYY') : '---'
}

const topicCountdown = (topic: ITopic) => {
  const d = topicDeadline(topic)
  if (!d) return '---'
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return 'Đã kết thúc'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const parts: string[] = []
  if (days > 0) parts.push(`${days} ngày`)
  if (hours > 0) parts.push(`${hours} giờ`)
  if (minutes > 0) parts.push(`${minutes} phút`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} giây`)
  return `Còn ${parts.join(', ')}`
}

/** Search filter over the full team list (open + closed). */
const searchedAllTopics = computed(() => {
  const term = removeDiacritics(searchTerm.value.trim())
  if (!term) return topics.value
  return topics.value.filter((topic) => removeDiacritics(topic.name.trim()).includes(term))
})

const refreshVisible = () => {
  const all = searchedAllTopics.value
  const openList = all.filter(isTopicOpen)
  const closedList = all.filter((t) => !isTopicOpen(t))

  if (!includeClosed.value) {
    if (openList.length > 0) {
      // Default: show every open topic; closed stay behind "Xem thêm"
      searchedTopics.value = openList
      hasMore.value = closedList.length > 0
      return
    }
    // No open topics: show the newest closed page (list already sorted open→closed, newest within group)
    searchedTopics.value = closedList.slice(0, TOPIC_PAGE_SIZE)
    hasMore.value = closedList.length > TOPIC_PAGE_SIZE
    return
  }

  searchedTopics.value = all.slice(0, visibleCount.value)
  hasMore.value = visibleCount.value < all.length
}

const errorClass = computed(() =>
  error.value && !message.value.includes('Vui lòng')
    ? 'border-terracotta shadow-[2px_2px_0_0_rgba(224,122,95,0.8)]'
    : ''
)

const topicTopOptions = computed(() => {
  const map: Record<string, IOption[]> = {}
  options.value.forEach((opt) => {
    if (!map[opt.topicId]) map[opt.topicId] = []
    map[opt.topicId].push(opt)
  })
  for (const id in map) {
    map[id].sort((a, b) => uniqueVoters(b.voteBy).length - uniqueVoters(a.voteBy).length)
    map[id] = map[id].slice(0, 3)
  }
  return map
})

const loadTopics = async (team: string | null) => {
  loading.value = true
  includeClosed.value = false
  visibleCount.value = TOPIC_PAGE_SIZE
  try {
    topics.value = await getAllTopicsForTeam(team)
    refreshVisible()
    await getTopicOptions()
  } finally {
    loading.value = false
  }
}

const loadAccountsForSuggestions = async () => {
  if (accounts.value.length) return
  accounts.value = await fetchAccounts()
}

const loadMoreTopics = async () => {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    if (!includeClosed.value) {
      // First click: unlock closed topics (or next closed page when there were no open ones)
      const openCount = searchedAllTopics.value.filter(isTopicOpen).length
      includeClosed.value = true
      visibleCount.value =
        openCount === 0 ? TOPIC_PAGE_SIZE * 2 : openCount + TOPIC_PAGE_SIZE
    } else {
      visibleCount.value += TOPIC_PAGE_SIZE
    }
    refreshVisible()
  } finally {
    loadingMore.value = false
  }
}

const suggestedAccounts = computed(() => {
  if (!username.value) return []
  const q = removeDiacritics(username.value)
  return accounts.value
    .filter((item: IUser) => item.username && removeDiacritics(item.username).includes(q))
    .slice(0, 8)
})

const pickSuggestion = (acct: IUser) => {
  username.value = acct.username
  if (acct.email) email.value = acct.email
  suggestionsOpen.value = false
}

const closeSuggestions = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    suggestionsOpen.value = false
  }
}

const setMode = (next: 'login' | 'register' | 'forgot') => {
  mode.value = next
  error.value = false
  message.value = ''
  suggestionsOpen.value = false
  if (next !== 'register') confirmPassword.value = ''
  if (next === 'forgot') password.value = ''
}

const setAccountInfo = (account: IUser) => {
  localStorage.setItem('account_info', account.id)
  localStorage.setItem('account_avatar', account.avatar ?? '')
  localStorage.setItem('account_username', account.username ?? '')
  localStorage.setItem('account_team', account.team ?? '')
  accountInfo.avatar = account.avatar ?? ''
  accountInfo.username = account.username ?? ''
  accountInfo.team = account.team ?? ''
  show.value = false
  loadTopics(account.team ?? '')
}

const submit = async () => {
  const trimmedEmail = email.value.trim()

  if (mode.value === 'forgot') {
    if (!trimmedEmail) {
      error.value = true
      message.value = 'Vui lòng nhập email'
      return
    }
    loading.value = true
    error.value = false
    message.value = ''
    try {
      await resetPassword(trimmedEmail)
      error.value = false
      message.value =
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận link đặt lại mật khẩu.'
    } catch (e: any) {
      error.value = true
      const code = e?.code
      if (code === 'auth/invalid-email') {
        message.value = 'Email không hợp lệ'
      } else if (code === 'auth/too-many-requests') {
        message.value = 'Quá nhiều lần thử, vui lòng thử lại sau'
      } else {
        // Neutral success-style message even on user-not-found to avoid account enumeration
        error.value = false
        message.value =
          'Nếu email tồn tại trong hệ thống, bạn sẽ nhận link đặt lại mật khẩu.'
      }
    } finally {
      loading.value = false
    }
    return
  }

  if (mode.value === 'register') {
    if (!username.value.trim() || !trimmedEmail || !password.value || !confirmPassword.value) {
      error.value = true
      message.value = 'Vui lòng điền đầy đủ thông tin'
      return
    }
    if (password.value.length < 6) {
      error.value = true
      message.value = 'Mật khẩu tối thiểu 6 ký tự'
      return
    }
    if (password.value !== confirmPassword.value) {
      error.value = true
      message.value = 'Mật khẩu xác nhận không khớp'
      return
    }
  } else if (!trimmedEmail || !password.value) {
    error.value = true
    message.value = 'Vui lòng nhập email và mật khẩu'
    return
  }

  loading.value = true
  error.value = false
  message.value = ''
  try {
    if (mode.value === 'register') {
      const account = await signUp(username.value, trimmedEmail, password.value)
      if (!account) {
        error.value = true
        message.value = 'Đăng ký thất bại'
        return
      }
      setAccountInfo(account)
    } else {
      const account = await signIn(trimmedEmail, password.value)
      if (!account) {
        error.value = true
        message.value = 'Tài khoản không tồn tại hoặc thông tin không chính xác'
        return
      }
      setAccountInfo(account)
    }
  } catch (e: any) {
    error.value = true
    const code = e?.code
    if (mode.value === 'register') {
      if (code === 'auth/email-already-in-use') {
        message.value = 'Email này đã được đăng ký'
      } else if (code === 'auth/weak-password') {
        message.value = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)'
      } else if (code === 'auth/invalid-email') {
        message.value = 'Email không hợp lệ'
      } else {
        message.value = 'Đăng ký thất bại, vui lòng thử lại'
      }
    } else {
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message.value = 'Sai mật khẩu'
      } else if (code === 'auth/user-not-found') {
        message.value = 'Email không tồn tại trong hệ thống'
      } else if (code === 'auth/invalid-email') {
        message.value = 'Email không hợp lệ'
      } else if (code === 'auth/too-many-requests') {
        message.value = 'Quá nhiều lần thử, vui lòng thử lại sau'
      } else {
        message.value = 'Đăng nhập thất bại, vui lòng thử lại'
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', closeSuggestions)
  const savedId = localStorage.getItem('account_info')
  if (savedId) {
    show.value = false
    accountInfo.avatar = localStorage.getItem('account_avatar') ?? ''
    accountInfo.username = localStorage.getItem('account_username') ?? ''
    accountInfo.team = localStorage.getItem('account_team') ?? ''
    await loadTopics(localStorage.getItem('account_team'))
  } else {
    await loadAccountsForSuggestions()
  }
})

watch(show, (isLoginForm) => {
  if (isLoginForm) loadAccountsForSuggestions()
})

const performSearch = () => {
  includeClosed.value = false
  visibleCount.value = TOPIC_PAGE_SIZE
  refreshVisible()
}
const debouncedSearch = debounce(performSearch, 500)

watch(searchTerm, debouncedSearch)

onBeforeUnmount(() => {
  debouncedSearch.cancel()
  document.removeEventListener('click', closeSuggestions)
})

const attachVoteBy = (topicList: ITopic[], optionList: IOption[]) => {
  topicList.forEach((topic) => {
    const result = optionList.filter((option) => option.topicId === topic.id)
    const combined: IUser[] = []
    result.forEach((option) => {
      ;(option.voteBy || []).forEach((obj) => {
        combined.push(obj)
      })
    })
    topic.voteBy = uniqueVoters(combined)
  })
}

const getTopicOptions = async () => {
  const topicData = await getOptionsByTopicIds(topics.value.map((t) => t.id))
  options.value = topicData
  attachVoteBy(topics.value, topicData)
}

const goTopicVote = (id: string) => {
  handleRouter.pushName('topicVote', { params: { id: id } })
}

const logout = async () => {
  await authSignOut()
  localStorage.clear()
  localStorage.setItem('isResetAccount', 'true')
  topics.value = []
  searchedTopics.value = []
  hasMore.value = false
  includeClosed.value = false
  visibleCount.value = TOPIC_PAGE_SIZE
  searchTerm.value = ''
  show.value = true
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  username.value = ''
  mode.value = 'login'
}

const onClickAvatar = (voteBy: IUser[]) => {
  if (voteBy.length > 0) {
    listVoteBy.value = uniqueVoters(voteBy)
    dialog.value = true
  }
}
</script>
