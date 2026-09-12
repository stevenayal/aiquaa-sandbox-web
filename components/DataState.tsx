"use client";

import type { ReactNode } from "react";
import shared from "@/components/shared.module.css";

interface DataStateProps {
  loading: boolean;
  error: Error | null;
  empty?: boolean;
  loadingTestId: string;
  errorTestId: string;
  emptyTestId?: string;
  emptyMessage?: string;
  /** Cantidad de resultados de la lista; si se pasa, se muestra arriba de ella. */
  count?: number;
  countTestId?: string;
  children: ReactNode;
}

/** Estados loading/error/empty estándar (sección 5 del plan) para listas y detalles. */
export function DataState({
  loading,
  error,
  empty = false,
  loadingTestId,
  errorTestId,
  emptyTestId,
  emptyMessage = "Sin resultados.",
  count,
  countTestId,
  children,
}: DataStateProps) {
  if (loading) return <p data-testid={loadingTestId}>Cargando...</p>;
  if (error) {
    return (
      <p role="alert" data-testid={errorTestId}>
        {error.message}
      </p>
    );
  }
  if (empty) {
    return <p data-testid={emptyTestId}>{emptyMessage}</p>;
  }
  return (
    <>
      {count !== undefined && (
        // Cuántas filas trajo la lista, a la vista y asertable sin contar <tr>
        // a mano (varias listas del sandbox devuelven hasta 100 filas).
        <p className={shared.resultCount} data-testid={countTestId}>
          {count === 1 ? "1 resultado" : `${count} resultados`}
        </p>
      )}
      {children}
    </>
  );
}
