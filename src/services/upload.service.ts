import { storage } from '@/plugins/firebase/storage'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const uploadImageToFirebase = async (file: File): Promise<string | null> => {
  try {
    console.log('Uploading image to Firebase...', import.meta.env.VUE_APP_STORAGE_BUCKET)
    const storageRef = ref(storage, `uploads/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}
