import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  OAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { sendVerificationCode as apiSendVerificationCode, sendWelcomeEmail } from '../services/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  profileComplete: boolean;
}

interface VerificationState {
  code: string;
  expiresAt: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  verificationState: VerificationState | null;
  initiateSignUp: (email: string, name: string) => Promise<{ success: boolean; message: string }>;
  verifyCodeAndSignUp: (code: string, password: string) => Promise<{ success: boolean; message: string; emailExists?: boolean }>;
  resendVerificationCode: () => Promise<{ success: boolean; message: string }>;
  cancelVerification: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signInWithApple: (identityToken: string, nonce: string, fullName?: { givenName?: string; familyName?: string }) => Promise<{ success: boolean; message: string; needsProfile?: boolean }>;
  signInWithGoogle: (idToken: string) => Promise<{ success: boolean; message: string; needsProfile?: boolean }>;
  completeProfile: (firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationState, setVerificationState] = useState<VerificationState | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
      });
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          console.log('[AuthContext] Fetching user profile for:', firebaseUser.uid);
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            console.log('[AuthContext] Profile loaded:', {
              id: profileData.id,
              email: profileData.email,
              profileComplete: profileData.profileComplete,
            });
            setProfile(profileData);
          } else {
            console.log('[AuthContext] No profile found for user');
            setProfile(null);
          }
        } catch (error) {
          console.error('[AuthContext] Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        console.log('[AuthContext] User signed out, clearing profile');
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const initiateSignUp = async (email: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await apiSendVerificationCode(email, name);
      if (result.success && result.code && result.expiresAt) {
        await addDoc(collection(db, 'verifications'), {
          email,
          code: result.code,
          expiresAt: Timestamp.fromMillis(result.expiresAt),
        });
        setVerificationState({ code: result.code, expiresAt: result.expiresAt, email, name });
        return { success: true, message: 'Verification code sent to your email.' };
      }
      return { success: false, message: result.message || 'Failed to send verification code.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Something went wrong.' };
    }
  };

  const cancelVerification = () => {
    const email = verificationState?.email || null;
    setVerificationState(null);
    setPendingEmail(email);
  };

  const verifyCodeAndSignUp = async (code: string, password: string): Promise<{ success: boolean; message: string; emailExists?: boolean }> => {
    try {
      if (!verificationState) {
        return { success: false, message: 'No verification in progress.' };
      }

      const verificationsRef = collection(db, 'verifications');
      const q = query(
        verificationsRef,
        where('email', '==', verificationState.email),
        where('code', '==', code.trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: 'Invalid verification code.' };
      }

      const verificationDoc = querySnapshot.docs[0];
      const verificationData = verificationDoc.data();

      if (verificationData.expiresAt.toMillis() < Date.now()) {
        await deleteDoc(verificationDoc.ref);
        return { success: false, message: 'Verification code has expired. Please request a new one.' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, verificationState.email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: verificationState.name });

      const nameParts = verificationState.name.split(' ');
      const userProfile: UserProfile = {
        id: newUser.uid,
        email: newUser.email!,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        createdAt: new Date().toISOString(),
        profileComplete: false,
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);
      await deleteDoc(verificationDoc.ref);

      setProfile(userProfile);
      setVerificationState(null);

      return { success: true, message: 'Account created successfully!' };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists. Please sign in instead.', emailExists: true };
      }
      return { success: false, message: error.message || 'Sign up failed.' };
    }
  };

  const resendVerificationCode = async (): Promise<{ success: boolean; message: string }> => {
    if (!verificationState) {
      return { success: false, message: 'No verification in progress.' };
    }
    return initiateSignUp(verificationState.email, verificationState.name);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Welcome back!' };
    } catch (error: any) {
      let message = 'Sign in failed.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      return { success: false, message };
    }
  };

  const signInWithApple = async (
    identityToken: string,
    nonce: string,
    fullName?: { givenName?: string; familyName?: string }
  ): Promise<{ success: boolean; message: string; needsProfile?: boolean }> => {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const firstName = fullName?.givenName || '';
        const lastName = fullName?.familyName || '';
        const hasName = firstName.length > 0 || lastName.length > 0;

        const userProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
          profileComplete: hasName,
        };

        await setDoc(userDocRef, userProfile);
        setProfile(userProfile);

        const displayName = hasName ? `${firstName} ${lastName}`.trim() : firebaseUser.email!.split('@')[0];
        await sendWelcomeEmail(firebaseUser.email!, displayName);

        return { success: true, message: 'Account created!', needsProfile: !hasName };
      }

      const existingProfile = userDoc.data() as UserProfile;
      setProfile(existingProfile);
      return { success: true, message: 'Welcome back!', needsProfile: !existingProfile.profileComplete };
    } catch (error: any) {
      return { success: false, message: error.message || 'Apple sign in failed.' };
    }
  };

  const signInWithGoogle = async (idToken: string): Promise<{ success: boolean; message: string; needsProfile?: boolean }> => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const displayName = firebaseUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const hasName = firstName.length > 0;

        const userProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
          profileComplete: hasName,
        };

        await setDoc(userDocRef, userProfile);
        setProfile(userProfile);

        const name = hasName ? `${firstName} ${lastName}`.trim() : firebaseUser.email!.split('@')[0];
        await sendWelcomeEmail(firebaseUser.email!, name);

        return { success: true, message: 'Account created!', needsProfile: !hasName };
      }

      const existingProfile = userDoc.data() as UserProfile;
      setProfile(existingProfile);
      return { success: true, message: 'Welcome back!', needsProfile: !existingProfile.profileComplete };
    } catch (error: any) {
      return { success: false, message: error.message || 'Google sign in failed.' };
    }
  };

  const completeProfile = async (firstName: string, lastName: string, phone?: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) return { success: false, message: 'Not authenticated.' };

      const updates: Partial<UserProfile> = {
        firstName,
        lastName,
        profileComplete: true,
      };
      if (phone) updates.phone = phone;

      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      await sendWelcomeEmail(user.email!, `${firstName} ${lastName}`);

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      return { success: true, message: 'Profile updated!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update profile.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent.' };
    } catch (error: any) {
      return { success: false, message: 'Could not send reset email.' };
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        verificationState,
        initiateSignUp,
        verifyCodeAndSignUp,
        resendVerificationCode,
        cancelVerification,
        signIn,
        signInWithApple,
        signInWithGoogle,
        completeProfile,
        resetPassword,
        signOut: handleSignOut,
        pendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
