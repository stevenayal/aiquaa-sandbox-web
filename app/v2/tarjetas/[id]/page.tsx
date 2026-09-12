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
import { Fecha, Monto } from "@/components/Valores";
import {
  getTarjetaV2,
  actualizarTarjetaV2,
  eliminarTarjetaV2,
  bloquearTarjetaV2,
  activarTarjetaV2,
  cambiarLimiteTarjetaV2,
  type EstadoTarjetaV2,
  type MarcaTarjetaV2,
} from "@/lib/api/v2/tarjetas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-tarjetas");
const MARCAS: MarcaTarjetaV2[] = ["visa", "mastercard", "amex"];

function badgeClass(estado: EstadoTarjetaV2): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "bloqueada") return shared.badgeDanger;
  return shared.badgeWarning;
}

/**
 * Detalle de una tarjeta del curso 2. El listado ya resuelve bloquear /
 * activar / cambiar límite inline, pero `GET /v2/tarjetas/{id}` y su `PUT` no
 * tenían pantalla: sin esto no había forma de editar marca ni vencimiento, ni
 * de dar de baja una tarjeta desde la UI.
 */
export default function TarjetaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: tarjeta, error, isLoading, mutate } = useSWR(["v2-tarjeta", id], () => getTarjetaV2(id));

  const [marca, setMarca] = useState<MarcaTarjetaV2>("visa");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [limiteCredito, setLimiteCredito] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [limiteSubmitting, setLimiteSubmitting] = useState(false);
  const [estadoSubmitting, setEstadoSubmitting] = useState(false);
  const [confirmBloquear, setConfirmBloquear] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (tarjeta && !initialized) {
    setMarca(tarjeta.marca);
    // El backend devuelve la fecha completa; el input date pide yyyy-MM-dd.
    setFechaVencimiento(tarjeta.fecha_vencimiento.slice(0, 10));
    setLimiteCredito(tarjeta.limite_credito);
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarTarjetaV2(id, { marca, fechaVencimiento });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLimite(event: FormEvent) {
    event.preventDefault();
    setLimiteSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await cambiarLimiteTarjetaV2(id, Number(limiteCredito));
      await mutate(updated, { revalidate: false });
      setActionSuccess("Límite actualizado.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo cambiar el límite.");
    } finally {
      setLimiteSubmitting(false);
    }
  }

  async function handleEstado(action: "bloquear" | "activar") {
    setEstadoSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await (action === "bloquear" ? bloquearTarjetaV2(id) : activarTarjetaV2(id));
      await mutate(updated, { revalidate: false });
      setActionSuccess(action === "bloquear" ? "Tarjeta bloqueada." : "Tarjeta activada.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setEstadoSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-tarjetas" title={`Tarjeta #${id}`} />

      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      {actionSuccess && (
        <p role="status" className={shared.success} data-testid={ids.success}>
          {actionSuccess}
        </p>
      )}

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {tarjeta && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Cliente</dt>
                <dd>
                  <Link href={`/v2/usuarios/${tarjeta.usuario_id}`}>{tarjeta.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta</dt>
                <dd>
                  {tarjeta.cuenta_id !== null ? (
                    <Link href={`/v2/cuentas/${tarjeta.cuenta_id}`}>{tarjeta.cuenta_id}</Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo</dt>
                <dd>{tarjeta.tipo}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Marca</dt>
                <dd>{tarjeta.marca}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número</dt>
                <dd>{tarjeta.numero_enmascarado}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Límite de crédito</dt>
                <dd>
                  <Monto value={tarjeta.limite_credito} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Utilizado</dt>
                <dd>
                  <Monto value={tarjeta.saldo_utilizado} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Disponible</dt>
                <dd>
                  <Monto value={tarjeta.disponible} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(tarjeta.estado)}>{tarjeta.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Vencimiento</dt>
                <dd>
                  <Fecha value={tarjeta.fecha_vencimiento} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Alta</dt>
                <dd>
                  <Fecha value={tarjeta.created_at} conHora />
                </dd>
              </div>
            </dl>

            <div className={`${shared.card} ${shared.rowActions}`}>
              <button
                type="button"
                className={shared.buttonSecondary}
                disabled={tarjeta.estado !== "activa" || estadoSubmitting}
                onClick={() => setConfirmBloquear(true)}
                data-testid={ids.rowAction(id, "bloquear")}
              >
                {estadoSubmitting ? "Actualizando..." : "Bloquear"}
              </button>
              <button
                type="button"
                className={shared.buttonSecondary}
                disabled={tarjeta.estado !== "bloqueada" || estadoSubmitting}
                onClick={() => handleEstado("activar")}
                data-testid={ids.rowAction(id, "activar")}
              >
                {estadoSubmitting ? "Actualizando..." : "Activar"}
              </button>
            </div>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar tarjeta</h2>
              <div className={shared.field}>
                <label htmlFor="marca">Marca</label>
                <select
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value as MarcaTarjetaV2)}
                  data-testid={ids.field("edit-marca")}
                >
                  {MARCAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.field}>
                <label htmlFor="fechaVencimiento">Vencimiento</label>
                <input
                  id="fechaVencimiento"
                  type="date"
                  required
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  data-testid={ids.field("edit-fechaVencimiento")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("edit-marca")}>
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

            {tarjeta.tipo === "credito" && (
              <form className={shared.formGrid} onSubmit={handleLimite} data-testid={ids.rowAction(id, "limite-form")}>
                <h2>Cambiar límite</h2>
                <div className={shared.field}>
                  <label htmlFor="limiteCredito">Límite de crédito</label>
                  <input
                    id="limiteCredito"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={limiteCredito}
                    onChange={(e) => setLimiteCredito(e.target.value)}
                    data-testid={ids.field("limite")}
                  />
                </div>
                <button
                  type="submit"
                  className={shared.button}
                  disabled={limiteSubmitting}
                  data-testid={ids.rowAction(id, "limite")}
                >
                  {limiteSubmitting ? "Actualizando..." : "Cambiar límite"}
                </button>
              </form>
            )}

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar esta tarjeta?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar tarjeta"
              onDelete={() => eliminarTarjetaV2(id)}
              onDeleted={() => router.push("/v2/tarjetas")}
            />
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={confirmBloquear}
        title="¿Bloquear esta tarjeta?"
        description="La tarjeta dejará de poder usarse hasta que la actives de nuevo."
        confirmLabel="Bloquear"
        danger
        testId={ids.rowAction(id, "bloquear")}
        onCancel={() => setConfirmBloquear(false)}
        onConfirm={() => {
          setConfirmBloquear(false);
          handleEstado("bloquear");
        }}
      />
    </div>
  );
}
