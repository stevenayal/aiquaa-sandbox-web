"use client";

import { Field } from "@/components/form/Field";
import type { useFormState } from "@/lib/forms/useFormState";
import { mensajeContiene, type ApiErrorRule } from "@/lib/forms/useFormState";
import { BANCOS_PY } from "@/lib/v2/reglas";
import { longitud, numeroCuenta, opcional, requerido, validarCampos } from "@/lib/validation/v2";

export type BeneficiarioValores = { nombre: string; banco: string; numeroCuenta: string; alias: string };

export function validarBeneficiario(v: BeneficiarioValores) {
  return validarCampos(v, {
    nombre: [requerido("Ingresá el nombre del titular de la cuenta."), longitud({ min: 3, max: 120, label: "El nombre" })],
    banco: [requerido("Elegí el banco.")],
    numeroCuenta: [numeroCuenta],
    alias: [opcional(longitud({ min: 3, max: 30, label: "El alias" }))],
  });
}

/** `(usuario_id, numero_cuenta)` es UNIQUE: el 409 va al campo de número de cuenta. */
export const BENEFICIARIO_API_ERRORS: ApiErrorRule<"numeroCuenta">[] = [
  {
    field: "numeroCuenta",
    when: mensajeContiene("numero_cuenta", "duplicate"),
    message: "Ya tenés un beneficiario con este número de cuenta.",
  },
];

type Form = ReturnType<typeof useFormState<BeneficiarioValores & { usuarioId: string }>> | ReturnType<typeof useFormState<BeneficiarioValores>>;

export function BeneficiarioFields({ form }: { form: Form }) {
  const f = form as ReturnType<typeof useFormState<BeneficiarioValores>>;
  const bancoActual = f.values.banco;
  return (
    <>
      <Field form={f} name="nombre" label="Titular de la cuenta destino">
        <input {...f.fieldProps("nombre")} autoComplete="off" />
      </Field>
      <Field form={f} name="banco" label="Banco">
        <select {...f.fieldProps("banco")}>
          <option value="">Elegí un banco</option>
          {/* Un beneficiario viejo puede tener un banco fuera de la lista. */}
          {bancoActual && !(BANCOS_PY as readonly string[]).includes(bancoActual) && <option value={bancoActual}>{bancoActual}</option>}
          {BANCOS_PY.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>
      <Field form={f} name="numeroCuenta" label="Número de cuenta" hint="Entre 6 y 20 dígitos, sin guiones ni espacios.">
        <input {...f.fieldProps("numeroCuenta", { hint: true })} inputMode="numeric" autoComplete="off" />
      </Field>
      <Field form={f} name="alias" label="Alias (opcional)" hint="Para reconocerlo rápido al transferir. Ej. Alquiler">
        <input {...f.fieldProps("alias", { hint: true })} maxLength={40} />
      </Field>
    </>
  );
}
