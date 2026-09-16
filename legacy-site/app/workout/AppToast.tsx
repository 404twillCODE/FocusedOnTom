"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, Timer } from "lucide-react";

type ToastType = "success" | "error" | "info" | "timer";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  timer: Timer,
};

const COLORS: Record<ToastType, { border: string; bg: string; icon: string }> = {
  success: {
    border: "border-[var(--ice)]/50",
    bg: "bg-[var(--iceSoft)]/30",
    icon: "text-[var(--ice)]",
  },
  error: {
    border: "border-red-500/50",
    bg: "bg-red-500/10",
    icon: "text-red-400",
  },
  info: {
    border: "border-[var(--border)]",
    bg: "bg-[var(--bg2)]",
    icon: "text-[var(--textMuted)]",
  },
  timer: {
    border: "border-[var(--ice)]/50",
    bg: "bg-[var(--iceSoft)]/30",
    icon: "text-[var(--ice)]",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border ${colors.border} ${colors.bg} px-4 py-3 shadow-lg backdrop-blur-sm`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${colors.icon}`} />
      <p className="flex-1 text-sm font-medium text-[var(--text)]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-0.5 text-[var(--textMuted)] hover:text-[var(--text)]"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - fixed at top */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
