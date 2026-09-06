"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearSesion, type TipoEvento } from "@/lib/api/sesiones";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("sesiones");

const TIPOS_EVENTO: TipoEvento[] = [
  "login",
  "logout",
  "password_reset_solicitado",
  "password_reset_completado",
];

export default function NuevaSesionPage() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>("login");
  const [exitoso, setExitoso] = useState(true);
  const [ip, setIp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const sesion = await crearSesion({
        usuarioId: Number(usuarioId),
        tipoEvento,
        exitoso,
        ip: ip.trim() || undefined,
      });
      router.push(`/sesiones/${sesion.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el evento de sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="sesiones" title="Nuevo evento de sesión" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            required
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            data-testid={ids.field("usuarioId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="tipoEvento">Tipo de evento</label>
          <select
            id="tipoEvento"
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value as TipoEvento)}
            data-testid={ids.field("tipoEvento")}
          >
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="exitoso">Resultado</label>
          <select
            id="exitoso"
            value={exitoso ? "true" : "false"}
            onChange={(e) => setExitoso(e.target.value === "true")}
            data-testid={ids.field("exitoso")}
          >
            <option value="true">Exitoso</option>
            <option value="false">Fallido</option>
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="ip">IP (opcional)</label>
          <input id="ip" value={ip} onChange={(e) => setIp(e.target.value)} data-testid={ids.field("ip")} />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}
