"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  UNAUTHORIZED_EVENT,
  clearStoredApiKey,
  getStoredApiKey,
  setStoredApiKey,
  type ApiVersion,
  type UnauthorizedEventDetail,
} from "@/lib/api/http";

interface ApiKeyContextValue {
  /** Key del curso 1 (`/api/v1/**`). */
  apiKey: string | null;
  /** Key del curso 2 (`/api/v2/**`) — key distinta, el backend no las cruza. */
  apiKeyV2: string | null;
  loading: boolean;
  setApiKey: (key: string, version?: ApiVersion) => void;
  /** Sin `version`, limpia las dos (logout). */
  clearApiKey: (version?: ApiVersion) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiKeyV2, setApiKeyV2State] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage no existe en el server; hidratar acá (una sola vez) es el
    // patrón recomendado por React para estado client-only, aunque el linter
    // no lo distinga de un efecto derivado.
    /* eslint-disable react-hooks/set-state-in-effect */
    setApiKeyState(getStoredApiKey(1));
    setApiKeyV2State(getStoredApiKey(2));
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    function handleUnauthorized(event: Event) {
      const version = (event as CustomEvent<UnauthorizedEventDetail>).detail?.version ?? 1;
      clearStoredApiKey(version);
      if (version === 2) setApiKeyV2State(null);
      else setApiKeyState(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  function setApiKey(key: string, version: ApiVersion = 1) {
    setStoredApiKey(key, version);
    if (version === 2) setApiKeyV2State(key);
    else setApiKeyState(key);
  }

  function clearApiKey(version?: ApiVersion) {
    clearStoredApiKey(version);
    if (version === undefined) {
      setApiKeyState(null);
      setApiKeyV2State(null);
      return;
    }
    if (version === 2) setApiKeyV2State(null);
    else setApiKeyState(null);
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, apiKeyV2, loading, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey debe usarse dentro de ApiKeyProvider.");
  return ctx;
}
