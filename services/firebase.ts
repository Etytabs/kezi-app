import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "kezi-b50f9.firebaseapp.com",
  projectId: "kezi-b50f9",
  storageBucket: "kezi-b50f9.firebasestorage.app",
  messagingSenderId: "1018751213386",
  appId: "1:1018751213386:web:904af3fe0a45706e1b2bb3"
 };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
