"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { CheckboxField, RadioCards } from "@/components/form/RadioCards";
import { useToast } from "@/components/Toast";
import { ClienteSelect, CuentaSelect } from "@/components/v2/EntitySelects";
import { TarjetaPlastico, VencimientoFields } from "@/components/v2/Tarjeta";
import { emitirTarjetaV2, type MarcaTarjetaV2, type TipoTarjetaV2 } from "@/lib/api/v2/tarjetas";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioIdV2 } from "@/lib/v2/admin";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { MARCA_LABEL } from "@/lib/v2/labels";
import { ultimoDiaDelMes } from "@/lib/v2/reglas";
import { useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { LIMITE_TARJETA, monto, requerido, validarCampos, vencimientoTarjeta } from "@/lib/validation/v2";

const ids = testIds("v2-tarjetas");

export default function NuevaTarjetaV2Page() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [submitting, setSubmitting] = useState(false);

  const vencPorDefecto = new Date();
  const form = useFormState({
    initial: {
      usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioIdV2(usuario),
      tipo: "credito",
      marca: "visa",
      cuentaId: "",
      limiteCredito: "",
      vencMes: String(vencPorDefecto.getMonth() + 1).padStart(2, "0"),
      vencAnio: String(vencPorDefecto.getFullYear() + 4),
      declaracion: "",
    },
    ids,
    validate: (v) => ({
      ...validarCampos(v, {
        usuarioId: [requerido("Elegí el titular.")],
        // UI: débito siempre va asociada a una cuenta (la API la acepta sin cuenta).
        cuentaId: v.tipo === "debito" ? [requerido("Una tarjeta de débito tiene que estar asociada a una cuenta.")] : [],
        // UI: rango de límite para tarjetas nuevas. La API acepta cualquier número >= 0.
        limiteCredito:
          v.tipo === "credito"
            ? [
                monto({
                  min: LIMITE_TARJETA.min,
                  max: LIMITE_TARJETA.max,
                  minMessage: `El límite mínimo es ${formatMonto(LIMITE_TARJETA.min, "PYG")}.`,
                  maxMessage: `El límite máximo es ${formatMonto(LIMITE_TARJETA.max, "PYG")}.`,
                }),
              ]
            : [],
        declaracion: [requerido("Tenés que aceptar las condiciones de uso de la tarjeta.")],
      }),
      ...(vencimientoTarjeta(v.vencMes, v.vencAnio) ? { vencAnio: vencimientoTarjeta(v.vencMes, v.vencAnio)! } : {}),
      // UI: American Express solo emite crédito.
      ...(v.tipo === "debito" && v.marca === "amex" ? { marca: "American Express no emite tarjetas de débito." } : {}),
    }),
  });

  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(form.values.usuarioId);
  const cuentasActivas = cuentas.filter((c) => c.estado === "activa");
  const titularNombre = clientes.find((c) => String(c.id) === form.values.usuarioId)?.nombre;
  const esCredito = form.values.tipo === "credito";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    const { values } = form;
    try {
      const tarjeta = await emitirTarjetaV2({
        usuarioId: Number(values.usuarioId),
        cuentaId: values.cuentaId ? Number(values.cuentaId) : undefined,
        tipo: values.tipo as TipoTarjetaV2,
        marca: values.marca as MarcaTarjetaV2,
        limiteCredito: esCredito ? Number(values.limiteCredito) : undefined,
        fechaVencimiento: ultimoDiaDelMes(Number(values.vencAnio), Number(values.vencMes)),
      });
      toast.success(`Tarjeta ${MARCA_LABEL[tarjeta.marca]} ···· ${tarjeta.numero_enmascarado.slice(-4)} emitida.`);
      router.push(`/v2/tarjetas/${tarjeta.id}`);
    } catch (err) {
      form.applyApiError(
        err,
        [{ field: "vencAnio", when: (e) => e.message.includes("YYYY-MM-DD"), message: "Fecha de vencimiento inválida." }],
        "No se pudo emitir la tarjeta.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-tarjetas" title="Solicitar tarjeta" />

      <div className={shared.twoColumns}>
        <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
          <Field form={form} name="usuarioId" label="Titular">
            <ClienteSelect {...form.fieldProps("usuarioId")} items={clientes} isLoading={clientesLoading} />
          </Field>

          <RadioCards
            form={form}
            name="tipo"
            legend="Tipo de tarjeta"
            options={[
              { value: "credito", label: "Crédito", description: "Con límite propio, se paga a fin de mes." },
              { value: "debito", label: "Débito", description: "Usa el saldo de una cuenta." },
            ]}
          />

          <RadioCards
            form={form}
            name="marca"
            legend="Marca"
            options={[
              { value: "visa", label: MARCA_LABEL.visa },
              { value: "mastercard", label: MARCA_LABEL.mastercard },
              { value: "amex", label: MARCA_LABEL.amex, description: "Solo crédito." },
            ]}
          />

          <Field
            form={form}
            name="cuentaId"
            label={esCredito ? "Cuenta para débito automático (opcional)" : "Cuenta asociada"}
            hint={!cuentasLoading && cuentasActivas.length === 0 && form.values.usuarioId ? "El titular no tiene cuentas activas." : undefined}
          >
            <CuentaSelect
              {...form.fieldProps("cuentaId", { hint: !cuentasLoading && cuentasActivas.length === 0 && Boolean(form.values.usuarioId) })}
              items={cuentasActivas}
              isLoading={cuentasLoading}
              placeholder={esCredito ? "Sin cuenta" : "Elegí una cuenta"}
            />
          </Field>

          {esCredito ? (
            <Field
              form={form}
              name="limiteCredito"
              label="Límite de crédito"
              hint={`Entre ${formatMonto(LIMITE_TARJETA.min, "PYG")} y ${formatMonto(LIMITE_TARJETA.max, "PYG")}.`}
            >
              <MontoInput {...form.controlProps("limiteCredito", { hint: true })} moneda="PYG" />
            </Field>
          ) : (
            <p className={shared.info} data-testid={ids.hint("limiteCredito")}>
              Las tarjetas de débito no tienen límite: se emiten con límite 0 y usan el saldo de la cuenta.
            </p>
          )}

          <VencimientoFields form={form} />

          <CheckboxField form={form} name="declaracion">
            Acepto las condiciones de uso de la tarjeta y el costo de emisión.
          </CheckboxField>

          <FormError form={form} />

          <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
            {submitting ? "Emitiendo..." : "Emitir tarjeta"}
          </button>
        </form>

        <aside className={shared.section} aria-label="Vista previa">
          <TarjetaPlastico
            marca={form.values.marca as MarcaTarjetaV2}
            tipo={form.values.tipo as TipoTarjetaV2}
            numero="**** **** **** ····"
            titular={titularNombre}
            vencimiento={form.values.vencMes && form.values.vencAnio ? `${form.values.vencMes}/${form.values.vencAnio.slice(2)}` : "MM/AA"}
            testId="v2-tarjetas-preview"
          />
          <p className={shared.hint}>El número se genera al emitir la tarjeta.</p>
        </aside>
      </div>
    </div>
  );
}
