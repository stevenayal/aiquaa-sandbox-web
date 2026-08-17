"use client";

import type { ReactNode } from "react";

interface DataStateProps {
  loading: boolean;
  error: Error | null;
  empty?: boolean;
  loadingTestId: string;
  errorTestId: string;
  emptyTestId?: string;
  emptyMessage?: string;
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
  return <>{children}</>;
}
