"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { validateApiKey, ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("login");

export default function LoginPage() {
  const { setApiKey } = useApiKey();
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
      // validación (se probó y pasaba de verdad).
      await validateApiKey(trimmed);
      setApiKey(trimmed);
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
        <p className={styles.hint}>Pegá tu API key para empezar.</p>

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
      </form>
    </main>
  );
}
