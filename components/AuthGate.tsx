"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle, signInAnonymously } = useAuth();
  const [displayName, setDisplayName] = useState("");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
          <span className="text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white font-bold text-2xl">
          LG
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to Live Grid</h1>
        <p className="text-muted text-lg">Collaborative spreadsheets made simple</p>
      </div>

      <div className="card w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Sign in to continue</h2>

        {isFirebaseConfigured() ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="btn-hover flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card-bg px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-hover-bg transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs text-muted">
                <span className="bg-card-bg px-3">or continue as guest</span>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input flex-1"
                onKeyDown={(e) => e.key === "Enter" && signInAnonymously(displayName || "Anonymous")}
              />
              <button
                type="button"
                onClick={() => signInAnonymously(displayName || "Anonymous")}
                className="btn-hover rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-hover whitespace-nowrap"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted">
            <p className="mb-4">Firebase is not configured.</p>
            <p className="text-sm">Set up Firebase to enable authentication and data persistence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
