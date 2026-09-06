"use client";

import { useEffect, useRef } from "react";
import shared from "@/components/shared.module.css";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estiliza el botón de confirmar como acción destructiva (revocar, bloquear, cancelar). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testId: string;
}

/**
 * Confirmación para acciones irreversibles o difíciles de deshacer
 * (Regla de Fin de Pico — sección 25 de la guía de leyes de UX): el foco
 * inicial va al botón "Cancelar" para que un click accidental sobre el
 * disparador no confirme la acción destructiva sin querer.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
  testId,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onCancel}
      data-testid={`${testId}-confirm-dialog`}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${testId}-confirm-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={`${testId}-confirm-title`} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={shared.buttonSecondary}
            onClick={onCancel}
            data-testid={`${testId}-confirm-cancel`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? shared.buttonDanger : shared.button}
            onClick={onConfirm}
            data-testid={`${testId}-confirm-accept`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
