import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const apiKey = import.meta.env.VUE_APP_API_KEY
const authDomain = import.meta.env.VUE_APP_AUTH_DOMAIN
const projectId = import.meta.env.VUE_APP_PROJECT_ID
const storageBucket = import.meta.env.VUE_APP_STORAGE_BUCKET
const messagingSenderId = import.meta.env.VUE_APP_MESSAGING_SENDER_ID
const appId = import.meta.env.VUE_APP_APP_ID
const measurementId = import.meta.env.VUE_APP_MEASURE_MEMBER_ID

export const firebaseApp = initializeApp({
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
})

// used for the firestore refs
export const db = getFirestore(firebaseApp)
