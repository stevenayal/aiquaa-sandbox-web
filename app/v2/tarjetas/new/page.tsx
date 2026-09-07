"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { emitirTarjetaV2, type TipoTarjetaV2, type MarcaTarjetaV2 } from "@/lib/api/v2/tarjetas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-tarjetas");
const TIPOS: TipoTarjetaV2[] = ["credito", "debito"];
const MARCAS: MarcaTarjetaV2[] = ["visa", "mastercard", "amex"];

export default function NuevaTarjetaV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [cuentaId, setCuentaId] = useState("");
  const [tipo, setTipo] = useState<TipoTarjetaV2>("credito");
  const [marca, setMarca] = useState<MarcaTarjetaV2>("visa");
  const [limiteCredito, setLimiteCredito] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await emitirTarjetaV2({
        usuarioId: Number(usuarioId),
        cuentaId: cuentaId.trim() ? Number(cuentaId) : undefined,
        tipo,
        marca,
        limiteCredito: limiteCredito.trim() ? Number(limiteCredito) : undefined,
        fechaVencimiento,
      });
      router.push("/v2/tarjetas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo emitir la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-tarjetas" title="Emitir tarjeta" />

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
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            data-testid={ids.field("cuentaId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarjetaV2)} data-testid={ids.field("tipo")}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="marca">Marca</label>
          <select id="marca" value={marca} onChange={(e) => setMarca(e.target.value as MarcaTarjetaV2)} data-testid={ids.field("marca")}>
            {MARCAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="limiteCredito">Límite de crédito (opcional)</label>
          <input
            id="limiteCredito"
            type="number"
            min="0"
            step="0.01"
            value={limiteCredito}
            onChange={(e) => setLimiteCredito(e.target.value)}
            data-testid={ids.field("limiteCredito")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
          <input
            id="fechaVencimiento"
            type="date"
            required
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            data-testid={ids.field("fechaVencimiento")}
          />
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
          Una tarjeta de débito siempre nace con límite 0, sin importar lo que se indique arriba.
        </p>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Emitiendo..." : "Emitir tarjeta"}
        </button>
      </form>
    </div>
  );
}
