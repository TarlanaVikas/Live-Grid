"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { COLORS } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  uid: string | null;
  displayName: string | null;
  userColor: string;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: (displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userColor, setUserColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
      setUser(u);
      if (u) {
        const stored = localStorage.getItem(`color:${u.uid}`);
        setUserColor(stored ?? COLORS[Math.abs(hash(u.uid)) % COLORS.length]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signInAnonymouslyWithName = useCallback(async (displayName: string) => {
    const cred = await signInAnonymously(auth);
    await updateProfile(cred.user, { displayName });
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const displayName = user?.displayName ?? user?.email ?? null;
  const uid = user?.uid ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        uid,
        displayName,
        userColor,
        loading,
        signInWithGoogle,
        signInAnonymously: signInAnonymouslyWithName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
