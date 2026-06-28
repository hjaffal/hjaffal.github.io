import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAc7rsjmMeWjR5AzBEOWZfFzRjOQdNZtoQ",
  authDomain: "hasanjaffal.firebaseapp.com",
  projectId: "hasanjaffal",
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Auth — use getAuth if already initialized (hot reload safe)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized
  auth = getAuth(app);
}
export { auth };
