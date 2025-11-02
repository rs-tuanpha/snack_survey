import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { getCurrentUserProfile } from '@/services/user.service'
import type { IUser } from '@/core/interfaces/model/user'

/**
 * Composable để đảm bảo user data tồn tại, fallback API nếu cần
 */
export function useEnsureUser() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const router = useRouter()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const ensureUserData = async () => {
    // Check if user already exists in stores
    if (authStore.user || userStore.user) {
      // Sync if needed
      if (authStore.user && !userStore.user) {
        userStore.setUser(authStore.user)
      }
      return true
    }

    // No user in stores, try API fallback
    isLoading.value = true
    error.value = null

    try {
      const user = await getCurrentUserProfile()
      
      // Convert User to IUser format
      const iUser: IUser = {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
      
      // Update both stores
      authStore.setUser(iUser)
      userStore.setUser(iUser)
      
      return true
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      error.value = 'Không thể lấy thông tin user'
      
      // Redirect to login
      router.push('/login')
      return false
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    ensureUserData()
  })

  return {
    isLoading,
    error,
    ensureUserData
  }
}
