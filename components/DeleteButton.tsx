"use client";

import { useState } from "react";
import shared from "@/components/shared.module.css";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ApiError } from "@/lib/api/http";

interface DeleteButtonProps {
  testId: string;
  title: string;
  description?: string;
  label?: string;
  onDelete: () => Promise<void>;
  onDeleted?: () => void;
}

/**
 * Botón de soft-delete estándar: confirma (Regla de Fin de Pico, ver
 * ConfirmDialog) antes de ejecutar, muestra estado "Eliminando..." mientras
 * dura la request (Umbral de Doherty) y el error inline si falla.
 */
export function DeleteButton({ testId, title, description, label = "Eliminar", onDelete, onDeleted }: DeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleConfirm() {
    setConfirmOpen(false);
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onDeleted?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar.");
      setDeleting(false);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className={shared.fieldError}>
          {error}
        </p>
      )}
      <button
        type="button"
        className={shared.buttonDanger}
        disabled={deleting}
        onClick={() => setConfirmOpen(true)}
        data-testid={testId}
      >
        {deleting ? "Eliminando..." : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={title}
        description={description}
        confirmLabel="Eliminar"
        danger
        testId={testId}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
