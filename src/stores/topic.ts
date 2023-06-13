import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'
const db = useFirestore()
export const useTopicStore = defineStore({
	id: 'topic',
	state: () => ({
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
