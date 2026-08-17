"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { crearReserva } from "@/lib/api/reservas";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("reservas");

export default function NuevaReservaPage() {
  const router = useRouter();
  const { usuario } = useUsuario();

  const [form, setForm] = useState({
    usuarioId: usuario ? String(usuario.id) : "",
    servicio: "",
    fechaHora: "",
    notas: "",
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
      await crearReserva({
        usuarioId: Number(form.usuarioId),
        servicio: form.servicio,
        fechaHora: form.fechaHora ? new Date(form.fechaHora).toISOString() : "",
        notas: form.notas || undefined,
      });
      router.push("/reservas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Nueva reserva</h1>
      </div>

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
          <label htmlFor="servicio">Servicio</label>
          <input
            id="servicio"
            required
            value={form.servicio}
            onChange={(e) => update("servicio", e.target.value)}
            data-testid={ids.field("servicio")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="fechaHora">Fecha y hora</label>
          <input
            id="fechaHora"
            type="datetime-local"
            required
            value={form.fechaHora}
            onChange={(e) => update("fechaHora", e.target.value)}
            data-testid={ids.field("fechaHora")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="notas">Notas (opcional)</label>
          <textarea
            id="notas"
            value={form.notas}
            onChange={(e) => update("notas", e.target.value)}
            data-testid={ids.field("notas")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Reservar"}
        </button>
      </form>
    </div>
  );
}
