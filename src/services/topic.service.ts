import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs, query, orderBy, getDoc, doc, updateDoc } from 'firebase/firestore'
import {
  adaptTopicModelToTopic,
  type ITopic,
  type ITopicModel
} from '@/core/interfaces/model/topic'
import { ETopicTeam } from '@/core/constants/enum'
import api from './axios.service'
const db = useFirestore()

type GetTopicListParams = {
  team?: ETopicTeam
}

type GetTopicListResponse = {
  topics: ITopicModel[]
  total: number
  page: number
  totalPages: number
}

/**
 * Fetches a list of topics based on the provided parameters.
 *
 * @param {GetTopicListParams} params - The parameters to filter the topics by.
 * @returns {Promise<ITopic[]>} A promise that resolves to an array of ITopic objects.
 */
export const getTopicList = async (params: GetTopicListParams): Promise<ITopic[]> => {
  const openTopicList: ITopic[] = []
  try {
    const data = await api.get<GetTopicListResponse>('/api/topics', {
      params
    })
    return data.topics.map((item) => adaptTopicModelToTopic(item))
  } catch (err) {
    console.log('err', err)
    return openTopicList
  }
}

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

export const getTopicRef = (topicId: string) => {
  return doc(db, 'topics', topicId)
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
export const getTopicById = async (topicId: string): Promise<ITopic> => {
  // const docSnap = await getDoc(doc(db, 'topics', topicId))
  // if (docSnap.exists()) {
  //   return { ...docSnap.data(), id: docSnap.id, date: docSnap.data().date.toDate() } as ITopic
  // }
  // return undefined
  return adaptTopicModelToTopic(await api.get<ITopicModel>(`/api/topics/${topicId}`))
}
