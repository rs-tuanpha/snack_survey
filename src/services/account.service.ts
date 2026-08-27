import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'

/**
 * One-shot fetch of all accounts.
 */
export const fetchAccounts = async (): Promise<IUser[]> => {
  const snapshot = await getDocs(collection(db, 'accounts'))
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as IUser)
}

/**
 * get one account by id
 * @return { Promise<IUser | null> }
 */
export const getAccountById = async (accountId: string): Promise<IUser | null> => {
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

/**
 * get account by email
 * @return { Promise<IUser | null> }
 */
export const getAccountByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const q = query(collection(db, 'accounts'), where('email', '==', email))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0]
      return { ...docSnap.data(), id: docSnap.id } as IUser
    }
    return null
  } catch {
    return null
  }
}
