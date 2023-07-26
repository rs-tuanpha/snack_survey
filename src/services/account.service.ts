import { collection, doc, getDoc } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'

/**
 * get all account document in fb
 * @return { Promise<IUser[]>}
 */
export const getAccounts = useCollection<IUser>(collection(db, 'accounts'))

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
