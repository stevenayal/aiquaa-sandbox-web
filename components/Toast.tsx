"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./Toast.module.css";

type ToastTipo = "success" | "error";

interface ToastItem {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

interface ToastApi {
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Cuánto queda visible un toast. Fijo, para que las esperas en los tests sean predecibles. */
export const TOAST_DURATION_MS = 5000;

/**
 * Notificaciones efímeras de éxito/error. Viven en el layout, así un toast
 * lanzado justo antes de un `router.push` se sigue viendo en la página nueva.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tipo: ToastTipo, mensaje: string) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), tipo, mensaje }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} aria-label="Notificaciones">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`${styles.toast} ${styles[toast.tipo]}`}
      role={toast.tipo === "error" ? "alert" : "status"}
      data-testid={`toast-${toast.tipo}`}
    >
      <span>{toast.mensaje}</span>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        data-testid="toast-close"
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider.");
  return ctx;
}
