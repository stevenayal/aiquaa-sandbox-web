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
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { RadioCards } from "@/components/form/RadioCards";
import { Pagination, SortableTh } from "@/components/list/ListControls";
import { useToast } from "@/components/Toast";
import { Fecha, Monto } from "@/components/Valores";
import {
  getCuentaV2,
  actualizarCuentaV2,
  eliminarCuentaV2,
  cambiarEstadoCuentaV2,
  listMovimientosCuentaV2,
  registrarMovimientoCuentaV2,
  type CuentaV2,
  type EstadoCuentaV2,
  type MonedaV2,
  type MovimientoCuentaV2,
  type TipoCuentaV2,
  type TipoMovimientoV2,
} from "@/lib/api/v2/cuentas";
import { ApiError } from "@/lib/api/http";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { ESTADO_CUENTA_LABEL, TIPO_CUENTA_LABEL, badgeFor } from "@/lib/v2/labels";
import { longitud, monto, opcional, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-cuentas");
const movIds = testIds("v2-cuentas-movimientos");

const REFERENCIA_LABEL: Record<MovimientoCuentaV2["referencia_tipo"], string> = {
  manual: "Ventanilla",
  transferencia: "Transferencia",
  prestamo: "Préstamo",
  ahorro: "Ahorro programado",
  deposito: "Depósito a plazo",
  tarjeta: "Tarjeta",
};

export default function CuentaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);

  const { data: cuenta, error, isLoading, mutate } = useSWR(["v2-cuenta", id], () => getCuentaV2(id));
  const {
    data: movimientos,
    error: movError,
    isLoading: movLoading,
    mutate: mutateMovimientos,
  } = useSWR(cuenta ? ["v2-cuenta-movimientos", id] : null, () => listMovimientosCuentaV2(id));

  const saldo = Number(cuenta?.saldo ?? 0);

  return (
    <div className={shared.page}>
      <Link href="/v2/cuentas" className={shared.backLink}>
        ← Cuentas
      </Link>
      <ModuleHeader
        moduleKey="v2-cuentas"
        title={cuenta ? `${TIPO_CUENTA_LABEL[cuenta.tipo_cuenta]} N° ${cuenta.numero_cuenta}` : `Cuenta #${id}`}
      />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {cuenta && (
          <>
            <div className={shared.stats} data-testid={ids.detail}>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Saldo disponible</span>
                <span className={shared.statValue}>
                  <Monto value={cuenta.saldo} moneda={cuenta.moneda} testId="v2-cuentas-detail-saldo" />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Estado</span>
                <span>
                  <span className={badgeFor(cuenta.estado)} data-testid="v2-cuentas-detail-estado" data-value={cuenta.estado}>
                    {ESTADO_CUENTA_LABEL[cuenta.estado]}
                  </span>
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Titular</span>
                <Link href={`/v2/usuarios/${cuenta.usuario_id}`} data-testid="v2-cuentas-detail-titular">
                  Cliente #{cuenta.usuario_id}
                </Link>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Abierta el</span>
                <Fecha value={cuenta.created_at} />
              </div>
            </div>

            <EstadoCuenta
              cuenta={cuenta}
              onChanged={async (updated, mensaje) => {
                await mutate(updated, { revalidate: false });
                toast.success(mensaje);
              }}
            />

            <div className={shared.twoColumns}>
              <section className={shared.section} aria-labelledby="mov-form-title">
                <h2 id="mov-form-title">Depósito o retiro</h2>
                {cuenta.estado === "activa" ? (
                  <MovimientoForm
                    cuenta={cuenta}
                    onDone={async (tipo, montoRegistrado) => {
                      await Promise.all([mutate(), mutateMovimientos()]);
                      toast.success(
                        `${tipo === "credito" ? "Depósito" : "Retiro"} de ${formatMonto(montoRegistrado, cuenta.moneda)} registrado.`,
                      );
                    }}
                  />
                ) : (
                  <p className={shared.notice} data-testid="v2-cuentas-movimiento-bloqueado">
                    La cuenta está {ESTADO_CUENTA_LABEL[cuenta.estado].toLowerCase()}: no admite depósitos ni retiros.
                  </p>
                )}
              </section>

              <EditarCuentaForm
                key={`${cuenta.id}-${cuenta.tipo_cuenta}-${cuenta.moneda}`}
                cuenta={cuenta}
                tieneMovimientos={(movimientos?.length ?? 0) > 0}
                onSaved={async (updated) => {
                  await mutate(updated, { revalidate: false });
                  toast.success("Cuenta actualizada.");
                }}
              />
            </div>

            <Movimientos
              movimientos={movimientos}
              moneda={cuenta.moneda}
              loading={movLoading}
              error={movError ?? null}
            />

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar esta cuenta?"
              description="Se da de baja y deja de aparecer en los listados."
              label="Eliminar cuenta"
              disabledReason={saldo !== 0 ? "Para eliminar la cuenta, el saldo tiene que ser 0." : null}
              onDelete={() => eliminarCuentaV2(id)}
              onDeleted={() => {
                toast.success("Cuenta eliminada.");
                router.push("/v2/cuentas");
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}

/** Acciones de estado según la máquina de estados de la cuenta: `cerrada` es terminal. */
function EstadoCuenta({
  cuenta,
  onChanged,
}: {
  cuenta: CuentaV2;
  onChanged: (cuenta: CuentaV2, mensaje: string) => Promise<void>;
}) {
  const [pending, setPending] = useState<EstadoCuentaV2 | null>(null);
  const [confirm, setConfirm] = useState<EstadoCuentaV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saldo = Number(cuenta.saldo);

  async function cambiar(estado: EstadoCuentaV2) {
    setConfirm(null);
    setPending(estado);
    setError(null);
    try {
      const updated = await cambiarEstadoCuentaV2(cuenta.id, estado);
      const mensajes: Record<EstadoCuentaV2, string> = {
        activa: "Cuenta desbloqueada.",
        bloqueada: "Cuenta bloqueada.",
        cerrada: "Cuenta cerrada.",
      };
      await onChanged(updated, mensajes[estado]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setPending(null);
    }
  }

  if (cuenta.estado === "cerrada") {
    return (
      <p className={shared.info} data-testid={ids.rowAction(cuenta.id, "estado-terminal")}>
        Cuenta cerrada: es un estado final, no se puede reabrir ni operar.
      </p>
    );
  }

  const cerrarBloqueado = saldo !== 0;

  return (
    <section className={shared.section} aria-labelledby="estado-title">
      <h2 id="estado-title">Estado de la cuenta</h2>
      <div className={shared.formActions}>
        {cuenta.estado === "activa" ? (
          <button
            type="button"
            className={shared.buttonSecondary}
            disabled={pending !== null}
            onClick={() => setConfirm("bloqueada")}
            data-testid={ids.rowAction(cuenta.id, "bloquear")}
          >
            {pending === "bloqueada" ? "Bloqueando..." : "Bloquear cuenta"}
          </button>
        ) : (
          <button
            type="button"
            className={shared.button}
            disabled={pending !== null}
            onClick={() => cambiar("activa")}
            data-testid={ids.rowAction(cuenta.id, "desbloquear")}
          >
            {pending === "activa" ? "Desbloqueando..." : "Desbloquear cuenta"}
          </button>
        )}
        <button
          type="button"
          className={shared.buttonDanger}
          disabled={pending !== null || cerrarBloqueado}
          aria-describedby={cerrarBloqueado ? "cerrar-hint" : undefined}
          onClick={() => setConfirm("cerrada")}
          data-testid={ids.rowAction(cuenta.id, "cerrar")}
        >
          {pending === "cerrada" ? "Cerrando..." : "Cerrar cuenta"}
        </button>
      </div>
      {cerrarBloqueado && (
        <p id="cerrar-hint" className={shared.hint} data-testid={ids.rowAction(cuenta.id, "cerrar-hint")}>
          Para cerrar la cuenta, primero retirá o transferí el saldo ({formatMonto(cuenta.saldo, cuenta.moneda)}).
        </p>
      )}
      {error && (
        <p role="alert" className={shared.formError} data-testid={ids.rowAction(cuenta.id, "estado-error")}>
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirm === "bloqueada"}
        title="¿Bloquear esta cuenta?"
        description="Mientras esté bloqueada no va a admitir depósitos, retiros ni transferencias. Podés desbloquearla después."
        confirmLabel="Bloquear"
        danger
        testId={ids.rowAction(cuenta.id, "bloquear")}
        onCancel={() => setConfirm(null)}
        onConfirm={() => cambiar("bloqueada")}
      />
      <ConfirmDialog
        open={confirm === "cerrada"}
        title="¿Cerrar esta cuenta?"
        description="Es definitivo: una cuenta cerrada no se puede reabrir."
        confirmLabel="Cerrar cuenta"
        danger
        testId={ids.rowAction(cuenta.id, "cerrar")}
        onCancel={() => setConfirm(null)}
        onConfirm={() => cambiar("cerrada")}
      />
    </section>
  );
}

function MovimientoForm({
  cuenta,
  onDone,
}: {
  cuenta: CuentaV2;
  onDone: (tipo: TipoMovimientoV2, monto: number) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const saldo = Number(cuenta.saldo);
  const form = useFormState({
    initial: { tipo: "credito", monto: "", descripcion: "" },
    ids: movIds,
    idPrefix: "mov-",
    validate: (v) =>
      validarCampos(v, {
        // Espejo de la API: un débito no puede dejar el saldo negativo.
        monto: [
          monto(
            v.tipo === "debito"
              ? { max: saldo, maxMessage: `Saldo insuficiente: el disponible es ${formatMonto(saldo, cuenta.moneda)}.` }
              : {},
          ),
        ],
        descripcion: [opcional(longitud({ max: 60, label: "La descripción" }))],
      }),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    const tipo = form.values.tipo as TipoMovimientoV2;
    const montoNum = Number(form.values.monto);
    try {
      await registrarMovimientoCuentaV2(cuenta.id, {
        tipo,
        monto: montoNum,
        descripcion: form.values.descripcion.trim() || undefined,
      });
      form.reset({ tipo, monto: "", descripcion: "" });
      await onDone(tipo, montoNum);
    } catch (err) {
      form.applyApiError(err, [{ field: "monto", when: (e) => e.message.includes("Saldo insuficiente") }], "No se pudo registrar el movimiento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={movIds.form}>
      <RadioCards
        form={form}
        name="tipo"
        legend="Operación"
        options={[
          { value: "credito", label: "Depósito", description: "Suma al saldo." },
          { value: "debito", label: "Retiro", description: "Resta del saldo." },
        ]}
      />
      <Field
        form={form}
        name="monto"
        label="Monto"
        hint={form.values.tipo === "debito" ? `Disponible: ${formatMonto(cuenta.saldo, cuenta.moneda)}` : undefined}
      >
        <MontoInput {...form.controlProps("monto", { hint: form.values.tipo === "debito" })} moneda={cuenta.moneda} />
      </Field>
      <Field form={form} name="descripcion" label="Descripción (opcional)">
        <input {...form.fieldProps("descripcion")} maxLength={80} />
      </Field>
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting} data-testid={movIds.submit}>
        {submitting ? "Registrando..." : form.values.tipo === "debito" ? "Registrar retiro" : "Registrar depósito"}
      </button>
    </form>
  );
}

function EditarCuentaForm({
  cuenta,
  tieneMovimientos,
  onSaved,
}: {
  cuenta: CuentaV2;
  tieneMovimientos: boolean;
  onSaved: (cuenta: CuentaV2) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: { tipoCuenta: cuenta.tipo_cuenta as string, moneda: cuenta.moneda as string },
    ids,
    idPrefix: "edit-",
    validate: () => ({}),
  });
  const cerrada = cuenta.estado === "cerrada";
  // UI: cambiar la moneda de una cuenta con historial reinterpretaría todos sus montos. La API lo permite.
  const monedaBloqueada = tieneMovimientos || Number(cuenta.saldo) !== 0;
  const sinCambios = form.values.tipoCuenta === cuenta.tipo_cuenta && form.values.moneda === cuenta.moneda;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const updated = await actualizarCuentaV2(cuenta.id, {
        tipoCuenta: form.values.tipoCuenta as TipoCuentaV2,
        moneda: form.values.moneda as MonedaV2,
      });
      await onSaved(updated);
    } catch (err) {
      form.applyApiError(err, [], "No se pudo actualizar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(cuenta.id, "edit-form")}>
      <h2>Datos de la cuenta</h2>
      <Field form={form} name="tipoCuenta" label="Tipo de cuenta">
        <select {...form.fieldProps("tipoCuenta")} disabled={cerrada}>
          <option value="ahorro">{TIPO_CUENTA_LABEL.ahorro}</option>
          <option value="corriente">{TIPO_CUENTA_LABEL.corriente}</option>
        </select>
      </Field>
      <Field
        form={form}
        name="moneda"
        label="Moneda"
        hint={monedaBloqueada ? "La moneda solo se puede cambiar en una cuenta sin saldo ni movimientos." : undefined}
      >
        <select {...form.fieldProps("moneda", { hint: monedaBloqueada })} disabled={cerrada || monedaBloqueada}>
          <option value="PYG">Guaraníes (PYG)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </Field>
      <FormError form={form} />
      <button
        type="submit"
        className={shared.button}
        disabled={submitting || sinCambios || cerrada}
        data-testid={ids.rowAction(cuenta.id, "edit-submit")}
      >
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

/** Extracto: débitos y créditos en columnas separadas, filtro por tipo y paginación (`?movTipo=&movPage=`). */
function Movimientos({
  movimientos,
  moneda,
  loading,
  error,
}: {
  movimientos: MovimientoCuentaV2[] | undefined;
  moneda: MonedaV2;
  loading: boolean;
  error: Error | null;
}) {
  const [tipo, setTipo] = useQueryParam("movTipo", "movPage");
  const filtrados = tipo ? movimientos?.filter((m) => m.tipo === tipo) : movimientos;
  const list = useListControls<MovimientoCuentaV2>(filtrados, {
    prefix: "mov",
    sorters: { fecha: (m) => m.created_at, monto: (m) => Number(m.monto) },
    defaultSort: { key: "fecha", dir: "desc" },
  });

  return (
    <section className={shared.section} aria-labelledby="movimientos-title">
      <div className={shared.header}>
        <h2 id="movimientos-title">Movimientos</h2>
        <div className={shared.field}>
          <label htmlFor="movTipo">Tipo</label>
          <select id="movTipo" value={tipo} onChange={(e) => setTipo(e.target.value)} data-testid={movIds.field("tipoFiltro")}>
            <option value="">Todos</option>
            <option value="credito">Créditos</option>
            <option value="debito">Débitos</option>
          </select>
        </div>
      </div>
      <DataState
        loading={loading}
        error={error}
        empty={list.filteredCount === 0}
        emptyMessage="Sin movimientos."
        count={list.filteredCount}
        countTestId={movIds.count}
        loadingTestId={movIds.loading}
        errorTestId={movIds.error}
        emptyTestId={movIds.empty}
      >
        <div className={shared.tableWrap}>
          <table className={shared.table} data-testid={movIds.list}>
            <thead>
              <tr>
                <SortableTh controls={list} ids={movIds} column="fecha">
                  Fecha
                </SortableTh>
                <th>Descripción</th>
                <th>Origen</th>
                <th className={shared.numeric}>Débito</th>
                <th className={shared.numeric}>Crédito</th>
                <th className={shared.numeric}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((m) => (
                <tr key={m.id} data-testid={movIds.row(m.id)} data-tipo={m.tipo}>
                  <td>
                    <Fecha value={m.created_at} conHora />
                  </td>
                  <td>{m.descripcion ?? "—"}</td>
                  <td>{REFERENCIA_LABEL[m.referencia_tipo]}</td>
                  <td className={shared.numeric}>{m.tipo === "debito" ? <Monto value={m.monto} moneda={moneda} /> : ""}</td>
                  <td className={shared.numeric}>{m.tipo === "credito" ? <Monto value={m.monto} moneda={moneda} /> : ""}</td>
                  <td className={shared.numeric}>
                    <Monto value={m.saldo_posterior} moneda={moneda} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination controls={list} ids={movIds} total={list.filteredCount} />
      </DataState>
    </section>
  );
}
