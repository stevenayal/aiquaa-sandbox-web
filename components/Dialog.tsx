"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ConfirmDialog.module.css";

interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** `{testId}-dialog`; el contenido suele ser un form con sus propios testids. */
  testId: string;
  children: ReactNode;
}

/**
 * Modal con contenido propio (ej. un form con motivo obligatorio). Mismo
 * aspecto que `ConfirmDialog`: Escape o click afuera cierran, y el foco
 * inicial va al primer campo del contenido.
 */
export function Dialog({ open, title, description, onClose, testId, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  // El foco inicial se da una sola vez al abrir: si dependiera de `onClose`
  // (una arrow nueva en cada render del padre), cada tecla lo movería.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} data-testid={`${testId}-dialog`}>
      <div
        ref={ref}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-dialog-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={`${testId}-dialog-title`} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
    </div>
  );
}
