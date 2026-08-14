import type { Router } from 'vue-router'
import { requireAuthAccount } from '@/services/auth.service'

/** Home stays public (shows login). Everything else requires Firebase Auth. */
const PUBLIC_ROUTE_NAMES = new Set(['home', 'app'])

const checkAuth = (router: Router) => {
  router.beforeEach(async (to, _from, next) => {
    if (!to.name || PUBLIC_ROUTE_NAMES.has(String(to.name))) {
      next()
      return
    }

    const account = await requireAuthAccount()
    if (!account) {
      next({ name: 'home' })
      return
    }

    next()
  })
}

export default checkAuth
