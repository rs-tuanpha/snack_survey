import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs, query, orderBy, getDoc, doc, updateDoc } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
import { ETopicTeam } from '@/core/constants/enum'
const db = useFirestore()

export const TOPIC_PAGE_SIZE = 5

const matchesTeam = (topicTeam: unknown, team: string | null) =>
  topicTeam == team || String(topicTeam).toUpperCase() === ETopicTeam.ALL

const toMillis = (value: unknown): number => {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const d = (value as { toDate: () => Date }).toDate()
    return d?.getTime?.() ?? 0
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000
  }
  return 0
}

const mapTopicDoc = (id: string, data: Record<string, unknown>): ITopic =>
  ({
    ...data,
    id,
    date: (data.date as { toDate?: () => Date })?.toDate?.() ?? data.date,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() ?? data.createdAt,
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() ?? data.updatedAt
  }) as ITopic

/** Open = status true and deadline still in the future (same rule as Home UI). */
const isTopicOpen = (topic: ITopic) => {
  const deadlineMs = toMillis(topic.date)
  return topic.status === true && deadlineMs > 0 && deadlineMs >= Date.now()
}

/** Open topics first, then by deadline date (newest first) within each group. */
const sortTopicsForHome = (a: ITopic, b: ITopic) => {
  const openDiff = Number(isTopicOpen(b)) - Number(isTopicOpen(a))
  if (openDiff !== 0) return openDiff
  return (
    toMillis(b.date) - toMillis(a.date) ||
    toMillis(b.createdAt) - toMillis(a.createdAt) ||
    toMillis(b.updatedAt) - toMillis(a.updatedAt)
  )
}

/** Sort by deadline date newest first (Admin list, closed fallbacks). */
export const sortTopicsByDateDesc = (a: ITopic, b: ITopic) =>
  toMillis(b.date) - toMillis(a.date) ||
  toMillis(b.createdAt) - toMillis(a.createdAt) ||
  toMillis(b.updatedAt) - toMillis(a.updatedAt)

/**
 * Full team-scoped topic list (same visibility rules as legacy open/close lists).
 * Team match is case-insensitive for ALL because Admin stores "All".
 * Order: open topics first, then by deadline date (newest first) within each group.
 */
export const getAllTopicsForTeam = async (team: string | null): Promise<ITopic[]> => {
  const snapshot = await getDocs(collection(db, 'topics'))
  const items: ITopic[] = []
  snapshot.forEach((d) => {
    const data = d.data()
    if (matchesTeam(data.team, team)) {
      items.push(mapTopicDoc(d.id, data))
    }
  })
  return items.sort(sortTopicsForHome)
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

/** Realtime topics list — call only from component setup (e.g. Admin). */
export const useTopics = () =>
  useCollection(query(collection(db, 'topics'), orderBy('updatedAt', 'desc')))

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
export const getTopicById = async (topicId: string): Promise<ITopic | undefined> => {
  const docSnap = await getDoc(doc(db, 'topics', topicId))
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id, date: docSnap.data().date.toDate() } as ITopic
  }
  return undefined
}
