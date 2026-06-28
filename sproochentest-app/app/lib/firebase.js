import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAc7rsjmMeWjR5AzBEOWZfFzRjOQdNZtoQ",
  authDomain: "hasanjaffal.firebaseapp.com",
  projectId: "hasanjaffal",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
