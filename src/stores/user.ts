import type { IUser } from '@/core/interfaces/model/user'
import { defineStore } from 'pinia'

interface IUserState {
  user: IUser | null
  userList: IUser[]
}

const initState: IUserState = {
  user: null,
  userList: []
}

export const useUserStore = defineStore('user', {
  state: (): IUserState => {
    return { ...initState }
  },
  getters: {
    getUser: (state) => state.user,
    getUserList: (state) => state.userList
  },
  actions: {
    setUser(data: IUser) {
      this.user = data
    },
    setUserList(data: IUser[]) {
      this.userList = data
    }
  }
})
