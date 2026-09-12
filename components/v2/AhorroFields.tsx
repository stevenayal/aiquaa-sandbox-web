"use client";

import shared from "@/components/shared.module.css";
import { Field, type FieldHost } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { formatMonto } from "@/lib/format";
import { proyeccionAhorro, round2 } from "@/lib/v2/reglas";
import { longitud, monto, parseMonto, requerido, tasa, validarCampos } from "@/lib/validation/v2";

export type AhorroValores = { nombreMeta: string; metaMonto: string; aporteMensual: string; tasaAnual: string };

/** Porcentaje de la meta ya ahorrado. */
export function avanceAhorro(a: { saldo_acumulado: string; meta_monto: string }): number {
  const meta = Number(a.meta_monto);
  return meta > 0 ? round2((Number(a.saldo_acumulado) / meta) * 100) : 0;
}

/** UI: meta mínima y plazo máximo de un plan de ahorro. */
export const AHORRO_REGLAS = { metaMinima: 100_000, mesesMaximos: 120 } as const;

/** `acumulado` > 0 en la edición: la meta no puede quedar por debajo (espejo de la API). */
export function validarAhorro(v: AhorroValores, acumulado = 0) {
  const meta = parseMonto(v.metaMonto);
  const errors = validarCampos(v, {
    nombreMeta: [requerido("Poné un nombre a tu meta."), longitud({ min: 3, max: 40, label: "El nombre" })],
    metaMonto: [
      monto({
        min: Math.max(AHORRO_REGLAS.metaMinima, acumulado),
        minMessage:
          acumulado > AHORRO_REGLAS.metaMinima
            ? `La meta no puede ser menor a lo ya ahorrado (${formatMonto(acumulado, "PYG")}).`
            : `La meta mínima es ${formatMonto(AHORRO_REGLAS.metaMinima, "PYG")}.`,
      }),
    ],
    aporteMensual: [monto({ max: meta, maxMessage: "El aporte mensual no puede superar la meta." })],
    tasaAnual: [tasa],
  });
  const aporte = parseMonto(v.aporteMensual);
  if (!errors.aporteMensual && meta && aporte) {
    const { meses } = proyeccionAhorro(meta, acumulado, aporte);
    if (meses > AHORRO_REGLAS.mesesMaximos) {
      errors.aporteMensual = `Con ese aporte llegás en ${meses} meses: el plazo máximo es de ${AHORRO_REGLAS.mesesMaximos} meses.`;
    }
  }
  return errors;
}

type AhorroForm = FieldHost & {
  values: AhorroValores;
  fieldProps(name: "nombreMeta" | "tasaAnual", opts?: { hint?: boolean }): React.InputHTMLAttributes<HTMLInputElement>;
  controlProps(
    name: "metaMonto" | "aporteMensual",
    opts?: { hint?: boolean },
  ): { value: string; onValueChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;
};

export function AhorroFields({ form, acumulado = 0 }: { form: AhorroForm; acumulado?: number }) {
  const meta = parseMonto(form.values.metaMonto);
  const aporte = parseMonto(form.values.aporteMensual);
  const proyeccion = meta && aporte && aporte <= meta ? proyeccionAhorro(meta, acumulado, aporte) : null;

  return (
    <>
      <Field form={form} name="nombreMeta" label="Nombre de la meta" hint="Ej. Vacaciones, Fondo de emergencia">
        <input {...form.fieldProps("nombreMeta", { hint: true })} maxLength={50} />
      </Field>
      <Field form={form} name="metaMonto" label="Meta">
        <MontoInput {...form.controlProps("metaMonto")} moneda="PYG" />
      </Field>
      <Field form={form} name="aporteMensual" label="Aporte mensual">
        <MontoInput {...form.controlProps("aporteMensual")} moneda="PYG" />
      </Field>
      <Field form={form} name="tasaAnual" label="Tasa anual (%)" hint="Informativa: el sandbox no liquida intereses de ahorro.">
        <input {...form.fieldProps("tasaAnual", { hint: true })} inputMode="decimal" />
      </Field>
      {proyeccion && (
        <p className={shared.info} data-testid="v2-ahorros-proyeccion" data-meses={proyeccion.meses} data-fecha={proyeccion.fechaEstimada}>
          {proyeccion.meses === 0
            ? "Ya alcanzaste la meta."
            : `Aportando ${formatMonto(aporte, "PYG")} por mes llegás a la meta en ${proyeccion.meses} ${proyeccion.meses === 1 ? "mes" : "meses"} (${proyeccion.fechaEstimada.split("-").reverse().join("/")}).`}
        </p>
      )}
    </>
  );
}
