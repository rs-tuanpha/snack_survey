<template>
  <div class="min-h-screen flex items-center justify-center px-6" v-if="show">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="font-serif font-black text-4xl text-ink">Snack Survey</h1>
        <p class="font-sans text-sm text-muted mt-1">Đăng nhập để tiếp tục</p>
      </div>
      <div class="theme-panel-md bg-surface p-6 flex flex-col gap-5">
        <div v-if="mode === 'register'" class="relative">
          <label class="block theme-label text-ink mb-1.5">Tên người dùng</label>
          <input
            v-model="username"
            placeholder="Nguyễn Văn A"
            class="w-full font-sans text-base text-ink theme-control px-4 py-3 outline-none transition-shadow duration-100 placeholder:text-subtle focus:[box-shadow:var(--elev-2)]"
            :class="errorClass"
            @focus="suggestionsOpen = true"
            @keyup.enter="submit"
          />
          <div
            v-if="suggestionsOpen && suggestedAccounts.length"
            class="absolute z-20 mt-1 w-full theme-panel bg-surface max-h-48 overflow-y-auto"
          >
            <div
              v-for="acct in suggestedAccounts"
              :key="acct.id"
              class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-cream transition-colors duration-75 border-b border-ink/10 last:border-b-0"
              @click="pickSuggestion(acct)"
            >
              <UiAvatar :src="acct.avatar" :fallback="acct.username" size="sm" />
              <div class="flex-1 min-w-0">
                <span class="font-sans text-sm font-bold text-ink block truncate">{{
                  acct.username
                }}</span>
                <span v-if="acct.email" class="font-mono text-[10px] text-muted truncate block">{{
                  acct.email
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block theme-label text-ink mb-1.5">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="w-full font-sans text-base text-ink theme-control px-4 py-3 outline-none transition-shadow duration-100 placeholder:text-subtle focus:[box-shadow:var(--elev-2)]"
            :class="errorClass"
            @keyup.enter="submit"
          />
        </div>
        <div>
          <label class="block theme-label text-ink mb-1.5">Mật khẩu</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full font-sans text-base text-ink theme-control px-4 py-3 outline-none transition-shadow duration-100 placeholder:text-subtle focus:[box-shadow:var(--elev-2)]"
            :class="errorClass"
            @keyup.enter="submit"
          />
        </div>
        <div
          v-if="error && message"
          class="font-mono text-[10px] font-semibold text-terracotta -mt-2 ml-1"
        >
          {{ message }}
        </div>
        <UiButton variant="primary" size="lg" block :disabled="loading" @click="submit">
          {{ loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}
        </UiButton>
        <p class="font-sans text-sm text-center text-muted">
          {{ mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?' }}
          <button
            class="font-bold text-ink underline hover:text-terracotta transition-colors ml-1"
            @click="toggleMode"
          >
            {{ mode === 'login' ? 'Đăng ký' : 'Đăng nhập' }}
          </button>
        </p>
      </div>
    </div>
  </div>

  <div class="min-h-screen flex flex-col px-6 py-8" v-if="!show">
    <div class="w-full max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="font-serif font-black text-3xl text-ink">Snack Survey</h1>
        <div class="flex items-center gap-4">
          <span class="font-sans text-lg font-bold text-ink">{{ accountInfo.username }}</span>
          <UiButton variant="danger" size="sm" shape="rounded" @click="logout">Đăng xuất</UiButton>
        </div>
      </div>

      <div class="theme-panel-md bg-cream p-5 flex flex-col gap-4 mb-6">
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <UiInput v-model="searchTerm" label="Tìm topic" compact placeholder="Tìm topic..." />
          </div>
          <UiButton variant="secondary" size="icon" shape="rounded" @click="debouncedSearch">
            <i class="mdi mdi-magnify"></i>
          </UiButton>
        </div>
      </div>

      <div v-if="searchedTopics && searchedTopics.length" class="flex flex-col gap-4">
        <div v-for="topic in searchedTopics" :key="topic.id">
          <UiCard
            variant="interactive"
            class="!p-6 !overflow-visible"
            :class="
              isTopicOpen(topic) ? '!border-transparent animate-border-spin !border-[3px]' : ''
            "
            @click="goTopicVote(topic.id)"
          >
            <div class="flex items-start gap-4 mt-1">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-3">
                  <span
                    class="theme-chip text-[10px] uppercase px-3 py-1 shrink-0"
                    :class="isTopicOpen(topic) ? 'bg-sage text-white' : 'bg-retro-pink text-ink'"
                  >
                    {{ isTopicOpen(topic) ? 'Mở' : 'Đóng' }}
                  </span>
                  <span class="font-sans text-xl font-bold text-ink">{{ topic.name }}</span>
                </div>
                <div
                  v-if="topicTopOptions[topic.id]?.length"
                  class="flex gap-3 flex-wrap"
                  @click.stop
                >
                  <div
                    v-for="(opt, oi) in topicTopOptions[topic.id]"
                    :key="opt.id"
                    class="theme-panel !overflow-visible relative flex items-center gap-2 px-3 py-2 min-w-0 cursor-default max-w-[360px] flex-1"
                    :class="[
                      oi === 0 ? 'bg-retro-yellow/30' : '',
                      oi === 1 ? 'bg-stone-100' : '',
                      oi === 2 ? 'bg-amber-50/60' : ''
                    ]"
                  >
                    <div class="relative shrink-0">
                      <img
                        :src="opt.thumbnail || DEFAULT_CARD_IMG"
                        class="relative z-0 w-8 h-8 object-cover border-[length:var(--border-w)] border-[color:var(--stroke)] rounded-[var(--radius-media)]"
                      />
                      <img
                        :src="RANK_ICON[oi]"
                        class="absolute -top-5 -left-4 w-10 h-10 pointer-events-none drop-shadow-[1px_1px_0_rgba(28,25,23,0.6)]"
                      />
                    </div>
                    <span class="font-sans text-sm font-bold text-ink truncate">{{
                      opt.title
                    }}</span>
                    <span
                      class="theme-chip text-[10px] font-black text-ink px-2.5 py-0.5 shrink-0 ml-1 whitespace-nowrap bg-retro-yellow !shadow-[var(--elev-0)]"
                      >{{ opt.voteCount }} vote{{ opt.voteCount > 1 ? 's' : '' }}</span
                    >
                  </div>
                </div>
              </div>
              <span
                v-if="topic.voteBy"
                class="theme-chip bg-retro-yellow w-9 h-9 flex items-center justify-center font-black text-sm shrink-0 cursor-pointer mt-0.5 !rounded-full"
                :title="`${topic.voteBy.length} người đã vote`"
                @click.stop="onClickAvatar(topic.voteBy)"
              >
                {{ topic.voteBy.length }}
              </span>
            </div>
          </UiCard>
        </div>
        <div v-if="hasMore" class="flex justify-center pt-2">
          <UiButton variant="secondary" size="lg" :disabled="loadingMore" @click="loadMoreTopics">
            {{ loadingMore ? 'Đang tải...' : 'Xem thêm' }}
          </UiButton>
        </div>
      </div>

      <div v-else-if="!loading" class="theme-panel-md bg-surface p-5">
        <UiAlert type="warning" message="Hiện tại không có topic nào" />
      </div>
    </div>
  </div>

  <UiDialog v-model="dialog" title="Danh sách vote">
    <hr class="border-ink/20 my-3" />
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
import { signIn, signUp, signOut as authSignOut } from '@/services/auth.service'
import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import { UiButton, UiCard, UiDialog, UiInput, UiAvatar, UiAlert } from '@/components/ui'
import { DEFAULT_CARD_IMG, RANK_ICON } from '@/core/constants/app'
import { uniqueVoters } from '@/core/utils/voter'

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
const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const username = ref('')
const suggestionsOpen = ref(false)
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
  return topic.status === true && deadline && deadline >= new Date()
}

/** Search filter over the full team list (open + closed). */
const searchedAllTopics = computed(() => {
  const term = removeDiacritics(searchTerm.value.trim())
  if (!term) return topics.value
  return topics.value.filter((topic) => removeDiacritics(topic.name.trim()).includes(term))
})

const refreshVisible = () => {
  const openList = searchedAllTopics.value.filter(isTopicOpen)
  const all = searchedAllTopics.value

  if (!includeClosed.value) {
    // Default: show every open topic (no closed yet)
    searchedTopics.value = openList
    hasMore.value = all.some((t) => !isTopicOpen(t))
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
      // First click: unlock closed topics, keep page size of 5
      const openCount = searchedAllTopics.value.filter(isTopicOpen).length
      includeClosed.value = true
      visibleCount.value = openCount + TOPIC_PAGE_SIZE
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

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = false
  message.value = ''
  suggestionsOpen.value = false
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
  if (mode.value === 'register') {
    if (!username.value || !email.value || !password.value) {
      error.value = true
      message.value = 'Vui lòng điền đầy đủ thông tin'
      return
    }
  } else {
    if (!email.value || !password.value) {
      error.value = true
      message.value = 'Vui lòng nhập email và mật khẩu'
      return
    }
  }
  loading.value = true
  error.value = false
  message.value = ''
  try {
    if (mode.value === 'register') {
      const account = await signUp(username.value, email.value, password.value)
      if (!account) {
        error.value = true
        message.value = 'Đăng ký thất bại'
        return
      }
      setAccountInfo(account)
    } else {
      const account = await signIn(email.value, password.value)
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
