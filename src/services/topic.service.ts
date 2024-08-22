import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
import { ETopicTeam } from '@/core/constants/enum'
const db = useFirestore()

/**
 * Get list topic data status open
 * @return {Promise<ITopic[]>}
 */
export const getOpenTopicList = async (team: string | null): Promise<ITopic[]> => {
  const querySnapshot = await getDocs(collection(db, 'topics'))
  const openTopicList: ITopic[] = []
  querySnapshot.forEach((doc) => {
    const info = doc.data()
    if (
      info.status &&
      (info.team == team || String(info.team).toUpperCase() === ETopicTeam.ALL) &&
      info.date.toDate() >= new Date()
    ) {
      const topic = { ...info, id: doc.id } as ITopic
      openTopicList.push(topic)
    }
  })
  return openTopicList
}

/**
 * Get list topic data status close
 * @return {Promise<ITopic[]>}
 */
export const getCloseTopicList = async (team: string | null): Promise<ITopic[]> => {
  const querySnapshot = await getDocs(collection(db, 'topics'))
  const openTopicList: ITopic[] = []
  querySnapshot.forEach((doc) => {
    const info = doc.data()
    if (!info.status && (info.team == team || String(info.team).toUpperCase() === ETopicTeam.ALL)) {
      const topic = { ...info, id: doc.id } as ITopic
      openTopicList.push(topic)
    }
  })
  return openTopicList
}

export const getTopics = useCollection(
  query(collection(db, 'topics'), orderBy('updatedAt', 'desc'))
)

/**
 * service get topic from firebase
 * @param {string} topicId
 * @return {Promise<ITopic | undefined>}
 */
export const getTopicById = async (topicId: string): Promise<ITopic | undefined> => {
  const docSnap = await getDoc(doc(db, 'topics', topicId))
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id, date: docSnap.data().date.toDate() } as ITopic
  }
  return undefined
}
