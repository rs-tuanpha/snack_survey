/**
 * Firebase Storage configuration and utilities
 * This file contains only Firebase Storage logic for file uploads
 */
import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

// Firebase app configuration
const firebaseApp = initializeApp({
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASURE_MEMBER_ID
})

// Export only Firebase Storage instance
export const storage = getStorage(firebaseApp)
export { firebaseApp }
