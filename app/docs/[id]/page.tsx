"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToCells,
  subscribeToDocument,
  subscribeToPresence,
  updatePresence,
  setCell,
  updateDocumentTitle,
  cellKey,
} from "@/lib/documents";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { CellData } from "@/lib/types";
import type { DocumentMeta } from "@/lib/types";
import type { UserPresence } from "@/lib/types";

function EditorContent() {
  const params = useParams();
  const docId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const { uid, displayName, userColor } = useAuth();

  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [meta, setMeta] = useState<DocumentMeta | null>(null);
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [title, setTitle] = useState(docId === "demo" ? "Demo spreadsheet" : "Untitled");
  const [titleEditing, setTitleEditing] = useState(false);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceRef = useRef<number>(0);
  const undoStack = useRef<Array<{ key: string; oldData: CellData | undefined; newData: CellData }>>([]);
  const redoStack = useRef<Array<{ key: string; oldData: CellData | undefined; newData: CellData }>>([]);

  const isDemoDoc = docId === "demo" || !isFirebaseConfigured();

  useEffect(() => {
    if (!docId || isDemoDoc) return;
    const unsubCells = subscribeToCells(docId, setCells);
    const unsubDoc = subscribeToDocument(docId, setMeta);
    const unsubPresence = subscribeToPresence(docId, setPresence);
    return () => {
      unsubCells();
      unsubDoc();
      unsubPresence();
    };
  }, [docId, isDemoDoc]);

  useEffect(() => {
    if (!docId || !uid || isDemoDoc) return;
    const update = () => {
      lastPresenceRef.current = Date.now();
      updatePresence(docId, uid, displayName ?? "Anonymous", userColor);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [docId, uid, displayName, userColor, isDemoDoc]);

  const handleCellUpdate = useCallback(
    async (col: number, row: number, value: string, formula?: string, format?: any) => {
      if (!docId) return;
      const key = cellKey(col, row);
      const oldData = cells.get(key);
      const newData: CellData = { value };
      if (formula) newData.formula = formula;
      if (format) newData.format = format;
      
      // Push to undo stack
      undoStack.current.push({ key, oldData, newData });
      redoStack.current = []; // Clear redo on new action
      
      if (isDemoDoc) {
        setCells((prev) => {
          const next = new Map(prev);
          next.set(key, newData);
          return next;
        });
        return;
      }
      setPendingWrites(true);
      if (pendingRef.current) clearTimeout(pendingRef.current);
      try {
        await setCell(docId, col, row, value, formula, format);
      } finally {
        pendingRef.current = setTimeout(() => setPendingWrites(false), 500);
      }
    },
    [docId, isDemoDoc, cells]
  );

  const handleUndo = useCallback(() => {
    const action = undoStack.current.pop();
    if (!action) return;
    redoStack.current.push(action);
    setCells((prev) => {
      const next = new Map(prev);
      if (action.oldData) {
        next.set(action.key, action.oldData);
      } else {
        next.delete(action.key);
      }
      return next;
    });
    if (!isDemoDoc) {
      // For non-demo, we need to sync with Firestore
      const [col, row] = action.key.split('_').map(Number);
      setCell(docId, col, row, action.oldData?.value || '', action.oldData?.formula, action.oldData?.format);
    }
  }, [docId, isDemoDoc]);

  const handleRedo = useCallback(() => {
    const action = redoStack.current.pop();
    if (!action) return;
    undoStack.current.push(action);
    setCells((prev) => {
      const next = new Map(prev);
      next.set(action.key, action.newData);
      return next;
    });
    if (!isDemoDoc) {
      const [col, row] = action.key.split('_').map(Number);
      setCell(docId, col, row, action.newData.value, action.newData.formula, action.newData.format);
    }
  }, [docId, isDemoDoc]);

  const handleTitleSave = useCallback(async () => {
    setTitleEditing(false);
    if (isDemoDoc) return;
    if (!docId || !meta) return;
    await updateDocumentTitle(docId, title);
  }, [docId, meta, title, isDemoDoc]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  if (!docId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <svg className="h-6 w-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Invalid Document</h1>
          <p className="text-muted">The document you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while doc is being fetched
  if (!isDemoDoc && meta === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
          <span className="text-muted">Loading document...</span>
        </div>
      </div>
    );
  }

  // Check access permission after meta is loaded
  if (!isDemoDoc && meta && uid && meta.ownerId !== uid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg className="h-8 w-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted mb-6">You don't have permission to view this document.</p>
          <Link
            href="/"
            className="btn-hover inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-6 border-b border-border bg-card-bg px-6 py-4 shadow-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

        <div className="flex-1">
          {titleEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="input w-full max-w-md text-lg font-medium"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setTitleEditing(true)}
              className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors"
            >
              {title || "Untitled Document"}
            </button>
          )}
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-4">
          {/* Save Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${pendingWrites ? 'bg-warning animate-pulse' : 'bg-success'}`}></div>
            <span className="text-sm text-muted">
              {pendingWrites ? 'Saving...' : 'Saved'}
            </span>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l border-border pl-4">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.current.length === 0}
              className="btn-hover flex items-center gap-1 rounded px-3 py-1.5 text-sm hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.current.length === 0}
              className="btn-hover flex items-center gap-1 rounded px-3 py-1.5 text-sm hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
              </svg>
              Redo
            </button>
          </div>

          {/* Demo Badge */}
          {isDemoDoc && (
            <div className="flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Demo Mode
            </div>
          )}

          {/* Presence Indicators */}
          {!isDemoDoc && presence.length > 0 && (
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="flex -space-x-1">
                {presence.slice(0, 3).map((p) => (
                  <div
                    key={p.userId}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card-bg bg-card-bg text-xs font-medium"
                    style={{ borderColor: p.color }}
                    title={p.displayName}
                  >
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              {presence.length > 3 && (
                <span className="text-xs text-muted">+{presence.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-hidden">
        <SpreadsheetGrid
          docId={docId}
          title={title}
          cells={cells}
          onCellUpdate={handleCellUpdate}
          pendingWrites={isDemoDoc ? false : pendingWrites}
        />
      </div>
    </div>
  );
}

export default function DocumentPage() {
  return (
    <AuthGate>
      <EditorContent />
    </AuthGate>
  );
}
