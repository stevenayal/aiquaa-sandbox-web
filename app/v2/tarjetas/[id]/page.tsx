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
import { TarjetaAcciones, TarjetaPlastico, VencimientoFields, estaVencida, mmaa, toneUso } from "@/components/v2/Tarjeta";
import { Monto } from "@/components/Valores";
import {
  getTarjetaV2,
  actualizarTarjetaV2,
  eliminarTarjetaV2,
  cambiarLimiteTarjetaV2,
  type MarcaTarjetaV2,
  type TarjetaV2,
} from "@/lib/api/v2/tarjetas";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { MARCA_LABEL, badgeFor, capitalizar } from "@/lib/v2/labels";
import { porcentajeUso, ultimoDiaDelMes } from "@/lib/v2/reglas";
import { monto, requerido, validarCampos, vencimientoTarjeta } from "@/lib/validation/v2";

const ids = testIds("v2-tarjetas");
const limiteIds = testIds("v2-tarjetas-limite");

export default function TarjetaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);

  const { data: tarjeta, error, isLoading, mutate } = useSWR(["v2-tarjeta", id], () => getTarjetaV2(id));

  async function actualizada(updated: TarjetaV2, mensaje: string) {
    await mutate(updated, { revalidate: false });
    toast.success(mensaje);
  }

  return (
    <div className={shared.page}>
      <Link href="/v2/tarjetas" className={shared.backLink}>
        ← Tarjetas
      </Link>
      <ModuleHeader
        moduleKey="v2-tarjetas"
        title={tarjeta ? `${MARCA_LABEL[tarjeta.marca]} ···· ${tarjeta.numero_enmascarado.slice(-4)}` : `Tarjeta #${id}`}
      />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {tarjeta && <Detalle tarjeta={tarjeta} onChanged={actualizada} onDeleted={() => router.push("/v2/tarjetas")} />}
      </DataState>
    </div>
  );
}

function Detalle({
  tarjeta,
  onChanged,
  onDeleted,
}: {
  tarjeta: TarjetaV2;
  onChanged: (t: TarjetaV2, mensaje: string) => Promise<void>;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const vencida = estaVencida(tarjeta);
  const esCredito = tarjeta.tipo === "credito";
  const limite = Number(tarjeta.limite_credito);
  const utilizado = Number(tarjeta.saldo_utilizado);
  const uso = porcentajeUso(utilizado, limite);

  return (
    <>
      <div className={shared.twoColumns} data-testid={ids.detail}>
        <div className={shared.section}>
          <TarjetaPlastico
            marca={tarjeta.marca}
            tipo={tarjeta.tipo}
            numero={tarjeta.numero_enmascarado}
            vencimiento={mmaa(tarjeta.fecha_vencimiento)}
            testId="v2-tarjetas-plastico"
          />
          <p>
            <span className={badgeFor(vencida ? "vencida" : tarjeta.estado)} data-testid="v2-tarjetas-detail-estado" data-value={tarjeta.estado}>
              {vencida ? "Vencida" : capitalizar(tarjeta.estado)}
            </span>{" "}
            · Titular <Link href={`/v2/usuarios/${tarjeta.usuario_id}`}>Cliente #{tarjeta.usuario_id}</Link>
            {tarjeta.cuenta_id && (
              <>
                {" "}
                · Cuenta <Link href={`/v2/cuentas/${tarjeta.cuenta_id}`}>#{tarjeta.cuenta_id}</Link>
              </>
            )}
          </p>
          <TarjetaAcciones tarjeta={tarjeta} onChanged={onChanged} />
        </div>

        {esCredito ? (
          <div className={shared.section}>
            <div className={shared.stats}>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Disponible</span>
                <span className={shared.statValue}>
                  <Monto value={tarjeta.disponible} moneda="PYG" testId="v2-tarjetas-detail-disponible" />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Límite</span>
                <Monto value={tarjeta.limite_credito} moneda="PYG" testId="v2-tarjetas-detail-limite" />
                <span className={shared.statLabel}>Utilizado</span>
                <Monto value={tarjeta.saldo_utilizado} moneda="PYG" testId="v2-tarjetas-detail-utilizado" />
              </div>
            </div>
            <ProgressBar value={uso} label="Uso del límite" tone={toneUso(uso)} testId="v2-tarjetas-detail-uso" />
            <LimiteForm key={tarjeta.limite_credito} tarjeta={tarjeta} onChanged={onChanged} />
          </div>
        ) : (
          <p className={shared.info} data-testid="v2-tarjetas-detail-sin-limite">
            Tarjeta de débito: no tiene límite propio, las compras se debitan del saldo de la cuenta asociada.
          </p>
        )}
      </div>

      <EditarTarjetaForm key={`${tarjeta.marca}-${tarjeta.fecha_vencimiento}`} tarjeta={tarjeta} onChanged={onChanged} />

      <DeleteButton
        testId={ids.rowAction(tarjeta.id, "eliminar")}
        title="¿Dar de baja esta tarjeta?"
        description="La tarjeta deja de aparecer y no se puede volver a usar."
        label="Dar de baja"
        disabledReason={
          utilizado > 0 ? `Tiene ${formatMonto(utilizado, "PYG")} utilizados: primero hay que cancelar la deuda.` : null
        }
        onDelete={() => eliminarTarjetaV2(tarjeta.id)}
        onDeleted={() => {
          toast.success("Tarjeta dada de baja.");
          onDeleted();
        }}
      />
    </>
  );
}

function LimiteForm({ tarjeta, onChanged }: { tarjeta: TarjetaV2; onChanged: (t: TarjetaV2, mensaje: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const utilizado = Number(tarjeta.saldo_utilizado);
  const bloqueada = tarjeta.estado !== "activa" || estaVencida(tarjeta);
  const form = useFormState({
    initial: { limiteCredito: Number(tarjeta.limite_credito).toFixed(2) },
    ids: limiteIds,
    idPrefix: "limite-",
    validate: (v) =>
      validarCampos(v, {
        // Espejo de la API: el límite no puede quedar por debajo de lo ya utilizado.
        limiteCredito: [
          monto({
            min: utilizado,
            minMessage: `El límite no puede ser menor al saldo utilizado (${formatMonto(utilizado, "PYG")}).`,
          }),
        ],
      }),
  });
  const sinCambios = Number(form.values.limiteCredito) === Number(tarjeta.limite_credito);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await cambiarLimiteTarjetaV2(tarjeta.id, Number(form.values.limiteCredito));
      await onChanged(updated, `Límite actualizado a ${formatMonto(updated.limite_credito, "PYG")}.`);
    } catch (err) {
      form.applyApiError(err, [{ field: "limiteCredito", when: (e) => e.message.includes("límite") }], "No se pudo cambiar el límite.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={limiteIds.form}>
      <h2>Cambiar límite</h2>
      <Field
        form={form}
        name="limiteCredito"
        label="Nuevo límite"
        hint={bloqueada ? "Solo se puede cambiar el límite de una tarjeta activa." : `Mínimo: lo utilizado (${formatMonto(utilizado, "PYG")}).`}
      >
        <MontoInput {...form.controlProps("limiteCredito", { hint: true })} moneda="PYG" disabled={bloqueada} />
      </Field>
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting || sinCambios || bloqueada} data-testid={limiteIds.submit}>
        {submitting ? "Guardando..." : "Cambiar límite"}
      </button>
    </form>
  );
}

function EditarTarjetaForm({ tarjeta, onChanged }: { tarjeta: TarjetaV2; onChanged: (t: TarjetaV2, mensaje: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [anio, mes] = tarjeta.fecha_vencimiento.slice(0, 10).split("-");
  const form = useFormState({
    initial: { marca: tarjeta.marca as string, vencMes: mes, vencAnio: anio },
    ids,
    idPrefix: "edit-",
    validate: (v) => ({
      ...validarCampos(v, { marca: [requerido("Elegí la marca.")] }),
      ...(vencimientoTarjeta(v.vencMes, v.vencAnio) ? { vencAnio: vencimientoTarjeta(v.vencMes, v.vencAnio)! } : {}),
      ...(tarjeta.tipo === "debito" && v.marca === "amex" ? { marca: "American Express no emite tarjetas de débito." } : {}),
    }),
  });
  const sinCambios = form.values.marca === tarjeta.marca && form.values.vencMes === mes && form.values.vencAnio === anio;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await actualizarTarjetaV2(tarjeta.id, {
        marca: form.values.marca as MarcaTarjetaV2,
        fechaVencimiento: ultimoDiaDelMes(Number(form.values.vencAnio), Number(form.values.vencMes)),
      });
      await onChanged(updated, "Datos de la tarjeta actualizados.");
    } catch (err) {
      form.applyApiError(err, [], "No se pudo actualizar la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(tarjeta.id, "edit-form")}>
      <h2>Renovación</h2>
      <p className={shared.hint}>Cambiá la marca o extendé el vencimiento (reimpresión del plástico).</p>
      <Field form={form} name="marca" label="Marca">
        <select {...form.fieldProps("marca")}>
          <option value="visa">{MARCA_LABEL.visa}</option>
          <option value="mastercard">{MARCA_LABEL.mastercard}</option>
          <option value="amex">{MARCA_LABEL.amex}</option>
        </select>
      </Field>
      <VencimientoFields form={form} />
      <FormError form={form} />
      <button type="submit" className={shared.button} disabled={submitting || sinCambios} data-testid={ids.rowAction(tarjeta.id, "edit-submit")}>
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
