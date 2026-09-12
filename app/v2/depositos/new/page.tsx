"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { useToast } from "@/components/Toast";
import { ClienteSelect, CuentaSelect } from "@/components/v2/EntitySelects";
import { Monto } from "@/components/Valores";
import { constituirDepositoV2 } from "@/lib/api/v2/depositos";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { PLAZOS_DEPOSITO, TASAS_DEPOSITO, addDays, interesDeposito, toISODate } from "@/lib/v2/reglas";
import { useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { monto, parseMonto, requerido, tasa, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-depositos");

/** UI: monto mínimo para constituir un depósito a plazo. */
const MONTO_MINIMO = 1_000_000;

export default function NuevoDepositoV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? (usuario ? String(usuario.id) : ""),
      cuentaId: "",
      monto: "",
      plazoDias: "90",
      tasaAnual: String(TASAS_DEPOSITO[90]),
    },
    ids,
    validate: (v) => ({
      ...validarCampos(v, {
        monto: [monto({ min: MONTO_MINIMO, minMessage: `El monto mínimo es ${formatMonto(MONTO_MINIMO, "PYG")}.` })],
        tasaAnual: [tasa],
      }),
      ...(requerido()(v.usuarioId) ? { usuarioId: "Elegí el titular." } : {}),
      ...(requerido()(v.cuentaId) ? { cuentaId: "Elegí la cuenta de la que se debita el depósito." } : {}),
    }),
  });

  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(form.values.usuarioId);
  const cuentasPyg = cuentas.filter((c) => c.estado === "activa" && c.moneda === "PYG");
  const cuenta = cuentasPyg.find((c) => String(c.id) === form.values.cuentaId);
  const saldo = cuenta ? Number(cuenta.saldo) : null;

  const montoNum = parseMonto(form.values.monto);
  const tasaNum = parseMonto(form.values.tasaAnual);
  const plazoDias = Number(form.values.plazoDias);
  const preview =
    montoNum && montoNum > 0 && tasaNum !== null && plazoDias > 0
      ? {
          interes: interesDeposito(montoNum, tasaNum, plazoDias),
          vencimiento: toISODate(addDays(new Date(), plazoDias)),
        }
      : null;

  function elegirPlazo(dias: string) {
    form.setValue("plazoDias", dias);
    // Sugiere la tasa del tarifario para ese plazo; sigue siendo editable.
    const sugerida = TASAS_DEPOSITO[Number(dias) as keyof typeof TASAS_DEPOSITO];
    if (sugerida !== undefined) form.setValue("tasaAnual", String(sugerida));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    if (saldo !== null && (montoNum ?? 0) > saldo) {
      form.setFormError(`Saldo insuficiente: el disponible en la cuenta es ${formatMonto(saldo, "PYG")}.`);
      return;
    }
    setSubmitting(true);
    try {
      const deposito = await constituirDepositoV2({
        usuarioId: Number(form.values.usuarioId),
        cuentaId: Number(form.values.cuentaId),
        monto: montoNum as number,
        tasaAnual: tasaNum as number,
        plazoDias,
      });
      toast.success(`Depósito N° ${deposito.id} constituido.`);
      router.push(`/v2/depositos/${deposito.id}`);
    } catch (err) {
      form.applyApiError(err, [{ field: "monto", when: (e) => e.message.includes("Saldo insuficiente") }], "No se pudo constituir el depósito.");
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-depositos" title="Constituir depósito a plazo" />

      <div className={shared.twoColumns}>
        <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
          <Field form={form} name="usuarioId" label="Titular">
            <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
          </Field>
          <Field
            form={form}
            name="cuentaId"
            label="Debitar de la cuenta"
            hint={saldo !== null ? `Disponible: ${formatMonto(saldo, "PYG")}` : "Cuentas activas en guaraníes."}
          >
            <CuentaSelect
              {...form.fieldProps("cuentaId", { hint: true })}
              items={cuentasPyg}
              isLoading={cuentasLoading}
              emptyLabel="El titular no tiene cuentas activas en PYG"
            />
          </Field>
          <Field form={form} name="monto" label="Monto" hint={`Mínimo ${formatMonto(MONTO_MINIMO, "PYG")}.`}>
            <MontoInput {...form.controlProps("monto", { hint: true })} moneda="PYG" />
          </Field>
          <Field form={form} name="plazoDias" label="Plazo">
            <select value={form.values.plazoDias} onChange={(e) => elegirPlazo(e.target.value)} id={form.domId("plazoDias")} data-testid={ids.field("plazoDias")}>
              {PLAZOS_DEPOSITO.map((dias) => (
                <option key={dias} value={dias}>
                  {dias} días
                </option>
              ))}
            </select>
          </Field>
          <Field form={form} name="tasaAnual" label="Tasa anual (%)" hint="Sugerida según el plazo; se puede editar.">
            <input {...form.fieldProps("tasaAnual", { hint: true })} inputMode="decimal" />
          </Field>

          <FormError form={form} />

          <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
            {submitting ? "Constituyendo..." : "Constituir depósito"}
          </button>
        </form>

        <aside className={shared.section} aria-label="Proyección">
          {preview ? (
            <div className={shared.stats} data-testid="v2-depositos-preview">
              <div className={shared.stat}>
                <span className={shared.statLabel}>Interés proyectado</span>
                <span className={shared.statValue}>
                  <Monto value={preview.interes.toFixed(2)} moneda="PYG" testId="v2-depositos-preview-interes" />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Vencimiento estimado</span>
                <span className={shared.statValue} data-testid="v2-depositos-preview-vencimiento" data-value={preview.vencimiento}>
                  {preview.vencimiento.split("-").reverse().join("/")}
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Total al vencimiento</span>
                <Monto value={((montoNum ?? 0) + preview.interes).toFixed(2)} moneda="PYG" testId="v2-depositos-preview-total" />
              </div>
            </div>
          ) : (
            <p className={shared.info} data-testid="v2-depositos-preview-vacia">
              Completá monto, plazo y tasa para ver la proyección.
            </p>
          )}
          <p className={shared.hint}>Interés = monto × tasa/100 × plazo/365. No se acumula: es un pago único al vencimiento o al cancelar.</p>
        </aside>
      </div>
    </div>
  );
}
