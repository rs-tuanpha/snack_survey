import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
const db = useFirestore()
export const useTopicStore = defineStore({
  id: 'topic',
  state: () => ({
    openTopicList: <ITopic[]>([])
  }),
  getters: {
    resOpenTopicList: (state) => {
      return state.openTopicList;
    },
    accountList: () => {
      return useCollection(collection(db, 'accounts'))
    },
    topicList: () => {
      return useCollection(collection(db, 'topics'))
    }
  },
  actions: {
    async getOpenTopicList() {
      const querySnapshot = await getDocs(collection(db, "topics"));
      querySnapshot.forEach((doc) => {
        const info = doc.data();
        if(info.status) {
          const topic =  {'id' : doc.id, 'name' : info.name, 'description' : info.description};
          this.openTopicList.push(topic);
        }
      });
    }
  }
})
