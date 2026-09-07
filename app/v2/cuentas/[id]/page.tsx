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
  getCuentaV2,
  actualizarCuentaV2,
  eliminarCuentaV2,
  cambiarEstadoCuentaV2,
  listMovimientosCuentaV2,
  registrarMovimientoCuentaV2,
  type TipoCuentaV2,
  type MonedaV2,
  type EstadoCuentaV2,
  type TipoMovimientoV2,
} from "@/lib/api/v2/cuentas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-cuentas");
const TIPOS: TipoCuentaV2[] = ["ahorro", "corriente"];
const MONEDAS: MonedaV2[] = ["PYG", "USD"];
const ESTADOS: EstadoCuentaV2[] = ["activa", "bloqueada", "cerrada"];

function badgeClass(estado: EstadoCuentaV2): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "cerrada") return shared.badgeDanger;
  return shared.badgeWarning;
}

function MovimientosSection({ cuentaId }: { cuentaId: number }) {
  const { data: movimientos, error, isLoading, mutate } = useSWR(["v2-cuenta-movimientos", cuentaId], () =>
    listMovimientosCuentaV2(cuentaId),
  );
  const [tipo, setTipo] = useState<TipoMovimientoV2>("credito");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await registrarMovimientoCuentaV2(cuentaId, {
        tipo,
        monto: Number(monto),
        descripcion: descripcion.trim() || undefined,
      });
      setMonto("");
      setDescripcion("");
      await mutate();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.card}>
      <h2>Movimientos</h2>
      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(movimientos?.length ?? 0) === 0}
        loadingTestId={`${ids.rowAction(cuentaId, "movimientos")}-loading`}
        errorTestId={`${ids.rowAction(cuentaId, "movimientos")}-error`}
        emptyTestId={`${ids.rowAction(cuentaId, "movimientos")}-empty`}
      >
        <table className={shared.table} data-testid={ids.rowAction(cuentaId, "movimientos-list")}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Saldo posterior</th>
              <th>Descripción</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movimientos?.map((m) => (
              <tr key={m.id}>
                <td>
                  <span className={m.tipo === "credito" ? shared.badgeSuccess : shared.badgeWarning}>{m.tipo}</span>
                </td>
                <td>{m.monto}</td>
                <td>{m.saldo_posterior}</td>
                <td>{m.descripcion ?? "—"}</td>
                <td>{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(cuentaId, "movimiento-form")}>
        <h3>Registrar depósito o retiro</h3>
        <div className={shared.field}>
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimientoV2)}
            data-testid={ids.field("movimiento-tipo")}
          >
            <option value="credito">Depósito (crédito)</option>
            <option value="debito">Retiro (débito)</option>
          </select>
        </div>
        <div className={shared.field}>
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            data-testid={ids.field("movimiento-monto")}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            data-testid={ids.field("movimiento-descripcion")}
          />
        </div>

        {formError && (
          <p role="alert" className={shared.fieldError}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          className={shared.button}
          disabled={submitting}
          data-testid={ids.rowAction(cuentaId, "movimiento-submit")}
        >
          {submitting ? "Registrando..." : "Registrar movimiento"}
        </button>
      </form>
    </div>
  );
}

export default function CuentaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: cuenta, error, isLoading, mutate } = useSWR(["v2-cuenta", id], () => getCuentaV2(id));

  const [tipoCuenta, setTipoCuenta] = useState<TipoCuentaV2>("ahorro");
  const [moneda, setMoneda] = useState<MonedaV2>("PYG");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [nuevoEstado, setNuevoEstado] = useState<EstadoCuentaV2>("activa");
  const [estadoSubmitting, setEstadoSubmitting] = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const [confirmCerrar, setConfirmCerrar] = useState(false);

  if (cuenta && !initialized) {
    setTipoCuenta(cuenta.tipo_cuenta);
    setMoneda(cuenta.moneda);
    setNuevoEstado(cuenta.estado);
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarCuentaV2(id, { tipoCuenta, moneda });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function applyEstadoChange(estado: EstadoCuentaV2) {
    setEstadoSubmitting(true);
    setEstadoError(null);
    try {
      const updated = await cambiarEstadoCuentaV2(id, estado);
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setEstadoError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setEstadoSubmitting(false);
    }
  }

  function handleEstadoSubmit(event: FormEvent) {
    event.preventDefault();
    if (nuevoEstado === "cerrada") {
      setConfirmCerrar(true);
      return;
    }
    applyEstadoChange(nuevoEstado);
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-cuentas" title={`Cuenta #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {cuenta && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/v2/usuarios/${cuenta.usuario_id}`}>{cuenta.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número</dt>
                <dd>{cuenta.numero_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo</dt>
                <dd>{cuenta.tipo_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Moneda</dt>
                <dd>{cuenta.moneda}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Saldo</dt>
                <dd>{cuenta.saldo}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(cuenta.estado)}>{cuenta.estado}</span>
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleEstadoSubmit} data-testid={ids.rowAction(id, "estado-form")}>
              <h2>Cambiar estado</h2>
              <div className={shared.field}>
                <label htmlFor="estado">Nuevo estado</label>
                <select
                  id="estado"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as EstadoCuentaV2)}
                  data-testid={ids.field("estado")}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              {estadoError && (
                <p role="alert" className={shared.fieldError}>
                  {estadoError}
                </p>
              )}

              <button
                type="submit"
                className={nuevoEstado === "cerrada" ? shared.buttonDanger : shared.button}
                disabled={estadoSubmitting || nuevoEstado === cuenta.estado}
                data-testid={ids.rowAction(id, "estado-submit")}
              >
                {estadoSubmitting ? "Actualizando..." : "Cambiar estado"}
              </button>
            </form>

            <MovimientosSection cuentaId={id} />

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar cuenta</h2>
              <div className={shared.field}>
                <label htmlFor="tipoCuenta">Tipo de cuenta</label>
                <select
                  id="tipoCuenta"
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value as TipoCuentaV2)}
                  data-testid={ids.field("edit-tipoCuenta")}
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
                  data-testid={ids.field("edit-moneda")}
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError}>
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
              title="¿Eliminar esta cuenta?"
              description="Se marcará como inactiva. Falla si todavía tiene saldo."
              label="Eliminar cuenta"
              onDelete={() => eliminarCuentaV2(id)}
              onDeleted={() => router.push("/v2/cuentas")}
            />

            <ConfirmDialog
              open={confirmCerrar}
              title="¿Cerrar esta cuenta?"
              description="Es un estado terminal: no se puede reabrir. Requiere saldo en 0."
              confirmLabel="Cerrar cuenta"
              danger
              testId={ids.rowAction(id, "estado-cerrar")}
              onCancel={() => setConfirmCerrar(false)}
              onConfirm={() => {
                setConfirmCerrar(false);
                applyEstadoChange("cerrada");
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
