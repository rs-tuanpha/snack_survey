import { collection, getDocs, query, orderBy, getDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/plugins/firebase'
import type { ITopic } from '@/core/interfaces/model/topic'
import { ETopicTeam } from '@/core/constants/enum'

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

/**
 * Get all topics ordered by updatedAt (descending)
 * @return {Promise<ITopic[]>}
 */
export const getTopics = async (): Promise<ITopic[]> => {
  try {
    const q = query(collection(db, 'topics'), orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      } as ITopic
    })
  } catch {
    alert('An error occurred when fetching topics!')
    return []
  }
}

export const getTopicRef = (topicId: string) => {
  return doc(db, 'topics', topicId);
}
/** Update topic firebase data by id */
export const updateTopic = async (topicId: string, topicInfo: ITopic) => {
  try {
    const topicRef = doc(db, 'topics', topicId)
    await updateDoc(topicRef, topicInfo as object)
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message)
    }
  }
}

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
