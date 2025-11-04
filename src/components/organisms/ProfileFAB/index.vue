<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-tooltip location="bottom" :text="userData?.username || 'User'">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="{ ...props, ...tooltipProps }"
            class="profile-fab"
            icon
            size="64"
            variant="flat"
            color="primary"
          >
            <v-avatar size="56" color="primary">
              <v-img v-if="userData?.avatar" :src="userData.avatar" :alt="userData.username" />
              <span v-else class="text-h6">{{ avatarInitial }}</span>
            </v-avatar>
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <v-list min-width="200" density="compact">
      <v-list-item>
        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ userData?.username || 'User' }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ userData?.email || '' }}
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider></v-divider>

      <v-list-item
        v-if="isAdmin"
        @click="handleAdminNavigation"
        prepend-icon="mdi-shield-crown"
        title="Quản trị"
      >
      </v-list-item>

      <v-list-item @click="handleSettings" prepend-icon="mdi-cog" title="Cài đặt"> </v-list-item>

      <v-list-item @click="handleLogout" title="Đăng xuất">
        <template v-slot:prepend>
          <v-icon color="error">mdi-logout-variant</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useCookie } from '@/core/hooks/useCookie'
import { CookieKeys } from '@/core/utils/cookieUtils'
import useCommon from '@/core/hooks/useCommon'

// Get admin path from environment variable
// eslint-disable-next-line no-undef
const ADMIN_PATH = process.env.VUE_APP_ADMIN_PATH

const { handleRouter, storage } = useCommon('useCommonStore')
const userStore = useUserStore()
const authStore = useAuthStore()

// Cookie hooks
const accessTokenCookie = useCookie(CookieKeys.ACCESS_TOKEN, '')
const refreshTokenCookie = useCookie(CookieKeys.REFRESH_TOKEN, '')
const userDataCookie = useCookie(CookieKeys.USER_DATA, '')

// Get user data from store (prefer userStore, fallback to authStore)
const userData = computed(() => {
  return userStore.user || authStore.user
})

// Get first letter of username as avatar initial
const avatarInitial = computed(() => {
  if (!userData.value?.username) return 'U'
  return userData.value.username.charAt(0).toUpperCase()
})

// Check if user is admin
const isAdmin = computed(() => {
  return authStore.isAdmin
})

// Handle logout
const handleLogout = () => {
  // Remove cookies
  accessTokenCookie.remove()
  refreshTokenCookie.remove()
  userDataCookie.remove()

  // Remove localStorage
  storage.removeLocalStorage('user')
  storage.removeLocalStorage('topics')
  storage.removeLocalStorage('app_preferences')

  // Clear stores
  authStore.clearToken()
  userStore.setUser(null)

  // Redirect to login
  handleRouter.pushPath('/login')
}

// Handle settings (navigate to profile page)
const handleSettings = () => {
  handleRouter.pushPath('/profile')
}

// Handle admin navigation
const handleAdminNavigation = () => {
  if (ADMIN_PATH) {
    handleRouter.replacePath(ADMIN_PATH)
  } else {
    console.warn('VUE_APP_ADMIN_PATH is not defined')
  }
}
</script>

<style scoped lang="scss">
.profile-fab {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

// Responsive for mobile
@media (max-width: 600px) {
  .profile-fab {
    top: 16px;
    right: 16px;
  }
}
</style>
