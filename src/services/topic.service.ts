import type { ITopic } from '@/core/interfaces/model/topic'
import { db } from '@/plugins/firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * Find and return a topic in firestore
 * throw error if not found
 * @param {string} id
 * @return {Promise<ITopic>}
 */
export const getTopicById = async (id: string): Promise<ITopic> => {
  try {
    const docRef = doc(db, 'topics', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ITopic
    } else {
      throw new Error('401')
    }
  } catch (e: any) {
    throw new Error(e)
  }
}
