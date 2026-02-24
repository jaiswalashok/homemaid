"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, SubscriptionTier } from "./subscription";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => { throw new Error("Not initialized"); },
  signIn: async () => { throw new Error("Not initialized"); },
  signInWithGoogle: async () => { throw new Error("Not initialized"); },
  signInWithApple: async () => { throw new Error("Not initialized"); },
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function getOrCreateProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // Create new profile for first-time users
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || undefined,
    emailVerified: user.emailVerified,
    tier: "free" as SubscriptionTier,
    familyMembers: [
      {
        id: user.uid,
        name: user.displayName || "Me",
        email: user.email || undefined,
        role: "admin",
        addedAt: new Date().toISOString(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    try {
      const p = await getOrCreateProfile(user);
      setProfile(p);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getOrCreateProfile(firebaseUser);
          setProfile(p);
        } catch (err) {
          console.error("Failed to load profile:", err);
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
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const p = await getOrCreateProfile(cred.user);
    setProfile(p);
    return cred.user;
  };

  const signInWithApple = async (): Promise<User> => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const cred = await signInWithPopup(auth, provider);
    const p = await getOrCreateProfile(cred.user);
    setProfile(p);
    return cred.user;
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
        signInWithApple,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
