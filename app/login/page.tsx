"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { detectApiKeyVersion, ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("login");

export default function LoginPage() {
  const { apiKey, apiKeyV2, setApiKey, clearApiKey } = useApiKey();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      // Se valida ANTES de comprometer la key al contexto: si se guarda
      // primero, AuthGuard reacciona al instante y redirige a mitad de la
      // validación (se probó y pasaba de verdad). La validación además
      // devuelve el curso al que pertenece la key, para guardarla en la
      // ranura correcta — las rutas de /api/v2 rechazan con 403 cualquier key
      // que no sea de curso 2, así que una key en la ranura equivocada no
      // sirve para nada.
      const version = await detectApiKeyVersion(trimmed);
      setApiKey(trimmed, version);
      setValue("");
      // AuthGuard toma el control de la navegación en cuanto cambia apiKey.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo validar la clave.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} data-testid={ids.form}>
        <Image src="/aiquaa-logo.png" alt="aiquaa" width={96} height={96} className={styles.logo} priority />
        <h1>aiquaa Sandbox</h1>
        <p className={styles.hint}>
          Pegá tu API key para empezar. Reconocemos sola si es del curso 1 o del curso 2 — si
          tenés una de cada uno, cargá las dos.
        </p>

        <label htmlFor="apiKey">API key</label>
        <input
          id="apiKey"
          name="apiKey"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          data-testid={ids.field("apiKey")}
        />

        {error && (
          <p role="alert" className={styles.error} data-testid={ids.fieldError("apiKey")}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !value.trim()} data-testid={ids.submit}>
          {submitting ? "Validando..." : "Entrar"}
        </button>

        <ul className={styles.keyList} data-testid={ids.list}>
          <KeyRow
            curso={1}
            label="Curso 1 · Automatización"
            apiKey={apiKey}
            onClear={() => clearApiKey(1)}
          />
          <KeyRow
            curso={2}
            label="Curso 2 · Productos Bancarios"
            apiKey={apiKeyV2}
            onClear={() => clearApiKey(2)}
          />
        </ul>
      </form>
    </main>
  );
}

/** Estado de la key de un curso: cargada (con los últimos 4 dígitos) o no. */
function KeyRow({
  curso,
  label,
  apiKey,
  onClear,
}: {
  curso: 1 | 2;
  label: string;
  apiKey: string | null;
  onClear: () => void;
}) {
  return (
    <li className={styles.keyRow} data-testid={ids.row(`curso-${curso}`)}>
      <span>{label}</span>
      {apiKey ? (
        <>
          <span className={styles.keyOk}>···{apiKey.slice(-4)}</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onClear}
            data-testid={ids.rowAction(`curso-${curso}`, "quitar")}
          >
            Quitar
          </button>
        </>
      ) : (
        <span className={styles.keyMissing}>sin key</span>
      )}
    </li>
  );
}
