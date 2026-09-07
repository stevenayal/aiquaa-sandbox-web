"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getPrestamoV2,
  actualizarPrestamoV2,
  eliminarPrestamoV2,
  aprobarPrestamoV2,
  listCuotasPrestamoV2,
  pagarCuotaPrestamoV2,
  type EstadoPrestamoV2,
  type EstadoCuotaV2,
} from "@/lib/api/v2/prestamos";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-prestamos");

function badgeClass(estado: EstadoPrestamoV2): string {
  if (estado === "aprobado") return shared.badgeSuccess;
  if (estado === "rechazado") return shared.badgeDanger;
  if (estado === "pagado") return shared.badge;
  return shared.badgeWarning;
}

function cuotaBadgeClass(estado: EstadoCuotaV2): string {
  if (estado === "pagada") return shared.badgeSuccess;
  if (estado === "vencida") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function PrestamoV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: prestamo, error, isLoading, mutate } = useSWR(["v2-prestamo", id], () => getPrestamoV2(id));
  const {
    data: cuotas,
    error: cuotasError,
    isLoading: cuotasLoading,
    mutate: mutateCuotas,
  } = useSWR(["v2-prestamo-cuotas", id], () => listCuotasPrestamoV2(id));

  const [montoSolicitado, setMontoSolicitado] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmAprobar, setConfirmAprobar] = useState(false);
  const [aprobando, setAprobando] = useState(false);
  const [aprobarError, setAprobarError] = useState<string | null>(null);

  const [pendingNumero, setPendingNumero] = useState<number | null>(null);
  const [pagarError, setPagarError] = useState<string | null>(null);

  if (prestamo && !initialized) {
    setMontoSolicitado(prestamo.monto_solicitado);
    setTasaInteres(prestamo.tasa_interes);
    setPlazoMeses(String(prestamo.plazo_meses));
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarPrestamoV2(id, {
        montoSolicitado: Number(montoSolicitado),
        tasaInteres: Number(tasaInteres),
        plazoMeses: Number(plazoMeses),
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el préstamo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAprobar() {
    setConfirmAprobar(false);
    setAprobando(true);
    setAprobarError(null);
    try {
      await aprobarPrestamoV2(id);
      await Promise.all([mutate(), mutateCuotas()]);
    } catch (err) {
      setAprobarError(err instanceof ApiError ? err.message : "No se pudo aprobar el préstamo.");
    } finally {
      setAprobando(false);
    }
  }

  async function handlePagar(numero: number) {
    setPendingNumero(numero);
    setPagarError(null);
    try {
      await pagarCuotaPrestamoV2(id, numero);
      await Promise.all([mutate(), mutateCuotas()]);
    } catch (err) {
      setPagarError(err instanceof ApiError ? err.message : "No se pudo pagar la cuota.");
    } finally {
      setPendingNumero(null);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-prestamos" title={`Préstamo #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {prestamo && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/v2/usuarios/${prestamo.usuario_id}`}>{prestamo.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto solicitado</dt>
                <dd>{prestamo.monto_solicitado}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tasa de interés</dt>
                <dd>{prestamo.tasa_interes}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Plazo (meses)</dt>
                <dd>{prestamo.plazo_meses}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Saldo pendiente</dt>
                <dd>{prestamo.saldo_pendiente}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(prestamo.estado)}>{prestamo.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Creado</dt>
                <dd>{new Date(prestamo.created_at).toLocaleString()}</dd>
              </div>
            </dl>

            {prestamo.estado === "solicitado" && (
              <div className={shared.card}>
                <h2>Aprobar préstamo</h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
                  Genera el plan de cuotas y bloquea la edición del monto, la tasa y el plazo.
                </p>
                {aprobarError && (
                  <p role="alert" className={shared.fieldError}>
                    {aprobarError}
                  </p>
                )}
                <button
                  type="button"
                  className={shared.button}
                  disabled={aprobando}
                  onClick={() => setConfirmAprobar(true)}
                  data-testid={ids.rowAction(id, "aprobar")}
                >
                  {aprobando ? "Aprobando..." : "Aprobar préstamo"}
                </button>
              </div>
            )}

            <div className={shared.card}>
              <h2>Plan de cuotas</h2>
              {pagarError && (
                <p role="alert" className={shared.fieldError}>
                  {pagarError}
                </p>
              )}
              <DataState
                loading={cuotasLoading}
                error={cuotasError ?? null}
                empty={(cuotas?.length ?? 0) === 0}
                loadingTestId={`${ids.rowAction(id, "cuotas")}-loading`}
                errorTestId={`${ids.rowAction(id, "cuotas")}-error`}
                emptyTestId={`${ids.rowAction(id, "cuotas")}-empty`}
              >
                <table className={shared.table} data-testid={ids.rowAction(id, "cuotas-list")}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Monto</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Fecha de pago</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas?.map((cuota) => (
                      <tr key={cuota.numero_cuota} data-testid={ids.row(`${id}-${cuota.numero_cuota}`)}>
                        <td>{cuota.numero_cuota}</td>
                        <td>{cuota.monto}</td>
                        <td>{new Date(cuota.fecha_vencimiento).toLocaleDateString()}</td>
                        <td>
                          <span className={cuotaBadgeClass(cuota.estado)}>{cuota.estado}</span>
                        </td>
                        <td>{cuota.fecha_pago ? new Date(cuota.fecha_pago).toLocaleDateString() : "—"}</td>
                        <td className={shared.rowActions}>
                          <button
                            type="button"
                            className={shared.buttonSecondary}
                            disabled={cuota.estado === "pagada" || pendingNumero !== null}
                            onClick={() => handlePagar(cuota.numero_cuota)}
                            data-testid={ids.rowAction(`${id}-${cuota.numero_cuota}`, "pagar")}
                          >
                            {pendingNumero === cuota.numero_cuota ? "Pagando..." : "Pagar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataState>
            </div>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar préstamo</h2>
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
                  data-testid={ids.field("edit-montoSolicitado")}
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
                  data-testid={ids.field("edit-tasaInteres")}
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
                  data-testid={ids.field("edit-plazoMeses")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("edit-montoSolicitado")}>
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
              title="¿Eliminar este préstamo?"
              description="Falla si todavía hay saldo pendiente."
              label="Eliminar préstamo"
              onDelete={() => eliminarPrestamoV2(id)}
              onDeleted={() => router.push("/v2/prestamos")}
            />

            <ConfirmDialog
              open={confirmAprobar}
              title="¿Aprobar este préstamo?"
              description="Se generará el plan de cuotas y ya no se podrá editar el monto/tasa/plazo."
              confirmLabel="Aprobar"
              testId={ids.rowAction(id, "aprobar")}
              onCancel={() => setConfirmAprobar(false)}
              onConfirm={handleAprobar}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
