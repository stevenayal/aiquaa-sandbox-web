"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearNotificacion, type NotificacionCanal } from "@/lib/api/notificaciones";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("notificaciones");
const CANALES: NotificacionCanal[] = ["push", "email", "sms"];

export default function NuevaNotificacionPage() {
  const router = useRouter();
  const { usuario } = useUsuario();

  const [form, setForm] = useState({
    usuarioId: usuario ? String(usuario.id) : "",
    canal: "push" as NotificacionCanal,
    asunto: "",
    mensaje: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // En un hard reload, UsuarioContext todavía no hidrató del localStorage
  // en el primer render (ver lib/auth/useDefaultUsuarioId.ts) — sin esto
  // usuarioId queda vacío para siempre.
  useEffect(() => {
    if (!usuario) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync único desde contexto client-only hidratado async, ver lib/auth/useDefaultUsuarioId.ts
    setForm((prev) => (prev.usuarioId === "" ? { ...prev, usuarioId: String(usuario.id) } : prev));
  }, [usuario]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await crearNotificacion({
        usuarioId: Number(form.usuarioId),
        canal: form.canal,
        asunto: form.asunto,
        mensaje: form.mensaje,
      });
      router.push("/notificaciones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la notificación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="notificaciones" title="Nueva notificación" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            required
            value={form.usuarioId}
            onChange={(e) => update("usuarioId", e.target.value)}
            data-testid={ids.field("usuarioId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="canal">Canal</label>
          <select
            id="canal"
            value={form.canal}
            onChange={(e) => update("canal", e.target.value as NotificacionCanal)}
            data-testid={ids.field("canal")}
          >
            {CANALES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="asunto">Asunto</label>
          <input
            id="asunto"
            required
            value={form.asunto}
            onChange={(e) => update("asunto", e.target.value)}
            data-testid={ids.field("asunto")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="mensaje">Mensaje</label>
          <textarea
            id="mensaje"
            required
            value={form.mensaje}
            onChange={(e) => update("mensaje", e.target.value)}
            data-testid={ids.field("mensaje")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear"}
        </button>
      </form>
    </div>
  );
}
