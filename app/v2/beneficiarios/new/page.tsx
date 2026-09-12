"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { useToast } from "@/components/Toast";
import { BENEFICIARIO_API_ERRORS, BeneficiarioFields, validarBeneficiario } from "@/components/v2/BeneficiarioFields";
import { ClienteSelect } from "@/components/v2/EntitySelects";
import { crearBeneficiarioV2 } from "@/lib/api/v2/beneficiarios";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioIdV2 } from "@/lib/v2/admin";
import { useFormState } from "@/lib/forms/useFormState";
import { testIds } from "@/lib/testids";
import { useBeneficiariosCliente, useClientesV2 } from "@/lib/v2/useEntidadesCliente";
import { requerido } from "@/lib/validation/v2";

const ids = testIds("v2-beneficiarios");

export default function NuevoBeneficiarioV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioIdV2(usuario),
      nombre: "",
      banco: "",
      numeroCuenta: "",
      alias: "",
    },
    ids,
    validate: (v) => {
      const errors: Partial<Record<keyof typeof v, string>> = validarBeneficiario(v);
      const titularError = requerido("Elegí el titular.")(v.usuarioId);
      if (titularError) errors.usuarioId = titularError;
      return errors;
    },
  });

  // UI: el alias tiene que ser único entre los beneficiarios del cliente (la API no lo controla).
  const { beneficiarios } = useBeneficiariosCliente(form.values.usuarioId);
  const aliasRepetido = form.values.alias.trim()
    ? beneficiarios.find((b) => b.alias?.toLowerCase() === form.values.alias.trim().toLowerCase())
    : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    if (aliasRepetido) {
      form.setFormError(`Ya usás el alias "${aliasRepetido.alias}" para ${aliasRepetido.nombre}.`);
      return;
    }
    setSubmitting(true);
    try {
      const beneficiario = await crearBeneficiarioV2({
        usuarioId: Number(form.values.usuarioId),
        nombre: form.values.nombre.trim(),
        banco: form.values.banco,
        numeroCuenta: form.values.numeroCuenta.trim(),
        alias: form.values.alias.trim() || undefined,
      });
      toast.success(`${beneficiario.alias ?? beneficiario.nombre} agregado a tus beneficiarios.`);
      router.push(`/v2/beneficiarios/${beneficiario.id}`);
    } catch (err) {
      form.applyApiError(err, BENEFICIARIO_API_ERRORS, "No se pudo agregar el beneficiario.");
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-beneficiarios" title="Agregar beneficiario" />
      <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
        <Field form={form} name="usuarioId" label="Agendar para">
          <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
        </Field>
        <BeneficiarioFields form={form} />
        {aliasRepetido && (
          <p className={shared.notice} data-testid="v2-beneficiarios-alias-repetido">
            Ya usás este alias para {aliasRepetido.nombre}.
          </p>
        )}
        <FormError form={form} />
        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Agregando..." : "Agregar beneficiario"}
        </button>
      </form>
    </div>
  );
}
