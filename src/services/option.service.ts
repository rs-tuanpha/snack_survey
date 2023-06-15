import type { IOption } from '@/core/interfaces/model/option'
import { db } from '@/plugins/firebase'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'

/**
 * Get list option by topic id
 * @param {string} topicId
 * @return {Promise<IOption[]>}
 */
export const getOptionsByTopicId = async (topicId: string): Promise<IOption[]> => {
  const snapshot = await getDocs(query(collection(db, 'options'), where('topicId', '==', topicId)))
  if (snapshot.docs) {
    const res = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as IOption[]
    return res
  } else {
    return []
  }
}

/**
 * create new option
 * @param {string} title
 * @param {string} link
 * @param {string} topicId
 */
export const postNewOption = async (title: string, link: string, topicId: string) => {
  try {
    const docref = await addDoc(collection(db, 'options'), { title, link, topicId, voteBy: [] })
    return docref.firestore.toJSON()
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}
