import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  tier: 'free' | 'premium';
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => { throw new Error('Not initialized'); },
  signIn: async () => { throw new Error('Not initialized'); },
  signInWithGoogle: async () => { throw new Error('Not initialized'); },
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function getOrCreateProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || undefined,
    tier: 'free',
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, newProfile);
  return newProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getOrCreateProfile(user);
    setProfile(p);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getOrCreateProfile(firebaseUser);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const p = await getOrCreateProfile(cred.user);
    setProfile(p);
    return cred.user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await getOrCreateProfile(cred.user);
    setProfile(p);
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      // For now, implement a simple web-based Google OAuth
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=852963733478-7mvfga75t3ms7k1khhkh36g6oq4pesnj.apps.googleusercontent.com&` +
        `redirect_uri=${encodeURIComponent('https://jaiswals.live/api/auth/google/callback')}&` +
        `response_type=code&` +
        `scope=email%20profile&` +
        `access_type=offline`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'https://jaiswals.live/api/auth/google/callback');
      
      if (result.type === 'success') {
        // For now, create a mock user until we implement proper OAuth flow
        throw new Error('Google Sign-In requires web OAuth setup. Please use email sign-up for now.');
      }
      
      throw new Error('Google sign-in cancelled');
    } catch (error) {
      throw new Error('Google sign-in not available. Please use email sign-up.');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
