"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearAhorroV2 } from "@/lib/api/v2/ahorros";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-ahorros");

export default function NuevoAhorroV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [cuentaId, setCuentaId] = useState("");
  const [nombreMeta, setNombreMeta] = useState("");
  const [metaMonto, setMetaMonto] = useState("");
  const [aporteMensual, setAporteMensual] = useState("");
  const [tasaAnual, setTasaAnual] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ahorro = await crearAhorroV2({
        usuarioId: Number(usuarioId),
        cuentaId: Number(cuentaId),
        nombreMeta,
        metaMonto: Number(metaMonto),
        aporteMensual: Number(aporteMensual),
        tasaAnual: tasaAnual.trim() ? Number(tasaAnual) : undefined,
      });
      router.push(`/v2/ahorros/${ahorro.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el plan de ahorro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-ahorros" title="Nuevo plan de ahorro" />

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
          <label htmlFor="cuentaId">cuentaId</label>
          <input
            id="cuentaId"
            required
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            data-testid={ids.field("cuentaId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="nombreMeta">Nombre de la meta</label>
          <input
            id="nombreMeta"
            required
            value={nombreMeta}
            onChange={(e) => setNombreMeta(e.target.value)}
            data-testid={ids.field("nombreMeta")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="metaMonto">Monto meta</label>
          <input
            id="metaMonto"
            type="number"
            min="0"
            step="0.01"
            required
            value={metaMonto}
            onChange={(e) => setMetaMonto(e.target.value)}
            data-testid={ids.field("metaMonto")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="aporteMensual">Aporte mensual</label>
          <input
            id="aporteMensual"
            type="number"
            min="0"
            step="0.01"
            required
            value={aporteMensual}
            onChange={(e) => setAporteMensual(e.target.value)}
            data-testid={ids.field("aporteMensual")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="tasaAnual">Tasa anual (opcional)</label>
          <input
            id="tasaAnual"
            type="number"
            min="0"
            step="0.01"
            value={tasaAnual}
            onChange={(e) => setTasaAnual(e.target.value)}
            data-testid={ids.field("tasaAnual")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear plan"}
        </button>
      </form>
    </div>
  );
}
