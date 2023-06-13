import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'
import { reactive } from 'vue'
import type { ITopic } from '@/core/interfaces/model/topic'

const db = useFirestore()
export const useTopicStore = defineStore({
  id: 'topic',
  state: () => ({
    openTopicList: reactive<ITopic[]>([])
  }),
  getters: {
    openList: (state) => state.openTopicList.filter((topic) => topic.status === 'open'),
    accountList: () => {
      return useCollection(collection(db, 'accounts'))
    }
  },
  actions: {
    getOpenTopicList() {
      const res = useCollection<ITopic>(collection(db, 'topics'))
      this.openTopicList = res.value
    }
  }
})
