import type { IOption } from '@/core/interfaces/model/option'
import { db } from '@/plugins/firebase'
import { addDoc, collection, doc, getDocs, query, setDoc, where, getDoc, orderBy } from 'firebase/firestore'
import { useCollection } from 'vuefire'

/**
 * Get list option by topic id and order by voteCount (descending)
 * @param {string} topicId
 * @return options collection with specific topicId
 */
export const getOptionsByTopicId = async (topicId: string) => {
  const result = useCollection(
    query(collection(db, 'options'), where('topicId', '==', topicId), orderBy('voteCount', 'desc')))
  return result
}

/**
 * Get list all options
 * @param {}
 * @return {Promise<IOption[]>}
 */
export const getAllOptions = async (): Promise<IOption[]> => {
  const snapshot = await getDocs(query(collection(db, 'options')))
  if (snapshot.docs) {
    const res = snapshot.docs.map((doc) => ({ ...doc.data() })) as IOption[]
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
    const docref = await addDoc(collection(db, 'options'), { title, link, topicId, voteBy: [], voteCount: 0 })
    return docref.firestore.toJSON()
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

export const voteOption = async (newOptionList: IOption[]) => {
  try {
    newOptionList.forEach((option) => {
      setDoc(doc(db, 'options', option.id), option)
    })
    return 1;
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

export const getOptionById = async (optionId: string): Promise<IOption> => {
  const docSnap = await getDoc(doc(db, "options", optionId));
  return docSnap.data() as IOption;
}
