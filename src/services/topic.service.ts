import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
const db = useFirestore()
/**
 * Get list topic data
 * @return {Promise<ITopic[]>}
 */

export const getOpenTopicList = async (team: string | null): Promise<ITopic[]> => {
  const querySnapshot = await getDocs(collection(db, 'topics'))
  const openTopicList: ITopic[] = []
  querySnapshot.forEach((doc) => {
    const info = doc.data()
    if (
      info.status &&
      (info.team == team || info.team == 'All') &&
      info.date.toDate() >= new Date()
    ) {
      const topic = { id: doc.id, name: info.name, description: info.description, team: info.team }
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
  const docSnap = await getDoc(doc(db, "topics", topicId));
  if(docSnap.exists()) {
    return {...docSnap.data(), id: docSnap.id} as ITopic;
  }
  return undefined;
}