import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/plugins/firebase'
import type { IUser } from '@/core/interfaces/model/user'
import { getAccountByEmail } from './account.service'
import { THEME_STORAGE_KEY } from '@/core/theme/themes'
import { ALLOWED_EMAIL_DOMAIN } from '@/core/constants/app'
import { isAllowedEmailDomain } from '@/core/utils/regexValidate'

export class EmailDomainError extends Error {
  constructor(message = `Chỉ chấp nhận email @${ALLOWED_EMAIL_DOMAIN}`) {
    super(message)
    this.name = 'EmailDomainError'
  }
}

const ACCOUNT_STORAGE_KEYS = [
  'account_info',
  'account_avatar',
  'account_username',
  'account_team',
  'isResetAccount'
] as const

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Clears legacy localStorage account session. Keeps theme preference. */
export const clearAccountStorage = (): void => {
  for (const key of ACCOUNT_STORAGE_KEYS) {
    localStorage.removeItem(key)
  }
}

/** Clears everything except theme (used on logout). */
export const clearSessionStorage = (): void => {
  const theme = localStorage.getItem(THEME_STORAGE_KEY)
  localStorage.clear()
  if (theme) localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/** Resolves once Firebase Auth finishes restoring the persisted session. */
export const waitForAuthUser = (): Promise<User | null> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })

/**
 * Require a Firebase Auth session. If missing, clear legacy account storage.
 * Returns the Firestore account when Auth + accounts doc both exist.
 */
export const requireAuthAccount = async (): Promise<IUser | null> => {
  const fbUser = await waitForAuthUser()
  if (!fbUser?.email || !isAllowedEmailDomain(fbUser.email)) {
    if (fbUser) await fbSignOut(auth)
    clearAccountStorage()
    return null
  }
  const account = await getAccountByEmail(normalizeEmail(fbUser.email))
  if (!account) {
    await fbSignOut(auth)
    clearAccountStorage()
    return null
  }
  return account
}

export const signIn = async (email: string, password: string): Promise<IUser | null> => {
  const normalized = normalizeEmail(email)
  if (!isAllowedEmailDomain(normalized)) throw new EmailDomainError()
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
  if (!isAllowedEmailDomain(normalized)) throw new EmailDomainError()
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
  const normalized = normalizeEmail(email)
  if (!isAllowedEmailDomain(normalized)) throw new EmailDomainError()
  await sendPasswordResetEmail(auth, normalized)
}

export const signOut = async (): Promise<void> => {
  await fbSignOut(auth)
  clearSessionStorage()
}

export const getCurrentAuthUser = () => auth.currentUser
