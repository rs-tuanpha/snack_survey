import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'
const db = useFirestore();
export const getAccounts = useCollection(collection(db, 'accounts'));
