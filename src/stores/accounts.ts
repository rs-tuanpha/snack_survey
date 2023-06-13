import { ref } from 'vue'
import { defineStore } from 'pinia'

// import { db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'
import { useCommonStore } from './_common'
import { getAllAccounts } from '@/services/account.service'

export const useAccountsStore = defineStore('accounts', () => {
  const common = useCommonStore()
  const currentUser = ref<IUser | undefined>(undefined)
  const accounts = ref<IUser[]>([])

  const loadAccounts = async () => {
    common.setLoading(true)
    const res = await getAllAccounts()
    accounts.value = res

    common.setLoading(false)
  }

  const setCurrentUser = (user: IUser) => {
    common.setLoading(true)
    currentUser.value = user
    common.setLoading(false)
  }

  return {
    accounts,
    currentUser,
    loadAccounts,
    setCurrentUser
  }
})
