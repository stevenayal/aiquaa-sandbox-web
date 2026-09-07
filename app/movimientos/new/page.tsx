"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearMovimiento, type TipoMovimiento } from "@/lib/api/movimientos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("movimientos");

const TIPOS: TipoMovimiento[] = ["transferencia", "pago_factura", "compra_ecommerce", "cargo_tarjeta"];

export default function NuevoMovimientoPage() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("transferencia");
  const [monto, setMonto] = useState("");
  const [referenciaId, setReferenciaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const movimiento = await crearMovimiento({
        usuarioId: Number(usuarioId),
        tipoMovimiento,
        monto: Number(monto),
        referenciaId: referenciaId.trim() ? Number(referenciaId) : undefined,
        descripcion: descripcion.trim() || undefined,
      });
      router.push(`/movimientos/${movimiento.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el movimiento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="movimientos" title="Nuevo movimiento" />

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
          <label htmlFor="tipoMovimiento">Tipo de movimiento</label>
          <select
            id="tipoMovimiento"
            value={tipoMovimiento}
            onChange={(e) => setTipoMovimiento(e.target.value as TipoMovimiento)}
            data-testid={ids.field("tipoMovimiento")}
          >
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            data-testid={ids.field("monto")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="referenciaId">ID de referencia (opcional)</label>
          <input
            id="referenciaId"
            value={referenciaId}
            onChange={(e) => setReferenciaId(e.target.value)}
            data-testid={ids.field("referenciaId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            data-testid={ids.field("descripcion")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("monto")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear movimiento"}
        </button>
      </form>
    </div>
  );
}
