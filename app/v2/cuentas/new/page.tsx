"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { abrirCuentaV2, type TipoCuentaV2, type MonedaV2 } from "@/lib/api/v2/cuentas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-cuentas");
const TIPOS: TipoCuentaV2[] = ["ahorro", "corriente"];
const MONEDAS: MonedaV2[] = ["PYG", "USD"];

export default function NuevaCuentaV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuentaV2>("ahorro");
  const [moneda, setMoneda] = useState<MonedaV2>("PYG");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const cuenta = await abrirCuentaV2({ usuarioId: Number(usuarioId), tipoCuenta, moneda });
      router.push(`/v2/cuentas/${cuenta.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-cuentas" title="Abrir cuenta" />

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
          <label htmlFor="tipoCuenta">Tipo de cuenta</label>
          <select
            id="tipoCuenta"
            value={tipoCuenta}
            onChange={(e) => setTipoCuenta(e.target.value as TipoCuentaV2)}
            data-testid={ids.field("tipoCuenta")}
          >
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="moneda">Moneda</label>
          <select
            id="moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as MonedaV2)}
            data-testid={ids.field("moneda")}
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
          El número de cuenta se genera automáticamente y el saldo arranca en 0.
        </p>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Abriendo..." : "Abrir cuenta"}
        </button>
      </form>
    </div>
  );
}
