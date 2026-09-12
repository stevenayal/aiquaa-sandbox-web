"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ApiVersion } from "@/lib/api/http";

const CURSO_STORAGE_KEY = "sandbox:curso";

/** Cohorte elegida al entrar: decide qué key se pide, qué login aplica y qué menú se carga. */
export type Curso = ApiVersion;

export const CURSO_LABELS: Record<Curso, string> = {
  1: "Curso 1 · Automatización",
  2: "Curso 2 · Productos Bancarios",
};

interface CursoContextValue {
  curso: Curso | null;
  loading: boolean;
  setCurso: (curso: Curso) => void;
  clearCurso: () => void;
}

const CursoContext = createContext<CursoContextValue | null>(null);

function readStoredCurso(): Curso | null {
  const raw = window.localStorage.getItem(CURSO_STORAGE_KEY);
  return raw === "1" ? 1 : raw === "2" ? 2 : null;
}

export function CursoProvider({ children }: { children: ReactNode }) {
  const [curso, setCursoState] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mismo patrón que UsuarioContext: localStorage solo existe en el browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursoState(readStoredCurso());
    setLoading(false);
  }, []);

  function setCurso(next: Curso) {
    window.localStorage.setItem(CURSO_STORAGE_KEY, String(next));
    setCursoState(next);
  }

  function clearCurso() {
    window.localStorage.removeItem(CURSO_STORAGE_KEY);
    setCursoState(null);
  }

  return (
    <CursoContext.Provider value={{ curso, loading, setCurso, clearCurso }}>{children}</CursoContext.Provider>
  );
}

export function useCurso(): CursoContextValue {
  const ctx = useContext(CursoContext);
  if (!ctx) throw new Error("useCurso debe usarse dentro de CursoProvider.");
  return ctx;
}
