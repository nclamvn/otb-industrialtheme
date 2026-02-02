'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

// ════════════════════════════════════════
// Config
// ════════════════════════════════════════

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-[#127749]',
    border: 'border-[#127749]',
    text: 'text-white',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    text: 'text-black',
  },
  info: {
    icon: Info,
    bg: 'bg-[#B8860B]',
    border: 'border-[#B8860B]',
    text: 'text-white',
  },
} as const;

// ════════════════════════════════════════
// Context
// ════════════════════════════════════════

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useDAFCToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useDAFCToast must be used within a DAFCToastProvider');
  }
  return context;
}

// ════════════════════════════════════════
// Provider
// ════════════════════════════════════════

export function DAFCToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { ...options, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss
      const duration = options.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ type: 'error', title, description }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: 'warning', title, description }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <DAFCToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ════════════════════════════════════════
// Toast Container
// ════════════════════════════════════════

function DAFCToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <DAFCToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════
// Toast Item
// ════════════════════════════════════════

function DAFCToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'pointer-events-auto rounded-xl px-4 py-3 shadow-lg border',
        config.bg,
        config.border,
        config.text
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.description && (
            <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default DAFCToastProvider;
