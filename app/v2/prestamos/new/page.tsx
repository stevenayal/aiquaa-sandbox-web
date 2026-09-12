"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Stepper } from "@/components/Stepper";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { CheckboxField } from "@/components/form/RadioCards";
import { WizardActions } from "@/components/form/WizardActions";
import { useToast } from "@/components/Toast";
import { ClienteSelect, CuentaSelect, describeCuenta } from "@/components/v2/EntitySelects";
import { MONTO_PRESTAMO, PLAZOS_PRESTAMO, SimulacionPrestamo } from "@/components/v2/SimulacionPrestamo";
import { Monto, Porcentaje } from "@/components/Valores";
import { solicitarPrestamoV2 } from "@/lib/api/v2/prestamos";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioId } from "@/lib/auth/admin";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { simularPrestamo } from "@/lib/v2/reglas";
import { useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { monto, parseMonto, requerido, tasa, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-prestamos");
const PASOS = ["Simulación", "Confirmación"];
const CAMPOS_PASO_1 = ["usuarioId", "cuentaId", "montoSolicitado", "tasaInteres", "plazoMeses"] as const;

export default function NuevoPrestamoV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [paso, setPaso] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioId(usuario),
      cuentaId: "",
      montoSolicitado: "",
      tasaInteres: "18",
      plazoMeses: "12",
      acepto: "",
    },
    ids,
    validate: (v) =>
      validarCampos(v, {
        usuarioId: [requerido("Elegí el titular.")],
        // UI: el préstamo se acredita en una cuenta en guaraníes del titular (la API la acepta opcional).
        cuentaId: [requerido("Elegí la cuenta donde se acredita el préstamo.")],
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
        acepto: [requerido("Tenés que aceptar las condiciones del préstamo.")],
      }),
  });

  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(form.values.usuarioId);
  const cuentasPyg = cuentas.filter((c) => c.estado === "activa" && c.moneda === "PYG");
  const cuenta = cuentasPyg.find((c) => String(c.id) === form.values.cuentaId);
  const titular = clientes.find((c) => String(c.id) === form.values.usuarioId);

  const montoNum = parseMonto(form.values.montoSolicitado);
  const tasaNum = parseMonto(form.values.tasaInteres);
  const plazoNum = Number(form.values.plazoMeses);
  const simulacion =
    montoNum && montoNum > 0 && tasaNum !== null && !form.validationErrors.tasaInteres && plazoNum > 0
      ? simularPrestamo(montoNum, tasaNum, plazoNum)
      : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (paso === 0) {
      if (form.validateFields([...CAMPOS_PASO_1])) setPaso(1);
      return;
    }
    if (!form.validateFields(["acepto"])) return;

    setSubmitting(true);
    try {
      const prestamo = await solicitarPrestamoV2({
        usuarioId: Number(form.values.usuarioId),
        cuentaId: Number(form.values.cuentaId),
        montoSolicitado: montoNum as number,
        tasaInteres: tasaNum as number,
        plazoMeses: plazoNum,
      });
      toast.success(`Solicitud N° ${prestamo.id} enviada. Queda en evaluación.`);
      router.push(`/v2/prestamos/${prestamo.id}`);
    } catch (err) {
      const campo = form.applyApiError(
        err,
        [{ field: "tasaInteres", when: (e) => e.message.toLowerCase().includes("tasa") }],
        "No se pudo enviar la solicitud.",
      );
      if (campo) setPaso(0);
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-prestamos" title="Solicitar préstamo" />
      <Stepper steps={PASOS} current={paso} testId="v2-prestamos" />

      <div className={shared.twoColumns}>
        <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
          {paso === 0 && (
            <>
              <Field form={form} name="usuarioId" label="Titular">
                <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
              </Field>
              <Field form={form} name="cuentaId" label="Cuenta de acreditación" hint="Solo cuentas activas en guaraníes.">
                <CuentaSelect
                  {...form.fieldProps("cuentaId", { hint: true })}
                  items={cuentasPyg}
                  isLoading={cuentasLoading}
                  emptyLabel="El titular no tiene cuentas activas en PYG"
                />
              </Field>
              <Field
                form={form}
                name="montoSolicitado"
                label="Monto"
                hint={`Entre ${formatMonto(MONTO_PRESTAMO.min, "PYG")} y ${formatMonto(MONTO_PRESTAMO.max, "PYG")}.`}
              >
                <MontoInput {...form.controlProps("montoSolicitado", { hint: true })} moneda="PYG" />
              </Field>
              <Field form={form} name="plazoMeses" label="Plazo">
                <select {...form.fieldProps("plazoMeses")}>
                  {PLAZOS_PRESTAMO.map((p) => (
                    <option key={p} value={p}>
                      {p} meses
                    </option>
                  ))}
                </select>
              </Field>
              <Field form={form} name="tasaInteres" label="Interés total (%)" hint="Se aplica una sola vez sobre el monto.">
                <input {...form.fieldProps("tasaInteres", { hint: true })} inputMode="decimal" />
              </Field>
            </>
          )}

          {paso === 1 && simulacion && (
            <>
              <dl className={shared.summary} data-testid="v2-prestamos-resumen">
                <dt>Titular</dt>
                <dd>{titular?.nombre ?? `Cliente #${form.values.usuarioId}`}</dd>
                <dt>Se acredita en</dt>
                <dd>{cuenta ? describeCuenta(cuenta) : `Cuenta #${form.values.cuentaId}`}</dd>
                <dt>Monto</dt>
                <dd>
                  <Monto value={montoNum!.toFixed(2)} moneda="PYG" testId="v2-prestamos-resumen-monto" />
                </dd>
                <dt>Interés</dt>
                <dd>
                  <Porcentaje value={tasaNum!.toFixed(2)} testId="v2-prestamos-resumen-tasa" />
                </dd>
                <dt>Plazo</dt>
                <dd data-testid="v2-prestamos-resumen-plazo">{plazoNum} cuotas mensuales</dd>
                <dt>Cuota</dt>
                <dd>
                  <Monto value={simulacion.cuota.toFixed(2)} moneda="PYG" testId="v2-prestamos-resumen-cuota" />
                </dd>
                <dt>Total a pagar</dt>
                <dd>
                  <Monto value={simulacion.total.toFixed(2)} moneda="PYG" testId="v2-prestamos-resumen-total" />
                </dd>
              </dl>
              <p className={shared.info}>La solicitud queda en evaluación. Las cuotas se generan cuando se aprueba.</p>
              <CheckboxField form={form} name="acepto">
                Acepto las condiciones del préstamo y autorizo la consulta a centrales de riesgo.
              </CheckboxField>
            </>
          )}

          <FormError form={form} />

          <WizardActions
            ids={ids}
            onBack={paso > 0 ? () => setPaso(0) : undefined}
            nextLabel={paso === 0 ? "Continuar" : "Enviar solicitud"}
            submitting={submitting}
            submittingLabel="Enviando..."
            isLast={paso === 1}
          />
        </form>

        {paso === 0 && <SimulacionPrestamo simulacion={simulacion} />}
      </div>
    </div>
  );
}
