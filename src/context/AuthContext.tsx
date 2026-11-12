import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: 'freelancer' | 'client'
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemo: (role?: 'freelancer' | 'client') => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Initialize default profile if it doesn't exist yet
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              email: currentUser.email || 'client@assetsilo.app',
              displayName: currentUser.displayName || 'Asset Creator',
              role: 'freelancer',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not fetch user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'The email or password you entered is incorrect. Please double check and try again.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account was found with this email. You can create a new account in seconds.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Your password is too short. Please choose a password with at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'The sign-in popup was closed. Please try again.';
    }
    return err?.message || 'An unexpected error occurred. Please try again.';
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: 'freelancer' | 'client'
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const newProfile: UserProfile = {
        userId: cred.user.uid,
        email: cred.user.email || email,
        displayName: displayName || (role === 'freelancer' ? 'Lead Designer' : 'Client Reviewer'),
        role,
        createdAt: new Date().toISOString(),
      };

      const userPath = `users/${cred.user.uid}`;
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, userPath);
      }

      setProfile(newProfile);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Google User',
          role: 'freelancer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(snap.data() as UserProfile);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      throw err;
    }
  };

  // Demo sign-in enables instant evaluation of the portal
  const signInDemo = async (role: 'freelancer' | 'client' = 'freelancer') => {
    setError(null);
    const demoEmail =
      role === 'freelancer' ? 'demo.designer@assetsilo.app' : 'demo.client@assetsilo.app';
    const demoPass = 'AssetSiloDemo2026!';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch {
      // If demo account doesn't exist yet, create it
      await signUpWithEmail(
        demoEmail,
        demoPass,
        role === 'freelancer' ? 'Elena Vance (Lead Designer)' : 'Marcus Brody (Acme Studio)',
        role
      );
    }
  };

  const signOutUser = async () => {
    setError(null);
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInDemo,
        signOutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
