import type { Router } from 'vue-router'
import Cookies from 'js-cookie'
import { useUserStore } from '@/stores/user'
import { getAccountList } from '@/services/account.service'

const checkAuth = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    const token = Cookies.get('auth_token')
    const isFirstLogin = Cookies.get('is_first_login')
    const isLoginPage = to.path === '/login'
    const isResetPasswordPage = to.path === '/change_password'
    const userStore = useUserStore()

    // If trying to access protected page without token, redirect to login
    if (!isLoginPage && !token) {
      next('/login')
      return
    }

    // If user has isFirstLogin flag and tries to access any page except change_password,
    // redirect to change_password
    if (isFirstLogin && !isResetPasswordPage && token) {
      next('/change_password')
      return
    }

    if (token && !userStore.getUser) {
      const id = Cookies.get('account_id')
      const email = Cookies.get('account_email')
      const username = Cookies.get('account_username')
      const avatar = Cookies.get('account_avatar') ?? ''
      const team = Cookies.get('account_team') ?? ''

      userStore.setUser({
        id,
        email,
        username,
        avatar,
        team
      })
    }

    if (token && userStore.getUserList.length == 0) {
      try {
        const data = await getAccountList()
        userStore.setUserList(data)
      } catch (error) {
        console.error(error)
      }
    }

    // Otherwise, proceed normally
    next()
  })

  router.afterEach((to, from) => {
    // You can add analytics or other after-navigation logic here
  })
}

export default checkAuth
