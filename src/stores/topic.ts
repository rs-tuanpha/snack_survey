import { defineStore } from 'pinia'
// export const useAlertsStore = defineStore('alerts', {
//     // other options...
//   })
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'

const db = useFirestore()
// const users = useCollection(collection(db, 'accounts'))
const topics = useCollection(collection(db, 'topics'))
//console.log(topics)
  export const useTopicStore = defineStore({
    id: 'topic',
    state: () => ({
        count: 0,
        openTopicList: {}
    }),
    getters: {
        openList: () => {
            return useCollection(collection(db, 'topics'));
        },
        accountList: () => {
            return useCollection(collection(db, 'accounts'))
        }
    },
    actions: {
        getOpenTopicList() {
            this.openTopicList = useCollection(collection(db, 'topics'));
        }
    }
})