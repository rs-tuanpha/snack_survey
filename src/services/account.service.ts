import type { IUser } from '@/core/interfaces/model/user'
import { db } from '@/plugins/firebase'
import { collection, getDocs, query } from 'firebase/firestore'

/**
 * get all account document in fb
 * @return { Promise<IUser[]>}
 */
export const getAllAccounts = async (): Promise<IUser[]> => {
  const snapshot = await getDocs(query(collection(db, 'accounts')))
  if (snapshot.docs) {
    const res = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as IUser[]
    return res
  } else {
    return []
  }
}
