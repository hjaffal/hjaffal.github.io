import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAc7rsjmMeWjR5AzBEOWZfFzRjOQdNZtoQ",
  authDomain: "hasanjaffal.firebaseapp.com",
  projectId: "hasanjaffal",
  storageBucket: "hasanjaffal.firebasestorage.app",
  messagingSenderId: "760741109890",
  appId: "1:760741109890:web:4a6e52899d4056940f949b",
  measurementId: "G-MECDTY85Q5"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "europe-west1");

// Uncomment for local testing:
// connectFunctionsEmulator(functions, "localhost", 5001);

export const sendFutureProofSkillsGuide = httpsCallable(functions, "sendFutureProofSkillsGuide");
