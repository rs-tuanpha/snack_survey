import type { IOption } from '@/core/interfaces/model/option'
import type { IOptionLibrary } from '@/core/interfaces/model/optionLibrary'
import { fetchDOMMetadata, fetchOpenGraphMetadata } from '@/core/utils/metadata'
import { db } from '@/plugins/firebase'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  limit,
  runTransaction
} from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { uploadImageToFirebase } from './upload.service'
import { upsertOptionLibrary } from './optionLibrary.service'
import type { IUser } from '@/core/interfaces/model/user'
import { findVoterIndex, uniqueVoters } from '@/core/utils/voter'

/**
 * Get list option by topic id and order by voteCount (descending)
 * @param {string} topicId
 * @return options collection with specific topicId
 */
export const getOptionsByTopicId = async (topicId: string) => {
  const result = useCollection<IOption>(
    query(collection(db, 'options'), where('topicId', '==', topicId), orderBy('title', 'asc'))
  )
  return result
}

export const getRankByTopicId = (topicId: string) => {
  return query(
    collection(db, 'options'),
    where('topicId', '==', topicId),
    orderBy('voteCount', 'desc'),
    limit(3)
  )
}

const FIRESTORE_IN_LIMIT = 30

const mapOptionDoc = (d: { id: string; data: () => Record<string, unknown> }): IOption => {
  const data = d.data()
  const voteBy = uniqueVoters((data.voteBy as IUser[]) || [])
  return { ...data, id: d.id, voteBy, voteCount: voteBy.length } as IOption
}

/**
 * Options belonging to the given topic ids (chunked Firestore `in` queries).
 */
export const getOptionsByTopicIds = async (topicIds: string[]): Promise<IOption[]> => {
  const uniqueIds = [...new Set(topicIds.filter(Boolean))]
  if (!uniqueIds.length) return []

  const results: IOption[] = []
  for (let i = 0; i < uniqueIds.length; i += FIRESTORE_IN_LIMIT) {
    const chunk = uniqueIds.slice(i, i + FIRESTORE_IN_LIMIT)
    const snapshot = await getDocs(query(collection(db, 'options'), where('topicId', 'in', chunk)))
    snapshot.docs.forEach((d) => results.push(mapOptionDoc(d)))
  }
  return results
}

/**
 * Get list all options
 * @param {}
 * @return {Promise<IOption[]>}
 */
export const getAllOptions = async (): Promise<IOption[]> => {
  const snapshot = await getDocs(query(collection(db, 'options')))
  if (snapshot.docs) {
    const res = snapshot.docs.map((d) => mapOptionDoc(d)) as IOption[]
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
 * @param image optional upload file
 * @param existingThumbnail skip OG fetch when cloning from library
 */
export const postNewOption = async (
  title: string,
  link: string,
  topicId: string,
  image?: File | null,
  existingThumbnail?: string | null
) => {
  try {
    let thumbnail = ''

    if (image) {
      thumbnail = (await uploadImageToFirebase(image)) || ''
    } else if (existingThumbnail) {
      thumbnail = existingThumbnail
    } else if (link) {
      const metadata = (await fetchOpenGraphMetadata(link)) || (await fetchDOMMetadata(link))
      thumbnail = metadata?.image || ''
    }
    const docref = await addDoc(collection(db, 'options'), {
      title,
      link,
      topicId,
      thumbnail,
      voteBy: [],
      voteCount: 0
    })
    await upsertOptionLibrary(title, link, thumbnail)
    return docref.firestore.toJSON()
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

const isDuplicateInTopic = (item: { title: string; link: string }, existing: IOption[]) => {
  const title = (item.title || '').trim()
  const link = (item.link || '').trim()
  return existing.some((option) => {
    if (link && option.link && option.link.trim() === link) return true
    if (!link && title && option.title?.trim() === title) return true
    return false
  })
}

/**
 * Clone selected library items into a topic (skips duplicates).
 */
export const postOptionsFromLibrary = async (
  items: IOptionLibrary[],
  topicId: string,
  existing: IOption[]
) => {
  let added = 0
  let skipped = 0
  for (const item of items) {
    if (isDuplicateInTopic(item, existing)) {
      skipped += 1
      continue
    }
    await postNewOption(item.title, item.link, topicId, null, item.thumbnail)
    existing.push({
      id: '',
      title: item.title,
      link: item.link,
      topicId,
      voteBy: [],
      voteCount: 0,
      thumbnail: item.thumbnail
    })
    added += 1
  }
  return { added, skipped }
}

/**
 * handle update voteBy and voteCount of Option
 * @param newOptionList
 * @returns 1 on success,
 */
export const voteOption = async (newOptionList: IOption[]) => {
  try {
    newOptionList.forEach((option) => {
      updateDoc(doc(db, 'options', option.id), {
        voteBy: option.voteBy,
        voteCount: option.voteCount
      })
    })
    return 1
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
}

/**
 * get option ref by id from firebase
 */
export const getOptionsRefById = (optionId: string) => {
  return query(collection(db, 'options'), where('topicId', '==', optionId), orderBy('title', 'asc'))
}

/**
 * update option data to firebase
 * @param {IOption} option
 */
export const putOptionData = async (option: IOption) => {
  const topicRef = doc(db, 'options', option.id)
  return await updateDoc(topicRef, { ...option })
}

/**
 * Handle single vote mode - user can only vote for one option
 * @param optionId - ID of the option to vote for
 * @param currentUserId - ID of the current user
 * @param previousOptionId - ID of the previously voted option (if any)
 * @returns Promise<void>
 */
export const handleSingleVote = async (
  optionId: string,
  currentUser: IUser,
  previousOptionId: string | null
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    // Handle previous vote if exists
    if (previousOptionId) {
      const prevOptionRef = doc(db, 'options', previousOptionId)
      const prevOptionDoc = await transaction.get(prevOptionRef)

      if (prevOptionDoc.exists()) {
        const prevOptionData = prevOptionDoc.data()
        const prevVoteBy = uniqueVoters((prevOptionData.voteBy || []) as IUser[])
        const prevUserVoteIndex = findVoterIndex(prevVoteBy, currentUser)

        if (prevUserVoteIndex !== -1) {
          prevVoteBy.splice(prevUserVoteIndex, 1)
          transaction.update(prevOptionRef, {
            voteBy: prevVoteBy,
            voteCount: prevVoteBy.length
          })
        }
      }
    }

    // Handle new vote
    const optionRef = doc(db, 'options', optionId)
    const optionDoc = await transaction.get(optionRef)

    if (!optionDoc.exists()) {
      throw new Error('Option không tồn tại')
    }

    const optionData = optionDoc.data()
    const voteBy = uniqueVoters((optionData.voteBy || []) as IUser[])
    const userVoteIndex = findVoterIndex(voteBy, currentUser)

    if (userVoteIndex === -1) {
      voteBy.push(currentUser)
    } else {
      // Replace legacy duplicate identity with current account snapshot
      voteBy[userVoteIndex] = currentUser
    }
    transaction.update(optionRef, {
      voteBy,
      voteCount: voteBy.length
    })
  })
}

/**
 * Handle multiple vote mode - user can vote for multiple options
 * @param optionId - ID of the option to vote for
 * @param currentUserId - ID of the current user
 * @returns Promise<void>
 */
export const handleMultipleVote = async (optionId: string, currentUser: IUser): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const optionRef = doc(db, 'options', optionId)
    const optionDoc = await transaction.get(optionRef)

    if (!optionDoc.exists()) {
      throw new Error('Option không tồn tại')
    }

    const optionData = optionDoc.data()
    const voteBy = uniqueVoters((optionData.voteBy || []) as IUser[])
    const userVoteIndex = findVoterIndex(voteBy, currentUser)

    if (userVoteIndex !== -1) {
      // Unvote
      voteBy.splice(userVoteIndex, 1)
    } else {
      // Vote
      voteBy.push(currentUser)
    }
    transaction.update(optionRef, {
      voteBy,
      voteCount: voteBy.length
    })
  })
}
