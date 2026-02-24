import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available in firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logFirebase } from '../utils/logger';

const extra = Constants.expoConfig?.extra ?? {};

logFirebase.debug('Loading config from Constants', {
  hasApiKey: !!extra.firebaseApiKey,
  hasProjectId: !!extra.firebaseProjectId,
  hasAppId: !!extra.firebaseAppId,
});

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
  measurementId: extra.firebaseMeasurementId,
};

logFirebase.info('Initializing Firebase', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

logFirebase.info('Firebase app initialized');

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

logFirebase.info('Auth initialized with AsyncStorage persistence');

const db = getFirestore(app);
const storage = getStorage(app);

logFirebase.info('Firestore and Storage initialized');

export { app, auth, db, storage };
