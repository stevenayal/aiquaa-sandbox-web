"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { CURSO_LABELS, useCurso } from "@/lib/auth/CursoContext";
import { detectApiKeyVersion, ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("login");

export default function LoginPage() {
  const { curso, clearCurso } = useCurso();
  const { setApiKey } = useApiKey();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AuthGuard no deja llegar acá sin curso elegido, ni con la key de ese
  // curso ya cargada (en ese caso redirige a la capa siguiente).
  const cursoElegido = curso ?? 1;

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
      // devuelve el curso al que pertenece la key: tiene que coincidir con el
      // curso elegido en /curso, o la key no sirve para esa cohorte (las
      // rutas de /api/v2 rechazan con 403 toda key que no sea de curso 2).
      const version = await detectApiKeyVersion(trimmed);
      if (version !== cursoElegido) {
        setError(`Esta API key es del curso ${version}, elegiste el curso ${cursoElegido}.`);
        return;
      }
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

        <p className={styles.cursoRow} data-testid="login-curso">
          <span>{CURSO_LABELS[cursoElegido]}</span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={clearCurso}
            data-testid="login-cambiar-curso"
          >
            Cambiar curso
          </button>
        </p>

        <p className={styles.hint}>Pegá la API key de tu curso para empezar.</p>

        <label htmlFor="apiKey">API key</label>
        <input
          id="apiKey"
          name="apiKey"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "apiKey-error" : undefined}
          data-testid={ids.field("apiKey")}
        />

        {error && (
          <p id="apiKey-error" role="alert" className={styles.error} data-testid={ids.fieldError("apiKey")}>
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
