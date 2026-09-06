"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { login, forgotPassword, resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { normalizeEmail } from "@/lib/format";
import { testIds } from "@/lib/testids";

const loginIds = testIds("auth-login");
const forgotIds = testIds("auth-forgot");

export default function AuthLoginPage() {
  const { setUsuario } = useUsuario();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [pendingUsuarioId, setPendingUsuarioId] = useState<number | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const trimmed = normalizeEmail(email);
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const usuario = await login(trimmed);
      setUsuario(usuario);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    const trimmed = normalizeEmail(forgotEmail);
    if (!trimmed) return;

    setForgotSubmitting(true);
    setForgotError(null);
    setResetDone(false);
    try {
      const sesion = await forgotPassword(trimmed);
      setPendingUsuarioId(sesion.usuario_id);
    } catch (err) {
      setForgotError(err instanceof ApiError ? err.message : "No se pudo registrar la solicitud.");
    } finally {
      setForgotSubmitting(false);
    }
  }

  async function handleReset() {
    if (pendingUsuarioId === null) return;
    setResetSubmitting(true);
    setForgotError(null);
    try {
      await resetPassword(pendingUsuarioId);
      setResetDone(true);
    } catch (err) {
      setForgotError(err instanceof ApiError ? err.message : "No se pudo completar el reset.");
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleLogin} data-testid={loginIds.form}>
        <Image src="/aiquaa-logo.png" alt="aiquaa" width={72} height={72} className={styles.logo} priority />
        <h1>Iniciar sesión</h1>
        <p className={styles.hint}>Email de un usuario activo del sandbox.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          data-testid={loginIds.field("email")}
        />

        {error && (
          <p role="alert" className={styles.error} data-testid={loginIds.fieldError("email")}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !email.trim()} data-testid={loginIds.submit}>
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setShowForgot((v) => !v)}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      {showForgot && (
        <form className={styles.card} onSubmit={handleForgot} data-testid={forgotIds.form}>
          <h2>Recuperar acceso</h2>

          <label htmlFor="forgotEmail">Email</label>
          <input
            id="forgotEmail"
            name="forgotEmail"
            type="email"
            autoComplete="email"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            data-testid={forgotIds.field("email")}
          />

          {forgotError && (
            <p role="alert" className={styles.error} data-testid={forgotIds.fieldError("email")}>
              {forgotError}
            </p>
          )}

          <button
            type="submit"
            disabled={forgotSubmitting || !forgotEmail.trim()}
            data-testid={forgotIds.submit}
          >
            {forgotSubmitting ? "Enviando..." : "Solicitar reset"}
          </button>

          {pendingUsuarioId !== null && !resetDone && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetSubmitting}
              data-testid={forgotIds.rowAction(pendingUsuarioId, "confirmar-reset")}
            >
              {resetSubmitting ? "Confirmando..." : "Confirmar reset"}
            </button>
          )}

          {resetDone && (
            <p role="status" className={styles.success} data-testid={forgotIds.success}>
              Reset completado. Ya podés iniciar sesión de nuevo.
            </p>
          )}
        </form>
      )}
    </main>
  );
}
