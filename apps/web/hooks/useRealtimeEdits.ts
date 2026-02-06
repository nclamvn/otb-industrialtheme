'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface EditEvent {
  type: 'edit_created' | 'edit_approved' | 'edit_rejected' | 'edit_reverted';
  batchId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  editedByName: string;
  cascadeCount: number;
  status: string;
  timestamp: string;
}

interface UseRealtimeEditsOptions {
  entityType: string;
  entityId: string;
  onEdit?: (event: EditEvent) => void;
  enabled?: boolean;
}

// ════════════════════════════════════════
// SSE-based Real-time Hook (no socket.io dependency)
// Falls back to polling if SSE unavailable
// ════════════════════════════════════════

export function useRealtimeEdits({
  entityType,
  entityId,
  onEdit,
  enabled = true,
}: UseRealtimeEditsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<EditEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const url = `/api/edits/stream?entityType=${entityType}&entityId=${entityId}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => setIsConnected(true);

      es.onmessage = (event) => {
        try {
          const data: EditEvent = JSON.parse(event.data);
          setLastEvent(data);
          onEditRef.current?.(data);
        } catch {
          // Ignore parse errors (e.g., heartbeat)
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        // Auto-reconnect is built into EventSource
      };

      return () => {
        es.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      };
    } catch {
      // SSE not supported, use polling fallback
      console.warn(
        '[Realtime Edits] SSE not available, falling back to polling'
      );

      let lastTimestamp = '';
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/edits/recent?entityType=${entityType}&entityId=${entityId}&since=${lastTimestamp}`
          );
          if (res.ok) {
            const events: EditEvent[] = await res.json();
            events.forEach((event) => {
              setLastEvent(event);
              onEditRef.current?.(event);
              lastTimestamp = event.timestamp;
            });
          }
        } catch {
          // Ignore polling errors
        }
      }, 5000);

      setIsConnected(true);
      return () => clearInterval(pollInterval);
    }
  }, [entityType, entityId, enabled]);

  return { isConnected, lastEvent };
}

// ════════════════════════════════════════
// Global Edit Feed Hook (for NotificationCenter)
// ════════════════════════════════════════

export function useEditFeed(options?: {
  maxEvents?: number;
  onEvent?: (e: EditEvent) => void;
}) {
  const [events, setEvents] = useState<EditEvent[]>([]);
  const maxEvents = options?.maxEvents ?? 50;
  const onEventRef = useRef(options?.onEvent);
  onEventRef.current = options?.onEvent;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const es = new EventSource('/api/edits/feed');

      es.onmessage = (event) => {
        try {
          const data: EditEvent = JSON.parse(event.data);
          setEvents((prev) => [data, ...prev].slice(0, maxEvents));
          onEventRef.current?.(data);
        } catch {
          // Ignore parse errors
        }
      };

      return () => es.close();
    } catch {
      return;
    }
  }, [maxEvents]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, clearEvents };
}

export type { EditEvent, UseRealtimeEditsOptions };
