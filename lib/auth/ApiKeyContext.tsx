"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  UNAUTHORIZED_EVENT,
  clearStoredApiKey,
  getStoredApiKey,
  setStoredApiKey,
} from "@/lib/api/http";

interface ApiKeyContextValue {
  apiKey: string | null;
  loading: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage no existe en el server; hidratar acá (una sola vez) es el
    // patrón recomendado por React para estado client-only, aunque el linter
    // no lo distinga de un efecto derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKeyState(getStoredApiKey());
    setLoading(false);
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredApiKey();
      setApiKeyState(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  function setApiKey(key: string) {
    setStoredApiKey(key);
    setApiKeyState(key);
  }

  function clearApiKey() {
    clearStoredApiKey();
    setApiKeyState(null);
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, loading, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey debe usarse dentro de ApiKeyProvider.");
  return ctx;
}
