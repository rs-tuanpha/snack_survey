import type { IUser } from '@/core/interfaces/model/user'
import { db } from '@/plugins/firebase'
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore'

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

export const getAccountById = async (accountId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'accounts', accountId))
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as IUser
    } else {
      // docSnap.data() will be undefined in this case
      alert('Account invalid, please login again!')
      return null
    }
  } catch {
    alert('An Error occure when fetching data!')
    return null
  }
}
