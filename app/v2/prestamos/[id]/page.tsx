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
import { ProgressBar } from "@/components/ProgressBar";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { useToast } from "@/components/Toast";
import { MONTO_PRESTAMO, PLAZOS_PRESTAMO, SimulacionPrestamo } from "@/components/v2/SimulacionPrestamo";
import { Fecha, Monto, Porcentaje } from "@/components/Valores";
import {
  getPrestamoV2,
  actualizarPrestamoV2,
  eliminarPrestamoV2,
  aprobarPrestamoV2,
  listCuotasPrestamoV2,
  pagarCuotaPrestamoV2,
  type CuotaPrestamoV2,
  type PrestamoV2,
} from "@/lib/api/v2/prestamos";
import { getCuentaV2 } from "@/lib/api/v2/cuentas";
import { ApiError } from "@/lib/api/http";
import { esAdmin } from "@/lib/auth/admin";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { cuotaVencida, moraPrestamo, round2, simularPrestamo, sumarMontos } from "@/lib/v2/reglas";
import { monto, parseMonto, requerido, tasa, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-prestamos");
const cuotaIds = testIds("v2-prestamos-cuotas");

export default function PrestamoV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);
  const { usuario, loading: usuarioLoading } = useUsuario();

  const { data: prestamo, error, isLoading, mutate } = useSWR(["v2-prestamo", id], () => getPrestamoV2(id));
  // UI: un cliente logueado solo ve sus propios préstamos; el admin ve todos.
  // La API no tiene titularidad (cualquier key lee cualquier préstamo), así que
  // la regla vive en la pantalla.
  const ajeno = !!prestamo && !!usuario && !esAdmin(usuario.email) && prestamo.usuario_id !== usuario.id;
  const visible = !!prestamo && !usuarioLoading && !ajeno;
  const {
    data: cuotas,
    error: cuotasError,
    isLoading: cuotasLoading,
    mutate: mutateCuotas,
  } = useSWR(visible && prestamo.estado !== "solicitado" ? ["v2-prestamo-cuotas", id] : null, () => listCuotasPrestamoV2(id));

  const [confirmAprobar, setConfirmAprobar] = useState(false);
  const [aprobando, setAprobando] = useState(false);
  const [aprobarError, setAprobarError] = useState<string | null>(null);

  if (ajeno) {
    return (
      <div className={shared.page}>
        <Link href="/v2/prestamos" className={shared.backLink}>
          ← Préstamos
        </Link>
        <ModuleHeader moduleKey="v2-prestamos" title={`Préstamo N° ${id}`} />
        <p role="alert" className={shared.formError} data-testid="v2-prestamos-acceso-denegado">
          Acceso denegado: este préstamo pertenece a otro cliente.
        </p>
      </div>
    );
  }

  if (!prestamo || !visible) {
    return (
      <div className={shared.page}>
        <ModuleHeader moduleKey="v2-prestamos" title={`Préstamo N° ${id}`} />
        <DataState loading={isLoading || usuarioLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
          {null}
        </DataState>
      </div>
    );
  }

  const montoNum = Number(prestamo.monto_solicitado);
  const total = round2(montoNum * (1 + Number(prestamo.tasa_interes) / 100));
  const saldo = Number(prestamo.saldo_pendiente);
  const pagado = prestamo.estado === "pagado" ? 100 : prestamo.estado === "aprobado" && total > 0 ? round2((1 - saldo / total) * 100) : 0;
  const simulacion = simularPrestamo(montoNum, Number(prestamo.tasa_interes), prestamo.plazo_meses);
  const mora = prestamo.estado === "aprobado" && cuotas ? moraPrestamo(cuotas) : null;

  async function aprobar() {
    setConfirmAprobar(false);
    setAprobando(true);
    setAprobarError(null);
    try {
      const { cuotas: generadas, ...aprobado } = await aprobarPrestamoV2(id);
      await mutate(aprobado, { revalidate: false });
      await mutateCuotas(generadas, { revalidate: false });
      toast.success(`Préstamo aprobado: ${generadas.length} cuotas generadas.`);
    } catch (err) {
      setAprobarError(err instanceof ApiError ? err.message : "No se pudo aprobar el préstamo.");
    } finally {
      setAprobando(false);
    }
  }

  return (
    <div className={shared.page}>
      <Link href="/v2/prestamos" className={shared.backLink}>
        ← Préstamos
      </Link>
      <ModuleHeader moduleKey="v2-prestamos" title={`Préstamo N° ${id}`} />

      <div className={shared.stats} data-testid={ids.detail}>
        <div className={shared.stat}>
          <span className={shared.statLabel}>Estado</span>
          <span>
            <span className={badgeFor(prestamo.estado)} data-testid="v2-prestamos-detail-estado" data-value={prestamo.estado}>
              {capitalizar(prestamo.estado)}
            </span>
            {mora?.enMora && (
              <>
                {" "}
                <span className={shared.badgeDanger} data-testid="v2-prestamos-detail-mora" data-value="en-mora">
                  En mora
                </span>
              </>
            )}
          </span>
        </div>
        {mora?.enMora && (
          <div className={shared.stat}>
            <span className={shared.statLabel}>Vencido sin pagar</span>
            <span className={shared.statValue}>
              <Monto value={mora.montoVencido.toFixed(2)} moneda="PYG" testId="v2-prestamos-detail-monto-vencido" />
            </span>
            <span className={shared.statLabel} data-testid="v2-prestamos-detail-cuotas-vencidas" data-value={mora.cuotasVencidas}>
              {mora.cuotasVencidas === 1 ? "1 cuota vencida" : `${mora.cuotasVencidas} cuotas vencidas`}
            </span>
          </div>
        )}
        <div className={shared.stat}>
          <span className={shared.statLabel}>Monto</span>
          <span className={shared.statValue}>
            <Monto value={prestamo.monto_solicitado} moneda="PYG" testId="v2-prestamos-detail-monto" />
          </span>
        </div>
        <div className={shared.stat}>
          <span className={shared.statLabel}>Saldo pendiente</span>
          <span className={shared.statValue}>
            <Monto value={prestamo.saldo_pendiente} moneda="PYG" testId="v2-prestamos-detail-saldo" />
          </span>
        </div>
        <div className={shared.stat}>
          <span className={shared.statLabel}>Condiciones</span>
          <span>
            <Porcentaje value={prestamo.tasa_interes} testId="v2-prestamos-detail-tasa" /> ·{" "}
            <span data-testid="v2-prestamos-detail-plazo">{prestamo.plazo_meses} meses</span>
          </span>
          <span className={shared.statLabel}>
            Titular <Link href={`/v2/usuarios/${prestamo.usuario_id}`}>Cliente #{prestamo.usuario_id}</Link>
            {prestamo.cuenta_id && (
              <>
                {" "}
                · Cuenta <Link href={`/v2/cuentas/${prestamo.cuenta_id}`}>#{prestamo.cuenta_id}</Link>
              </>
            )}
          </span>
        </div>
      </div>

      {prestamo.estado !== "solicitado" && (
        <ProgressBar value={pagado} label={`Pagado de ${formatMonto(total, "PYG")}`} tone="success" testId="v2-prestamos-detail-avance" />
      )}

      {prestamo.estado === "solicitado" && (
        <>
          <section className={shared.section} aria-labelledby="evaluacion-title">
            <h2 id="evaluacion-title">En evaluación</h2>
            <p className={shared.hint}>
              Mientras no se apruebe, las condiciones se pueden modificar. Al aprobar se genera el cronograma y ya no se puede editar.
            </p>
            <div className={shared.formActions}>
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
            {aprobarError && (
              <p role="alert" className={shared.formError} data-testid={ids.rowAction(id, "aprobar-error")}>
                {aprobarError}
              </p>
            )}
          </section>

          <div className={shared.twoColumns}>
            <EditarPrestamoForm
              key={`${prestamo.monto_solicitado}-${prestamo.tasa_interes}-${prestamo.plazo_meses}`}
              prestamo={prestamo}
              onSaved={async (updated) => {
                await mutate(updated, { revalidate: false });
                toast.success("Condiciones actualizadas.");
              }}
            />
            <SimulacionPrestamo simulacion={simulacion} testId="v2-prestamos-detail-simulacion" />
          </div>
        </>
      )}

      {prestamo.estado !== "solicitado" && (
        <Cuotas
          prestamo={prestamo}
          cuotas={cuotas}
          loading={cuotasLoading}
          error={cuotasError ?? null}
          onPagadas={async (resultados) => {
            const ultimo = resultados[resultados.length - 1];
            await Promise.all([mutate(ultimo.prestamo, { revalidate: false }), mutateCuotas()]);
            const total = formatMonto(sumarMontos(resultados.map((r) => r.cuota.monto)), "PYG");
            toast.success(
              ultimo.prestamo.estado === "pagado"
                ? "¡Última cuota pagada! El préstamo quedó en estado Pagado."
                : resultados.length === 1
                  ? `Cuota ${ultimo.cuota.numero_cuota} pagada.`
                  : `${resultados.length} cuotas pagadas por ${total}.`,
            );
          }}
        />
      )}

      <DeleteButton
        testId={ids.rowAction(id, "eliminar")}
        title={prestamo.estado === "solicitado" ? "¿Desistir de esta solicitud?" : "¿Eliminar este préstamo?"}
        description="Deja de aparecer en los listados."
        label={prestamo.estado === "solicitado" ? "Desistir de la solicitud" : "Eliminar préstamo"}
        disabledReason={saldo > 0 ? "No se puede eliminar un préstamo con saldo pendiente." : null}
        onDelete={() => eliminarPrestamoV2(id)}
        onDeleted={() => {
          toast.success("Préstamo eliminado.");
          router.push("/v2/prestamos");
        }}
      />

      <ConfirmDialog
        open={confirmAprobar}
        title="¿Aprobar este préstamo?"
        description={`Se generan ${prestamo.plazo_meses} cuotas de ${formatMonto(simulacion.cuota, "PYG")} (total ${formatMonto(simulacion.total, "PYG")}). Después no se pueden cambiar las condiciones.`}
        confirmLabel="Aprobar"
        testId={ids.rowAction(id, "aprobar")}
        onCancel={() => setConfirmAprobar(false)}
        onConfirm={aprobar}
      />
    </div>
  );
}

function EditarPrestamoForm({ prestamo, onSaved }: { prestamo: PrestamoV2; onSaved: (p: PrestamoV2) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: {
      montoSolicitado: Number(prestamo.monto_solicitado).toFixed(2),
      tasaInteres: Number(prestamo.tasa_interes).toFixed(2),
      plazoMeses: String(prestamo.plazo_meses),
    },
    ids,
    idPrefix: "edit-",
    validate: (v) =>
      validarCampos(v, {
        montoSolicitado: [
          monto({
            min: MONTO_PRESTAMO.min,
            max: MONTO_PRESTAMO.max,
            minMessage: `El monto mínimo es ${formatMonto(MONTO_PRESTAMO.min, "PYG")}.`,
            maxMessage: `El monto máximo es ${formatMonto(MONTO_PRESTAMO.max, "PYG")}.`,
          }),
        ],
        tasaInteres: [tasa],
        plazoMeses: [requerido("Elegí el plazo.")],
      }),
  });
  const plazos: number[] = PLAZOS_PRESTAMO.includes(prestamo.plazo_meses as (typeof PLAZOS_PRESTAMO)[number])
    ? [...PLAZOS_PRESTAMO]
    : [...PLAZOS_PRESTAMO, prestamo.plazo_meses].sort((a, b) => a - b);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await actualizarPrestamoV2(prestamo.id, {
        montoSolicitado: parseMonto(form.values.montoSolicitado) as number,
        tasaInteres: parseMonto(form.values.tasaInteres) as number,
        plazoMeses: Number(form.values.plazoMeses),
      });
      await onSaved(updated);
    } catch (err) {
      form.applyApiError(err, [], "No se pudieron actualizar las condiciones.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(prestamo.id, "edit-form")}>
      <h2>Modificar condiciones</h2>
      <Field form={form} name="montoSolicitado" label="Monto">
        <MontoInput {...form.controlProps("montoSolicitado")} moneda="PYG" />
      </Field>
      <Field form={form} name="plazoMeses" label="Plazo">
        <select {...form.fieldProps("plazoMeses")}>
          {plazos.map((p) => (
            <option key={p} value={p}>
              {p} meses
            </option>
          ))}
        </select>
      </Field>
      <Field form={form} name="tasaInteres" label="Interés total (%)">
        <input {...form.fieldProps("tasaInteres")} inputMode="decimal" />
      </Field>
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.rowAction(prestamo.id, "edit-submit")}>
        {submitting ? "Guardando..." : "Guardar condiciones"}
      </button>
    </form>
  );
}

/**
 * Cronograma. Reglas de la UI (la API acepta pagar cualquier cuota y no mira
 * la cuenta):
 * - las cuotas se pagan en orden: se puede pagar la próxima o seleccionar
 *   varias consecutivas desde la próxima, y se muestra la suma exacta;
 * - si el préstamo tiene cuenta asociada, el pago se rechaza cuando el saldo
 *   de esa cuenta no lo cubre.
 */
function Cuotas({
  prestamo,
  cuotas,
  loading,
  error,
  onPagadas,
}: {
  prestamo: PrestamoV2;
  cuotas: CuotaPrestamoV2[] | undefined;
  loading: boolean;
  error: Error | null;
  onPagadas: (r: Array<{ cuota: CuotaPrestamoV2; prestamo: PrestamoV2 }>) => Promise<void>;
}) {
  const [confirmar, setConfirmar] = useState<CuotaPrestamoV2[] | null>(null);
  const [pagando, setPagando] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState(0);
  const ordenadas = [...(cuotas ?? [])].sort((a, b) => a.numero_cuota - b.numero_cuota);
  const pendientes = prestamo.estado === "aprobado" ? ordenadas.filter((c) => c.estado !== "pagada") : [];
  const pagadas = ordenadas.filter((c) => c.estado === "pagada").length;
  const seleccionadas = pendientes.slice(0, Math.min(seleccion, pendientes.length));
  const totalSeleccion = sumarMontos(seleccionadas.map((c) => c.monto));

  const { data: cuenta } = useSWR(
    prestamo.cuenta_id && prestamo.estado === "aprobado" ? ["v2-cuenta", prestamo.cuenta_id] : null,
    () => getCuentaV2(prestamo.cuenta_id as number),
  );

  /** Marcar la cuota i selecciona también las anteriores; desmarcarla quita también las siguientes. */
  function toggle(indice: number, checked: boolean) {
    setPagoError(null);
    setSeleccion(checked ? indice + 1 : indice);
  }

  function pedirPago(lote: CuotaPrestamoV2[]) {
    setPagoError(null);
    const monto = sumarMontos(lote.map((c) => c.monto));
    if (cuenta && Number(cuenta.saldo) < monto) {
      setPagoError(
        `Fondos insuficientes: la cuenta #${cuenta.id} tiene ${formatMonto(cuenta.saldo, cuenta.moneda)} y el pago es de ${formatMonto(monto, "PYG")}.`,
      );
      return;
    }
    setConfirmar(lote);
  }

  async function pagar(lote: CuotaPrestamoV2[]) {
    setConfirmar(null);
    setPagando(true);
    setPagoError(null);
    const resultados: Array<{ cuota: CuotaPrestamoV2; prestamo: PrestamoV2 }> = [];
    try {
      for (const cuota of lote) {
        resultados.push(await pagarCuotaPrestamoV2(prestamo.id, cuota.numero_cuota));
      }
    } catch (err) {
      const motivo = err instanceof ApiError ? err.message : "No se pudo pagar la cuota.";
      setPagoError(resultados.length > 0 ? `Se pagaron ${resultados.length} de ${lote.length} cuotas. ${motivo}` : motivo);
    } finally {
      setPagando(false);
      setSeleccion(0);
    }
    if (resultados.length > 0) await onPagadas(resultados);
  }

  const lote = confirmar ?? [];
  const esLote = lote.length > 1;

  return (
    <section className={shared.section} aria-labelledby="cuotas-title">
      <div className={shared.header}>
        <h2 id="cuotas-title">Cronograma de cuotas</h2>
        {cuotas && (
          <span className={shared.hint} data-testid={cuotaIds.rowAction("resumen", "pagadas")}>
            {pagadas} de {cuotas.length} pagadas
          </span>
        )}
      </div>
      {prestamo.estado === "aprobado" && (
        <p className={shared.hint}>
          Las cuotas se pagan en orden: podés pagar la próxima o seleccionar varias seguidas desde la próxima.
          {cuenta && (
            <>
              {" "}
              Se pagan con la cuenta #{cuenta.id} (saldo{" "}
              <Monto value={cuenta.saldo} moneda={cuenta.moneda} testId="v2-prestamos-cuotas-saldo-cuenta" />
              ).
            </>
          )}
        </p>
      )}
      {pagoError && (
        <p role="alert" className={shared.formError} data-testid="v2-prestamos-cuotas-pago-error">
          {pagoError}
        </p>
      )}
      {seleccionadas.length > 0 && (
        <div className={shared.formActions} data-testid="v2-prestamos-cuotas-seleccion">
          <span data-testid="v2-prestamos-cuotas-seleccion-cantidad" data-value={seleccionadas.length}>
            {seleccionadas.length === 1 ? "1 cuota seleccionada" : `${seleccionadas.length} cuotas seleccionadas`}
          </span>
          <span>
            Total: <Monto value={totalSeleccion.toFixed(2)} moneda="PYG" testId="v2-prestamos-cuotas-seleccion-total" />
          </span>
          <button
            type="button"
            className={shared.button}
            disabled={pagando}
            onClick={() => pedirPago(seleccionadas)}
            data-testid="v2-prestamos-cuotas-pagar-seleccion"
          >
            {pagando ? "Pagando..." : seleccionadas.length === 1 ? "Pagar 1 cuota" : `Pagar ${seleccionadas.length} cuotas`}
          </button>
        </div>
      )}
      <DataState
        loading={loading}
        error={error}
        empty={ordenadas.length === 0}
        emptyMessage="Sin cuotas."
        count={ordenadas.length}
        countTestId={cuotaIds.count}
        loadingTestId={cuotaIds.loading}
        errorTestId={cuotaIds.error}
        emptyTestId={cuotaIds.empty}
      >
        <div className={shared.tableWrap}>
          <table className={shared.table} data-testid={cuotaIds.list}>
            <thead>
              <tr>
                {pendientes.length > 0 && <th aria-label="Seleccionar" />}
                <th>Cuota</th>
                <th>Vence</th>
                <th className={shared.numeric}>Monto</th>
                <th>Estado</th>
                <th>Pagada el</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((cuota) => {
                const indice = pendientes.findIndex((c) => c.numero_cuota === cuota.numero_cuota);
                const vencida = cuotaVencida(cuota);
                const estadoVisible = vencida ? "vencida" : cuota.estado;
                return (
                  <tr
                    key={cuota.numero_cuota}
                    data-testid={cuotaIds.row(cuota.numero_cuota)}
                    data-estado={cuota.estado}
                    data-vencida={vencida ? "true" : "false"}
                  >
                    {pendientes.length > 0 && (
                      <td>
                        {indice >= 0 && (
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar cuota ${cuota.numero_cuota}`}
                            checked={indice < seleccion}
                            disabled={pagando}
                            onChange={(e) => toggle(indice, e.target.checked)}
                            data-testid={cuotaIds.rowAction(cuota.numero_cuota, "seleccionar")}
                          />
                        )}
                      </td>
                    )}
                    <td>{cuota.numero_cuota}</td>
                    <td>
                      <Fecha value={cuota.fecha_vencimiento} />
                    </td>
                    <td className={shared.numeric}>
                      <Monto value={cuota.monto} moneda="PYG" />
                    </td>
                    <td>
                      <span
                        className={badgeFor(estadoVisible)}
                        data-testid={cuotaIds.rowAction(cuota.numero_cuota, "estado")}
                        data-value={estadoVisible}
                      >
                        {capitalizar(estadoVisible)}
                      </span>
                    </td>
                    <td>{cuota.fecha_pago ? <Fecha value={cuota.fecha_pago} /> : "—"}</td>
                    <td>
                      {indice === 0 && (
                        <button
                          type="button"
                          className={shared.button}
                          disabled={pagando}
                          onClick={() => pedirPago([cuota])}
                          data-testid={cuotaIds.rowAction(cuota.numero_cuota, "pagar")}
                        >
                          {pagando ? "Pagando..." : "Pagar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataState>

      <ConfirmDialog
        open={confirmar !== null}
        title={
          esLote
            ? `¿Pagar ${lote.length} cuotas (de la ${lote[0].numero_cuota} a la ${lote[lote.length - 1].numero_cuota})?`
            : `¿Pagar la cuota ${lote[0]?.numero_cuota ?? ""}?`
        }
        description={confirmar ? `Monto: ${formatMonto(sumarMontos(lote.map((c) => c.monto)), "PYG")}.` : undefined}
        confirmLabel={esLote ? "Pagar cuotas" : "Pagar cuota"}
        testId={esLote ? "v2-prestamos-cuotas-pagar-seleccion" : cuotaIds.rowAction(lote[0]?.numero_cuota ?? 0, "pagar")}
        onCancel={() => setConfirmar(null)}
        onConfirm={() => confirmar && pagar(confirmar)}
      />
    </section>
  );
}
