"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { CheckboxField, RadioCards } from "@/components/form/RadioCards";
import { useToast } from "@/components/Toast";
import { ClienteSelect } from "@/components/v2/EntitySelects";
import { abrirCuentaV2, type MonedaV2, type TipoCuentaV2 } from "@/lib/api/v2/cuentas";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioId } from "@/lib/auth/admin";
import { useFormState } from "@/lib/forms/useFormState";
import { testIds } from "@/lib/testids";
import { TIPO_CUENTA_LABEL } from "@/lib/v2/labels";
import { useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { requerido, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-cuentas");

export default function NuevaCuentaV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioId(usuario),
      tipoCuenta: "ahorro",
      moneda: "PYG",
      contrato: "",
    },
    ids,
    validate: (v) =>
      validarCampos(v, {
        usuarioId: [requerido("Elegí el titular de la cuenta.")],
        tipoCuenta: [requerido("Elegí el tipo de cuenta.")],
        moneda: [requerido("Elegí la moneda.")],
        contrato: [requerido("Tenés que aceptar el contrato de apertura de cuenta.")],
      }),
  });

  // UI: un cliente no puede tener dos cuentas activas del mismo tipo y moneda.
  // La API no lo controla (se puede probar abriendo la segunda por API).
  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(form.values.usuarioId);
  const duplicada = cuentas.find(
    (c) => c.tipo_cuenta === form.values.tipoCuenta && c.moneda === form.values.moneda && c.estado !== "cerrada",
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    if (duplicada) {
      form.setFormError(
        `El cliente ya tiene una ${TIPO_CUENTA_LABEL[duplicada.tipo_cuenta].toLowerCase()} en ${duplicada.moneda} (N° ${duplicada.numero_cuenta}).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const cuenta = await abrirCuentaV2({
        usuarioId: Number(form.values.usuarioId),
        tipoCuenta: form.values.tipoCuenta as TipoCuentaV2,
        moneda: form.values.moneda as MonedaV2,
      });
      toast.success(`Cuenta N° ${cuenta.numero_cuenta} abierta.`);
      router.push(`/v2/cuentas/${cuenta.id}`);
    } catch (err) {
      form.applyApiError(
        err,
        [{ field: "usuarioId", when: (e) => e.message.includes("foreign key"), message: "El cliente elegido no existe." }],
        "No se pudo abrir la cuenta.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-cuentas" title="Abrir cuenta" />

      <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
        <Field form={form} name="usuarioId" label="Titular">
          <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
        </Field>

        <RadioCards
          form={form}
          name="tipoCuenta"
          legend="Tipo de cuenta"
          options={[
            { value: "ahorro", label: TIPO_CUENTA_LABEL.ahorro, description: "Para ahorrar y recibir transferencias." },
            { value: "corriente", label: TIPO_CUENTA_LABEL.corriente, description: "Para operar día a día." },
          ]}
        />

        <RadioCards
          form={form}
          name="moneda"
          legend="Moneda"
          options={[
            { value: "PYG", label: "Guaraníes (PYG)" },
            { value: "USD", label: "Dólares (USD)" },
          ]}
        />

        {!cuentasLoading && duplicada && (
          <p className={shared.notice} data-testid="v2-cuentas-duplicada">
            Este cliente ya tiene una {TIPO_CUENTA_LABEL[duplicada.tipo_cuenta].toLowerCase()} en {duplicada.moneda}. Elegí
            otro tipo o moneda.
          </p>
        )}

        <p className={shared.info}>El número de cuenta se genera automáticamente y el saldo inicial es 0.</p>

        <CheckboxField form={form} name="contrato">
          Leí y acepto el contrato de apertura de cuenta.
        </CheckboxField>

        <FormError form={form} />

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Abriendo cuenta..." : "Abrir cuenta"}
        </button>
      </form>
    </div>
  );
}
