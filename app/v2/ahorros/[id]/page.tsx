"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { useToast } from "@/components/Toast";
import { AhorroFields, avanceAhorro, validarAhorro } from "@/components/v2/AhorroFields";
import { describeCuenta } from "@/components/v2/EntitySelects";
import { Monto, Porcentaje } from "@/components/Valores";
import { actualizarAhorroV2, aportarAhorroV2, eliminarAhorroV2, getAhorroV2, type AhorroV2 } from "@/lib/api/v2/ahorros";
import { getCuentaV2, type CuentaV2 } from "@/lib/api/v2/cuentas";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { round2 } from "@/lib/v2/reglas";
import { monto, parseMonto, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-ahorros");
const aporteIds = testIds("v2-ahorros-aporte");

export default function AhorroV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);

  const { data: ahorro, error, isLoading, mutate } = useSWR(["v2-ahorro", id], () => getAhorroV2(id));
  const { data: cuenta, mutate: mutateCuenta } = useSWR(ahorro ? ["v2-cuenta", ahorro.cuenta_id] : null, () =>
    getCuentaV2(ahorro!.cuenta_id),
  );

  return (
    <div className={shared.page}>
      <Link href="/v2/ahorros" className={shared.backLink}>
        ← Ahorro programado
      </Link>
      <ModuleHeader moduleKey="v2-ahorros" title={ahorro ? ahorro.nombre_meta : `Meta #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {ahorro && (
          <>
            <div className={shared.stats} data-testid={ids.detail}>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Ahorrado</span>
                <span className={shared.statValue}>
                  <Monto value={ahorro.saldo_acumulado} moneda="PYG" testId="v2-ahorros-detail-acumulado" />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Meta</span>
                <Monto value={ahorro.meta_monto} moneda="PYG" testId="v2-ahorros-detail-meta" />
                <span className={shared.statLabel}>Falta</span>
                <Monto value={Math.max(Number(ahorro.falta_para_meta), 0).toFixed(2)} moneda="PYG" testId="v2-ahorros-detail-falta" />
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Estado</span>
                <span>
                  <span className={badgeFor(ahorro.estado)} data-testid="v2-ahorros-detail-estado" data-value={ahorro.estado}>
                    {capitalizar(ahorro.estado)}
                  </span>
                </span>
                <span className={shared.statLabel}>
                  Aporte <Monto value={ahorro.aporte_mensual} moneda="PYG" /> · Tasa <Porcentaje value={ahorro.tasa_anual} />
                </span>
              </div>
            </div>

            <ProgressBar value={avanceAhorro(ahorro)} label="Avance de la meta" tone="success" testId="v2-ahorros-detail-avance" />
            <p className={shared.hint}>
              Se debita de {cuenta ? <Link href={`/v2/cuentas/${cuenta.id}`}>{describeCuenta(cuenta)}</Link> : `la cuenta #${ahorro.cuenta_id}`}.
            </p>

            {ahorro.estado === "activo" ? (
              <div className={shared.twoColumns}>
                <AporteForm
                  key={ahorro.saldo_acumulado}
                  ahorro={ahorro}
                  cuenta={cuenta}
                  onDone={async (updated, aportado) => {
                    await Promise.all([mutate(updated, { revalidate: false }), mutateCuenta()]);
                    toast.success(
                      updated.estado === "completado"
                        ? `¡Meta "${updated.nombre_meta}" alcanzada!`
                        : `Aporte de ${formatMonto(aportado, "PYG")} registrado.`,
                    );
                  }}
                />
                <EditarAhorroForm
                  key={`${ahorro.meta_monto}-${ahorro.aporte_mensual}-${ahorro.nombre_meta}-${ahorro.tasa_anual}`}
                  ahorro={ahorro}
                  onSaved={async (updated) => {
                    await mutate(updated, { revalidate: false });
                    toast.success("Meta actualizada.");
                  }}
                />
              </div>
            ) : (
              <p className={shared.info} data-testid="v2-ahorros-detail-cerrado">
                {ahorro.estado === "completado"
                  ? "Meta cumplida: el plan ya no admite aportes ni cambios."
                  : "Plan cancelado: ya no admite aportes ni cambios."}
              </p>
            )}

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar esta meta?"
              description="El plan deja de aparecer en tus ahorros."
              label="Eliminar meta"
              disabledReason={
                ahorro.estado === "activo" && Number(ahorro.saldo_acumulado) > 0
                  ? "Un plan activo con dinero ahorrado no se puede eliminar."
                  : null
              }
              onDelete={() => eliminarAhorroV2(id)}
              onDeleted={() => {
                toast.success("Meta eliminada.");
                router.push("/v2/ahorros");
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}

function AporteForm({
  ahorro,
  cuenta,
  onDone,
}: {
  ahorro: AhorroV2;
  cuenta: CuentaV2 | undefined;
  onDone: (a: AhorroV2, aportado: number) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const saldoCuenta = cuenta ? Number(cuenta.saldo) : null;
  const falta = Math.max(Number(ahorro.falta_para_meta), 0);
  const cuentaInactiva = cuenta && cuenta.estado !== "activa";

  const form = useFormState({
    initial: { monto: Number(ahorro.aporte_mensual).toFixed(2) },
    ids: aporteIds,
    idPrefix: "aporte-",
    validate: (v) =>
      validarCampos(v, {
        // Espejo de la API: el aporte se debita de la cuenta, no puede superar su saldo.
        monto: [
          monto({
            max: saldoCuenta,
            maxMessage: `Saldo insuficiente en la cuenta: el disponible es ${formatMonto(saldoCuenta, "PYG")}.`,
          }),
        ],
      }),
  });
  const montoNum = parseMonto(form.values.monto) ?? 0;
  const excedente = round2(montoNum - falta);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      await onDone(await aportarAhorroV2(ahorro.id, montoNum), montoNum);
    } catch (err) {
      form.applyApiError(err, [{ field: "monto", when: (e) => e.message.includes("Saldo insuficiente") }], "No se pudo registrar el aporte.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={aporteIds.form}>
      <h2>Aportar</h2>
      <Field
        form={form}
        name="monto"
        label="Monto del aporte"
        hint={saldoCuenta !== null ? `Disponible en la cuenta: ${formatMonto(saldoCuenta, "PYG")}` : undefined}
      >
        <MontoInput {...form.controlProps("monto", { hint: saldoCuenta !== null })} moneda="PYG" />
      </Field>
      {excedente > 0 && !form.errorOf("monto") && (
        <p className={shared.notice} data-testid="v2-ahorros-aporte-excedente">
          Con este aporte superás la meta por {formatMonto(excedente, "PYG")}. El plan queda completado.
        </p>
      )}
      {cuentaInactiva && (
        <p className={shared.notice} data-testid="v2-ahorros-aporte-cuenta-inactiva">
          La cuenta asociada está {cuenta.estado}: no admite débitos.
        </p>
      )}
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting || Boolean(cuentaInactiva)} data-testid={aporteIds.submit}>
        {submitting ? "Aportando..." : "Aportar"}
      </button>
    </form>
  );
}

function EditarAhorroForm({ ahorro, onSaved }: { ahorro: AhorroV2; onSaved: (a: AhorroV2) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const acumulado = Number(ahorro.saldo_acumulado);
  const form = useFormState({
    initial: {
      nombreMeta: ahorro.nombre_meta,
      metaMonto: Number(ahorro.meta_monto).toFixed(2),
      aporteMensual: Number(ahorro.aporte_mensual).toFixed(2),
      tasaAnual: Number(ahorro.tasa_anual).toFixed(2),
    },
    ids,
    idPrefix: "edit-",
    validate: (v) => validarAhorro(v, acumulado),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await actualizarAhorroV2(ahorro.id, {
        nombreMeta: form.values.nombreMeta.trim(),
        metaMonto: parseMonto(form.values.metaMonto) as number,
        aporteMensual: parseMonto(form.values.aporteMensual) as number,
        // Omitirla la resetea a 0 en la API: se manda siempre.
        tasaAnual: parseMonto(form.values.tasaAnual) ?? 0,
      });
      await onSaved(updated);
    } catch (err) {
      form.applyApiError(err, [{ field: "metaMonto", when: (e) => e.message.includes("meta") }], "No se pudo actualizar la meta.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(ahorro.id, "edit-form")}>
      <h2>Editar meta</h2>
      <AhorroFields form={form} acumulado={acumulado} />
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.rowAction(ahorro.id, "edit-submit")}>
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
