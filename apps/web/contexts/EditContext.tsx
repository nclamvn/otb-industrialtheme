'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Edit {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  status: 'pending' | 'saving' | 'saved' | 'error';
  error?: string;
  timestamp: number;
}

interface UndoableEdit extends Edit {
  undo: () => Promise<void>;
}

interface EditSession {
  id: string;
  edits: Edit[];
  startedAt: number;
  entityType: string;
  entityId: string;
}

interface EditContextType {
  // Current edits tracking
  pendingEdits: Edit[];
  recentEdits: UndoableEdit[];
  currentSession: EditSession | null;

  // Edit operations
  trackEdit: (edit: Omit<Edit, 'id' | 'status' | 'timestamp'>) => string;
  updateEditStatus: (editId: string, status: Edit['status'], error?: string) => void;

  // Session management
  startSession: (entityType: string, entityId: string) => string;
  endSession: () => void;

  // Undo functionality
  addUndoable: (edit: Edit, undoFn: () => Promise<void>) => void;
  undoLast: () => Promise<void>;
  clearHistory: () => void;

  // Bulk operations
  savePendingEdits: () => Promise<{ success: boolean; errors: string[] }>;
  discardPendingEdits: () => void;

  // Dirty state
  isDirty: boolean;
  dirtyFields: Set<string>;
  markFieldDirty: (fieldKey: string) => void;
  markFieldClean: (fieldKey: string) => void;
  clearDirty: () => void;
}

const EditContext = createContext<EditContextType | null>(null);

const MAX_UNDO_HISTORY = 50;
const RECENT_EDITS_LIMIT = 20;

export function EditProvider({ children }: { children: React.ReactNode }) {
  const [pendingEdits, setPendingEdits] = useState<Edit[]>([]);
  const [recentEdits, setRecentEdits] = useState<UndoableEdit[]>([]);
  const [currentSession, setCurrentSession] = useState<EditSession | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  const editIdCounter = useRef(0);
  const sessionIdCounter = useRef(0);

  // Generate unique edit ID
  const generateEditId = useCallback(() => {
    editIdCounter.current += 1;
    return `edit_${Date.now()}_${editIdCounter.current}`;
  }, []);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    sessionIdCounter.current += 1;
    return `session_${Date.now()}_${sessionIdCounter.current}`;
  }, []);

  // Track a new edit
  const trackEdit = useCallback((edit: Omit<Edit, 'id' | 'status' | 'timestamp'>): string => {
    const id = generateEditId();
    const newEdit: Edit = {
      ...edit,
      id,
      status: 'pending',
      timestamp: Date.now(),
    };

    setPendingEdits(prev => [...prev, newEdit]);

    // Add to current session if active
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        edits: [...prev.edits, newEdit],
      } : null);
    }

    return id;
  }, [generateEditId, currentSession]);

  // Update edit status
  const updateEditStatus = useCallback((editId: string, status: Edit['status'], error?: string) => {
    setPendingEdits(prev => prev.map(e =>
      e.id === editId ? { ...e, status, error } : e
    ));

    // Remove saved edits from pending after a short delay
    if (status === 'saved') {
      setTimeout(() => {
        setPendingEdits(prev => prev.filter(e => e.id !== editId));
      }, 500);
    }
  }, []);

  // Start an edit session
  const startSession = useCallback((entityType: string, entityId: string): string => {
    const id = generateSessionId();
    setCurrentSession({
      id,
      edits: [],
      startedAt: Date.now(),
      entityType,
      entityId,
    });
    return id;
  }, [generateSessionId]);

  // End current session
  const endSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  // Add an undoable edit
  const addUndoable = useCallback((edit: Edit, undoFn: () => Promise<void>) => {
    const undoableEdit: UndoableEdit = {
      ...edit,
      undo: undoFn,
    };

    setRecentEdits(prev => {
      const updated = [undoableEdit, ...prev].slice(0, MAX_UNDO_HISTORY);
      return updated;
    });
  }, []);

  // Undo the last edit
  const undoLast = useCallback(async () => {
    if (recentEdits.length === 0) return;

    const lastEdit = recentEdits[0];
    await lastEdit.undo();
    setRecentEdits(prev => prev.slice(1));
  }, [recentEdits]);

  // Clear undo history
  const clearHistory = useCallback(() => {
    setRecentEdits([]);
  }, []);

  // Save all pending edits
  const savePendingEdits = useCallback(async (): Promise<{ success: boolean; errors: string[] }> => {
    const pending = pendingEdits.filter(e => e.status === 'pending');
    if (pending.length === 0) return { success: true, errors: [] };

    const errors: string[] = [];

    for (const edit of pending) {
      try {
        updateEditStatus(edit.id, 'saving');

        // Call API to save edit
        const response = await fetch('/api/edit-engine/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: edit.entityType,
            entityId: edit.entityId,
            fieldName: edit.fieldName,
            oldValue: String(edit.oldValue),
            newValue: String(edit.newValue),
            sessionId: currentSession?.id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          updateEditStatus(edit.id, 'saved');
          // Add to undoable history
          addUndoable(edit, async () => {
            await fetch('/api/edit-engine/undo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ editId: result.editId }),
            });
          });
        } else {
          updateEditStatus(edit.id, 'error', result.error);
          errors.push(`${edit.fieldName}: ${result.error}`);
        }
      } catch (err: any) {
        updateEditStatus(edit.id, 'error', err.message);
        errors.push(`${edit.fieldName}: ${err.message}`);
      }
    }

    return { success: errors.length === 0, errors };
  }, [pendingEdits, currentSession, updateEditStatus, addUndoable]);

  // Discard all pending edits
  const discardPendingEdits = useCallback(() => {
    setPendingEdits([]);
    clearDirty();
  }, []);

  // Dirty field tracking
  const markFieldDirty = useCallback((fieldKey: string) => {
    setDirtyFields(prev => new Set(prev).add(fieldKey));
  }, []);

  const markFieldClean = useCallback((fieldKey: string) => {
    setDirtyFields(prev => {
      const next = new Set(prev);
      next.delete(fieldKey);
      return next;
    });
  }, []);

  const clearDirty = useCallback(() => {
    setDirtyFields(new Set());
  }, []);

  const isDirty = pendingEdits.length > 0 || dirtyFields.size > 0;

  const value: EditContextType = {
    pendingEdits,
    recentEdits,
    currentSession,
    trackEdit,
    updateEditStatus,
    startSession,
    endSession,
    addUndoable,
    undoLast,
    clearHistory,
    savePendingEdits,
    discardPendingEdits,
    isDirty,
    dirtyFields,
    markFieldDirty,
    markFieldClean,
    clearDirty,
  };

  return (
    <EditContext.Provider value={value}>
      {children}
    </EditContext.Provider>
  );
}

export function useEditContext() {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEditContext must be used within an EditProvider');
  }
  return context;
}

// Hook for using edit tracking with a specific entity
export function useEntityEdits(entityType: string, entityId: string) {
  const {
    trackEdit,
    pendingEdits,
    startSession,
    endSession,
    isDirty,
    savePendingEdits,
    discardPendingEdits,
  } = useEditContext();

  const entityEdits = pendingEdits.filter(
    e => e.entityType === entityType && e.entityId === entityId
  );

  const track = useCallback((fieldName: string, oldValue: any, newValue: any) => {
    return trackEdit({
      entityType,
      entityId,
      fieldName,
      oldValue,
      newValue,
    });
  }, [trackEdit, entityType, entityId]);

  const start = useCallback(() => {
    return startSession(entityType, entityId);
  }, [startSession, entityType, entityId]);

  return {
    edits: entityEdits,
    trackEdit: track,
    startSession: start,
    endSession,
    isDirty: entityEdits.length > 0,
    save: savePendingEdits,
    discard: discardPendingEdits,
  };
}
