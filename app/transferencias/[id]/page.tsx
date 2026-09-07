"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getTransferencia, actualizarTransferencia, eliminarTransferencia } from "@/lib/api/transferencias";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("transferencias");

function badgeClass(estado: string): string {
  if (estado === "completada") return shared.badgeSuccess;
  if (estado === "rechazada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function TransferenciaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: transferencia, error, isLoading, mutate } = useSWR(["transferencia", id], () =>
    getTransferencia(id),
  );

  const [cuentaOrigenId, setCuentaOrigenId] = useState("");
  const [cuentaDestinoId, setCuentaDestinoId] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (transferencia && !initialized) {
    setCuentaOrigenId(String(transferencia.cuenta_origen_id));
    setCuentaDestinoId(String(transferencia.cuenta_destino_id));
    setMonto(String(transferencia.monto));
    setDescripcion(transferencia.descripcion ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarTransferencia(id, {
        cuentaOrigenId: Number(cuentaOrigenId),
        cuentaDestinoId: Number(cuentaDestinoId),
        monto: Number(monto),
        descripcion: descripcion.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="transferencias" title={`Transferencia #${id}`}>
        <Link href="/transferencias" className={shared.buttonSecondary}>
          Nueva transferencia
        </Link>
      </ModuleHeader>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {transferencia && (
          <>
            <p role="status" className={shared.success} data-testid={ids.success}>
              Transferencia creada.
            </p>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Cuenta origen</dt>
                <dd>
                  <Link href={`/cuentas/${transferencia.cuenta_origen_id}`}>
                    {transferencia.cuenta_origen_id}
                  </Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta destino</dt>
                <dd>
                  <Link href={`/cuentas/${transferencia.cuenta_destino_id}`}>
                    {transferencia.cuenta_destino_id}
                  </Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>{transferencia.monto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Descripción</dt>
                <dd>{transferencia.descripcion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(transferencia.estado)}>{transferencia.estado}</span>
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar transferencia</h2>
              <div className={shared.field}>
                <label htmlFor="cuentaOrigenId">Cuenta origen (id)</label>
                <input
                  id="cuentaOrigenId"
                  type="number"
                  required
                  value={cuentaOrigenId}
                  onChange={(e) => setCuentaOrigenId(e.target.value)}
                  data-testid={ids.field("cuentaOrigenId")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="cuentaDestinoId">Cuenta destino (id)</label>
                <input
                  id="cuentaDestinoId"
                  type="number"
                  required
                  value={cuentaDestinoId}
                  onChange={(e) => setCuentaDestinoId(e.target.value)}
                  data-testid={ids.field("cuentaDestinoId")}
                />
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
                <label htmlFor="descripcion">Descripción</label>
                <input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  data-testid={ids.field("descripcion")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("cuentaOrigenId")}>
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
              title="¿Eliminar esta transferencia?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar transferencia"
              onDelete={() => eliminarTransferencia(id)}
              onDeleted={() => router.push("/transferencias")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
