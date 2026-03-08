"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/context/AuthContext";
import {
  createDocument,
  documentsRef,
  deleteDocument,
} from "@/lib/documents";
import { onSnapshot, query, orderBy, where } from "firebase/firestore";
import type { DocumentMeta } from "@/lib/types";

function DashboardContent() {
  const { user, displayName, signOut } = useAuth();
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCount, setAllCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    
    console.log("User authenticated:", user.uid, user.email);
    
    // debug snapshot without ordering
    const allDocsQuery = query(documentsRef());
    const unsubAll = onSnapshot(allDocsQuery, (snap) => {
      console.log("All documents in DB:", snap.docs.map(d => ({ 
        id: d.id, 
        ownerId: d.data().ownerId, 
        title: d.data().title,
        ownerName: d.data().ownerName 
      })));
      setAllCount(snap.size);
    });

    // query only by owner; sort client-side to avoid needing a composite index
    const q = query(
      documentsRef(),
      where("ownerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      console.log("Documents fetched for user:", snap.docs.length, snap.docs.map(d => ({ id: d.id, ownerId: d.data().ownerId })));
      const mapped = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? "Untitled",
          lastModified: data.lastModified?.toMillis?.() ?? Date.now(),
          ownerId: data.ownerId ?? "",
          ownerName: data.ownerName ?? "",
        };
      });
      // sort by lastModified desc
      mapped.sort((a, b) => b.lastModified - a.lastModified);
      setDocs(mapped);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user docs:", err);
    });
    return () => {
      unsub();
      unsubAll();
    };
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const id = crypto.randomUUID();
    console.log("Creating document with ownerId:", user.uid, "for user:", user.email);
    await createDocument(
      id,
      "Untitled",
      user.uid,
      displayName ?? "Anonymous"
    );
    console.log("Document created with ID:", id);
    window.location.href = `/docs/${id}`;
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteDocument(docId);
      console.log("Document deleted:", docId);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card-bg px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              LG
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Live Grid</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span>{displayName ?? "Anonymous"}</span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="slide-in">
            <h2 className="text-3xl font-semibold text-foreground mb-2">Your Documents</h2>
            <p className="text-muted">Create and collaborate on spreadsheets in real-time</p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="btn-hover flex items-center gap-3 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-hover glow"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Document</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary"></div>
              <span className="text-muted">Loading documents...</span>
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="card rounded-xl border-2 border-dashed border-border bg-card-bg px-12 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent float">
              <svg className="h-10 w-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-foreground">Welcome to Live Grid</h3>
            <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
              Create your first collaborative spreadsheet and start building amazing things together with your team in real-time.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="btn-hover inline-flex items-center gap-3 rounded-lg bg-primary px-8 py-4 text-base font-medium text-white shadow-lg hover:bg-primary-hover glow hover:scale-105 transition-all duration-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your First Spreadsheet</span>
            </button>
            {allCount !== null && allCount > 0 && (
              <div className="mt-6 text-sm text-warning bg-warning/10 px-4 py-3 rounded-lg inline-block border border-warning/20">
                <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                There are {allCount} total documents in the database, but none belong to your account
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((d, index) => (
              <Link
                key={d.id}
                href={`/docs/${d.id}`}
                className="card group block p-6 hover:shadow-lg transition-all duration-200 slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent group-hover:bg-primary/10 transition-all duration-200 float">
                    <svg className="h-6 w-6 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(d.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-error hover:text-error/80 transition-all duration-200 p-2 rounded-lg hover:bg-error/10"
                    title="Delete document"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors">{d.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-success"></div>
                    <span>{d.ownerName}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDate(d.lastModified)}</span>
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Click to open</span>
                    <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
