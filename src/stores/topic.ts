import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
const db = useFirestore()
export const useTopicStore = defineStore({
  id: 'topic',
  state: () => ({
    openTopicList: []
  }),
  getters: {
    resOpenTopicList: (state) => {
      return state.openTopicList;
    },
    accountList: () => {
      return useCollection(collection(db, 'accounts'))
    }
  },
  actions: {
    async getOpenTopicList() {
      const querySnapshot = await getDocs(collection(db, "topics"));
      querySnapshot.forEach((doc) => {
        const info = doc.data();
        const topic = {'id' : doc.id, 'name' : info.name, 'description' : info.description};
        this.openTopicList.push(topic);
      });
    }
  }
})
