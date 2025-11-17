import type { IOption } from '@/core/interfaces/model/option'
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
import { uploadImageToFirebase } from './upload.service'
import type { IUser } from '@/core/interfaces/model/user'

/**
 * Get list option by topic id and order by title (ascending)
 * @param {string} topicId
 * @return {Promise<IOption[]>} options array with specific topicId
 */
export const getOptionsByTopicId = async (topicId: string): Promise<IOption[]> => {
  try {
    const q = query(
      collection(db, 'options'),
      where('topicId', '==', topicId),
      orderBy('title', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    })) as IOption[]
  } catch {
    alert('An error occurred when fetching options!')
    return []
  }
}

export const getRankByTopicId = (topicId: string) => {
  return query(
    collection(db, 'options'),
    where('topicId', '==', topicId),
    orderBy('voteCount', 'desc'),
    limit(3)
  )
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
export const postNewOption = async (
  title: string,
  link: string,
  topicId: string,
  image?: File | null
) => {
  try {
    let thumbnail = ''

    if (image) {
      thumbnail = (await uploadImageToFirebase(image)) || ''
    } else {
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
    return docref.firestore.toJSON()
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message)
    else throw e
  }
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
        const prevVoteBy = (prevOptionData.voteBy || []) as IUser[]
        const prevUserVoteIndex = prevVoteBy.findIndex((voter) => voter.id === currentUser.id)

        if (prevUserVoteIndex !== -1) {
          prevVoteBy.splice(prevUserVoteIndex, 1)
          transaction.update(prevOptionRef, {
            voteBy: prevVoteBy,
            voteCount: prevOptionData.voteCount - 1
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
    const voteBy = (optionData.voteBy || []) as IUser[]
    const userVoteIndex = voteBy.findIndex((voter) => voter.id === currentUser.id)

    if (userVoteIndex === -1) {
      voteBy.push(currentUser)
      transaction.update(optionRef, {
        voteBy,
        voteCount: optionData.voteCount + 1
      })
    }
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
    const voteBy = (optionData.voteBy || []) as IUser[]
    const userVoteIndex = voteBy.findIndex((voter) => voter.id === currentUser.id)

    if (userVoteIndex !== -1) {
      // Unvote
      voteBy.splice(userVoteIndex, 1)
      transaction.update(optionRef, {
        voteBy,
        voteCount: optionData.voteCount - 1
      })
    } else {
      // Vote
      voteBy.push(currentUser)
      transaction.update(optionRef, {
        voteBy,
        voteCount: optionData.voteCount + 1
      })
    }
  })
}
