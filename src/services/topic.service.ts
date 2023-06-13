import type { ITopic } from '@/core/interfaces/model/topic'
import { db } from '@/plugins/firebase'
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore'

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
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

/**
 * Get all topic from fb
 */
export const getAllTopics = async (): Promise<ITopic[]> => {
  const snapshot = await getDocs(query(collection(db, 'topics')))
  if (snapshot.docs) {
    const res = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ITopic[]
    return res
  } else {
    return []
  }
}
