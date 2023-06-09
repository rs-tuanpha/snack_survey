import { initializeApp } from 'firebase/app'
import { getFirestore, collection } from 'firebase/firestore'
// ... other firebase imports

export const firebaseApp = initializeApp({
    apiKey: "AIzaSyBh2DwRsqKF6eZcNzuL9qQUaBEdgFpcL9Q",
    authDomain: "smooth-verve-245207.firebaseapp.com",
    projectId: "smooth-verve-245207",
    storageBucket: "smooth-verve-245207.appspot.com",
    messagingSenderId: "216250815087",
    appId: "1:216250815087:web:458b5105165ef7c67c339a",
    measurementId: "G-5D815ZW3TL"
})

// used for the firestore refs
const db = getFirestore(firebaseApp)