"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { useToast } from "@/components/Toast";
import { AhorroFields, validarAhorro } from "@/components/v2/AhorroFields";
import { ClienteSelect, CuentaSelect } from "@/components/v2/EntitySelects";
import { crearAhorroV2 } from "@/lib/api/v2/ahorros";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioIdV2 } from "@/lib/v2/admin";
import { useFormState } from "@/lib/forms/useFormState";
import { testIds } from "@/lib/testids";
import { useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { parseMonto, requerido } from "@/lib/validation/v2";

const ids = testIds("v2-ahorros");

export default function NuevoAhorroV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioIdV2(usuario),
      cuentaId: "",
      nombreMeta: "",
      metaMonto: "",
      aporteMensual: "",
      tasaAnual: "0",
    },
    ids,
    validate: (v) => ({
      ...validarAhorro(v),
      ...(requerido()(v.usuarioId) ? { usuarioId: "Elegí el titular." } : {}),
      ...(requerido()(v.cuentaId) ? { cuentaId: "Elegí la cuenta de la que se debitan los aportes." } : {}),
    }),
  });

  // UI: el ahorro programado es solo en guaraníes y debita de una cuenta activa.
  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(form.values.usuarioId);
  const cuentasPyg = cuentas.filter((c) => c.estado === "activa" && c.moneda === "PYG");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const ahorro = await crearAhorroV2({
        usuarioId: Number(form.values.usuarioId),
        cuentaId: Number(form.values.cuentaId),
        nombreMeta: form.values.nombreMeta.trim(),
        metaMonto: parseMonto(form.values.metaMonto) as number,
        aporteMensual: parseMonto(form.values.aporteMensual) as number,
        tasaAnual: parseMonto(form.values.tasaAnual) ?? 0,
      });
      toast.success(`Meta "${ahorro.nombre_meta}" creada.`);
      router.push(`/v2/ahorros/${ahorro.id}`);
    } catch (err) {
      form.applyApiError(err, [], "No se pudo crear la meta de ahorro.");
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-ahorros" title="Nueva meta de ahorro" />
      <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
        <Field form={form} name="usuarioId" label="Titular">
          <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
        </Field>
        <Field form={form} name="cuentaId" label="Debitar aportes de" hint="Cuentas activas en guaraníes.">
          <CuentaSelect
            {...form.fieldProps("cuentaId", { hint: true })}
            items={cuentasPyg}
            isLoading={cuentasLoading}
            emptyLabel="El titular no tiene cuentas activas en PYG"
          />
        </Field>
        <AhorroFields form={form} />
        <FormError form={form} />
        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear meta"}
        </button>
      </form>
    </div>
  );
}
