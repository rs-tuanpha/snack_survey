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
  getDoc,
  orderBy,
  updateDoc,
  limit,
  writeBatch
} from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { uploadImageToFirebase } from './upload.service'

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

export const getRankByTopicId = async (topicId: string) => {
  const result = useCollection<IOption>(
    query(collection(db, 'options'), where('topicId', '==', topicId), orderBy('voteCount', 'desc'), limit(3))
  )
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
 * get option by id from firebase
 */
export const getOptionById = async (optionId: string): Promise<IOption> => {
  const docSnap = await getDoc(doc(db, 'options', optionId))
  return docSnap.data() as IOption
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
 * Batch deletes all options associated with a given topic ID from Firebase
 * @param {number} topicId - The ID of the topic whose options should be deleted
 * @throws {Error} If there is an error during the deletion process
 * @returns {Promise<void>} A promise that resolves when deletion is complete
 */

export const batchDeleteOptions = async (topicId: string): Promise<void> => {
  try {
    // Reference to the options collection
    const optionsRef = collection(db, 'options');
    
    // Create a query to get all documents with matching topicId
    const q = query(optionsRef,  where('topicId', '==', topicId));
    
    // Get all matching documents
    const querySnapshot = await getDocs(q);
    
    // Create a new batch
    const batch = writeBatch(db);
    
    // Add delete operations to batch
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // If there are no documents to delete, return early
    if (querySnapshot.empty) {
      console.log('No matching documents found');
      return;
    }
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Successfully deleted ${querySnapshot.size} documents`);
  } catch (error) {
    console.error('Error deleting documents:', error);
    throw error;
  }
};