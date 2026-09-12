"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import {
  getMovimientoDetalle,
  actualizarMovimiento,
  eliminarMovimiento,
  type TipoMovimiento,
} from "@/lib/api/movimientos";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha, Monto } from "@/components/Valores";

const ids = testIds("movimientos");
const TIPOS: TipoMovimiento[] = ["transferencia", "pago_factura", "compra_ecommerce", "cargo_tarjeta"];

export default function MovimientoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: movimiento, error, isLoading, mutate } = useSWR(["movimiento", id], () =>
    getMovimientoDetalle(id),
  );

  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("transferencia");
  const [monto, setMonto] = useState("");
  const [referenciaId, setReferenciaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (movimiento && !initialized) {
    setTipoMovimiento(movimiento.tipo_movimiento);
    setMonto(String(movimiento.monto));
    setReferenciaId(movimiento.referencia_id ? String(movimiento.referencia_id) : "");
    setDescripcion(movimiento.descripcion ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarMovimiento(id, {
        tipoMovimiento,
        monto: Number(monto),
        referenciaId: referenciaId.trim() ? Number(referenciaId) : undefined,
        descripcion: descripcion.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el movimiento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="movimientos" title={`Movimiento #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {movimiento && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${movimiento.usuario_id}`}>{movimiento.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo</dt>
                <dd>{movimiento.tipo_movimiento}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>
                  <Monto value={movimiento.monto} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Referencia</dt>
                <dd>{movimiento.referencia_id ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Descripción</dt>
                <dd>{movimiento.descripcion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha</dt>
                <dd>
                  <Fecha value={movimiento.created_at} conHora />
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar movimiento</h2>
              <div className={shared.field}>
                <label htmlFor="tipoMovimiento">Tipo</label>
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
                <label htmlFor="referenciaId">ID de referencia</label>
                <input
                  id="referenciaId"
                  value={referenciaId}
                  onChange={(e) => setReferenciaId(e.target.value)}
                  data-testid={ids.field("referenciaId")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="descripcion">Descripción</label>
                <input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  data-testid={ids.field("descripcion")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("monto")}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "edit-submit")}
              >
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar este movimiento?"
              description="Se marcará como inactivo y dejará de listarse y de sumar en los reportes."
              label="Eliminar movimiento"
              onDelete={() => eliminarMovimiento(id)}
              onDeleted={() => router.push("/movimientos")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
