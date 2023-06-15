import { useFirestore, useCollection } from 'vuefire'
import { collection, getDocs } from 'firebase/firestore'
import type { ITopic } from '@/core/interfaces/model/topic'
const db = useFirestore();
/**
 * Get list topic data
 * @return {Promise<ITopic[]>}
 */

export const getOpenTopicList = async (): Promise<ITopic[]> => {
    const querySnapshot = await getDocs(collection(db, "topics"));
    const openTopicList : ITopic[] = [];
    querySnapshot.forEach((doc) => {
      const info = doc.data();
      if(info.status) {
        const topic =  {'id' : doc.id, 'name' : info.name, 'description' : info.description};
        openTopicList.push(topic);
      }
    });
    return openTopicList;
}

export const getTopics = useCollection(collection(db, 'topics'));
