import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDG8DERJYft9tsWUO4HuiWSNlBASxZn_oM",
  authDomain: "homemaid-f7a6e.firebaseapp.com",
  projectId: "homemaid-f7a6e",
  storageBucket: "homemaid-f7a6e.firebasestorage.app",
  messagingSenderId: "852963733478",
  appId: "1:852963733478:web:d20626e0a5b61732bff027",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function getOrInitAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = getOrInitAuth();
export const db = getFirestore(app);
export default app;
