import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'
import { getAccountByEmail } from './account.service'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const signIn = async (email: string, password: string): Promise<IUser | null> => {
  const normalized = normalizeEmail(email)
  const credential = await signInWithEmailAndPassword(auth, normalized, password)
  const user = credential.user
  const account = await getAccountByEmail(user.email ?? normalized)
  return account
}

export const signUp = async (
  username: string,
  email: string,
  password: string
): Promise<IUser | null> => {
  const normalized = normalizeEmail(email)
  const credential = await createUserWithEmailAndPassword(auth, normalized, password)
  const uid = credential.user.uid
  const account: IUser = {
    id: uid,
    username: username.trim(),
    email: normalized,
    avatar: '',
    team: ''
  }
  await setDoc(doc(db, 'accounts', uid), account)
  return account
}

/** Sends Firebase password-reset email. Always resolves for valid email format. */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, normalizeEmail(email))
}

export const signOut = async (): Promise<void> => {
  await fbSignOut(auth)
}

export const getCurrentAuthUser = () => auth.currentUser
