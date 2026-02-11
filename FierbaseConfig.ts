import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Direct Firebase config (no .env)
const firebaseConfig = {
  apiKey: "AIzaSyDubdwHGYJZq6tztF4IeYDk38E3A-FQgQA",
  authDomain: "mybiz-universal-shop-manager.firebaseapp.com",
  projectId: "mybiz-universal-shop-manager",
  storageBucket: "mybiz-universal-shop-manager.firebasestorage.app",
  messagingSenderId: "769741315723",
  appId: "1:769741315723:web:a43219d7230b347e85fe8e",
  measurementId: "G-DXYHR06QBW",
};

// Prevent re-initialization in Expo
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
