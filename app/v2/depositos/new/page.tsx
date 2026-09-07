"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { constituirDepositoV2 } from "@/lib/api/v2/depositos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-depositos");

export default function NuevoDepositoV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [cuentaId, setCuentaId] = useState("");
  const [monto, setMonto] = useState("");
  const [tasaAnual, setTasaAnual] = useState("");
  const [plazoDias, setPlazoDias] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const deposito = await constituirDepositoV2({
        usuarioId: Number(usuarioId),
        cuentaId: Number(cuentaId),
        monto: Number(monto),
        tasaAnual: Number(tasaAnual),
        plazoDias: Number(plazoDias),
      });
      router.push(`/v2/depositos/${deposito.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo constituir el depósito.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-depositos" title="Nuevo depósito" />

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
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            data-testid={ids.field("monto")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="tasaAnual">Tasa anual</label>
          <input
            id="tasaAnual"
            type="number"
            min="0"
            step="0.01"
            required
            value={tasaAnual}
            onChange={(e) => setTasaAnual(e.target.value)}
            data-testid={ids.field("tasaAnual")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="plazoDias">Plazo (días)</label>
          <input
            id="plazoDias"
            type="number"
            min="30"
            max="1095"
            step="1"
            required
            value={plazoDias}
            onChange={(e) => setPlazoDias(e.target.value)}
            data-testid={ids.field("plazoDias")}
          />
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
          El monto se debita de la cuenta al constituir el depósito.
        </p>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Constituyendo..." : "Constituir depósito"}
        </button>
      </form>
    </div>
  );
}
