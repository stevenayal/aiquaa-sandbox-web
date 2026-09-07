"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { solicitarPrestamoV2 } from "@/lib/api/v2/prestamos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-prestamos");

export default function NuevoPrestamoV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [cuentaId, setCuentaId] = useState("");
  const [montoSolicitado, setMontoSolicitado] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const prestamo = await solicitarPrestamoV2({
        usuarioId: Number(usuarioId),
        cuentaId: cuentaId.trim() ? Number(cuentaId) : undefined,
        montoSolicitado: Number(montoSolicitado),
        tasaInteres: Number(tasaInteres),
        plazoMeses: Number(plazoMeses),
      });
      router.push(`/v2/prestamos/${prestamo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo solicitar el préstamo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-prestamos" title="Solicitar préstamo" />

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
          <label htmlFor="cuentaId">cuentaId (opcional)</label>
          <input
            id="cuentaId"
            type="number"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            data-testid={ids.field("cuentaId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="montoSolicitado">Monto solicitado</label>
          <input
            id="montoSolicitado"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={montoSolicitado}
            onChange={(e) => setMontoSolicitado(e.target.value)}
            data-testid={ids.field("montoSolicitado")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="tasaInteres">Tasa de interés (%)</label>
          <input
            id="tasaInteres"
            type="number"
            step="0.01"
            min="0"
            required
            value={tasaInteres}
            onChange={(e) => setTasaInteres(e.target.value)}
            data-testid={ids.field("tasaInteres")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="plazoMeses">Plazo (meses)</label>
          <input
            id="plazoMeses"
            type="number"
            step="1"
            min="1"
            max="120"
            required
            value={plazoMeses}
            onChange={(e) => setPlazoMeses(e.target.value)}
            data-testid={ids.field("plazoMeses")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Solicitando..." : "Solicitar préstamo"}
        </button>
      </form>
    </div>
  );
}
