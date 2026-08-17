"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Usuario } from "@/lib/api/auth";

const USUARIO_STORAGE_KEY = "sandbox:usuario";

interface UsuarioContextValue {
  usuario: Usuario | null;
  loading: boolean;
  setUsuario: (usuario: Usuario) => void;
  clearUsuario: () => void;
}

const UsuarioContext = createContext<UsuarioContextValue | null>(null);

function readStoredUsuario(): Usuario | null {
  const raw = window.localStorage.getItem(USUARIO_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage no existe en el server; hidratar acá (una sola vez) es el
    // patrón recomendado por React para estado client-only, aunque el linter
    // no lo distinga de un efecto derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuarioState(readStoredUsuario());
    setLoading(false);
  }, []);

  function setUsuario(next: Usuario) {
    window.localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(next));
    setUsuarioState(next);
  }

  function clearUsuario() {
    window.localStorage.removeItem(USUARIO_STORAGE_KEY);
    setUsuarioState(null);
  }

  return (
    <UsuarioContext.Provider value={{ usuario, loading, setUsuario, clearUsuario }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario(): UsuarioContextValue {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error("useUsuario debe usarse dentro de UsuarioProvider.");
  return ctx;
}
