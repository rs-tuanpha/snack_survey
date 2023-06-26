import type { IOption } from '@/core/interfaces/model/option'
import { db } from '@/plugins/firebase'
import { addDoc, collection, doc, getDocs, query, setDoc, where, getDoc } from 'firebase/firestore'

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
    const docref = await addDoc(collection(db, 'options'), { title, link, topicId, voteBy: [] })
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
