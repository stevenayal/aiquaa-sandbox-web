"use client";

import { useState, type FormEvent, type SelectHTMLAttributes } from "react";
import shared from "@/components/shared.module.css";
import styles from "./Tarjeta.module.css";
import { Dialog } from "@/components/Dialog";
import { Field, FormError, type FieldHost } from "@/components/form/Field";
import { activarTarjetaV2, bloquearTarjetaV2, type MarcaTarjetaV2, type TarjetaV2, type TipoTarjetaV2 } from "@/lib/api/v2/tarjetas";
import { ApiError } from "@/lib/api/http";
import { useFormState } from "@/lib/forms/useFormState";
import { testIds } from "@/lib/testids";
import { MARCA_LABEL, TIPO_TARJETA_LABEL } from "@/lib/v2/labels";
import { MOTIVOS_BLOQUEO, toISODate } from "@/lib/v2/reglas";
import { requerido, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-tarjetas");
const bloqueoIds = testIds("v2-tarjetas-bloqueo");

/** `2029-08-31` → `08/29`. */
export function mmaa(fecha: string): string {
  const [anio, mes] = fecha.slice(0, 10).split("-");
  return `${mes}/${anio.slice(2)}`;
}

/**
 * La API no pasa sola una tarjeta a `vencida`: la UI la considera vencida si
 * la fecha ya pasó, aunque el estado siga en `activa`.
 */
export function estaVencida(tarjeta: Pick<TarjetaV2, "estado" | "fecha_vencimiento">, hoy = new Date()): boolean {
  return tarjeta.estado === "vencida" || tarjeta.fecha_vencimiento.slice(0, 10) < toISODate(hoy);
}

/** Color de la barra de uso: alerta desde 70 %, peligro desde 90 %. */
export function toneUso(pct: number): "default" | "warning" | "danger" {
  return pct >= 90 ? "danger" : pct >= 70 ? "warning" : "default";
}

/** Frente de la tarjeta, como la ve el cliente en su home banking. */
export function TarjetaPlastico({
  marca,
  tipo,
  numero,
  titular,
  vencimiento,
  testId,
}: {
  marca: MarcaTarjetaV2;
  tipo: TipoTarjetaV2;
  numero: string;
  titular?: string;
  vencimiento: string;
  testId?: string;
}) {
  return (
    <div className={`${styles.plastico} ${styles[marca]}`} data-testid={testId} aria-label={`Tarjeta ${MARCA_LABEL[marca]} ${numero}`}>
      <div className={styles.top}>
        <span>aiquaa Banking</span>
        <span>{TIPO_TARJETA_LABEL[tipo]}</span>
      </div>
      <span className={styles.chip} aria-hidden="true" />
      <span className={styles.numero}>{numero}</span>
      <div className={styles.bottom}>
        <span className={styles.titular}>{titular ?? " "}</span>
        <span>
          <small>VENCE </small>
          {vencimiento}
        </span>
        <strong>{MARCA_LABEL[marca]}</strong>
      </div>
    </div>
  );
}

/** Bloquear (con motivo obligatorio) o activar, según el estado. Se usa en la lista y en el detalle. */
export function TarjetaAcciones({
  tarjeta,
  onChanged,
}: {
  tarjeta: TarjetaV2;
  onChanged: (tarjeta: TarjetaV2, mensaje: string) => Promise<void>;
}) {
  const [bloquearOpen, setBloquearOpen] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vencida = estaVencida(tarjeta);

  async function activar() {
    setActivando(true);
    setError(null);
    try {
      const updated = await activarTarjetaV2(tarjeta.id);
      await onChanged(updated, `Tarjeta ${tarjeta.numero_enmascarado.slice(-4)} activada.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo activar la tarjeta.");
    } finally {
      setActivando(false);
    }
  }

  return (
    <div className={shared.section}>
      <div className={shared.rowActions}>
        {tarjeta.estado === "activa" && !vencida && (
          <button
            type="button"
            className={shared.buttonSecondary}
            onClick={() => setBloquearOpen(true)}
            data-testid={ids.rowAction(tarjeta.id, "bloquear")}
          >
            Bloquear
          </button>
        )}
        {tarjeta.estado === "bloqueada" && (
          <button
            type="button"
            className={shared.button}
            onClick={activar}
            disabled={activando || vencida}
            data-testid={ids.rowAction(tarjeta.id, "activar")}
          >
            {activando ? "Activando..." : "Activar"}
          </button>
        )}
      </div>
      {vencida && (
        <p className={shared.hint} data-testid={ids.rowAction(tarjeta.id, "vencida")}>
          Tarjeta vencida: no se puede bloquear ni activar.
        </p>
      )}
      {error && (
        <p role="alert" className={shared.fieldError} data-testid={ids.rowAction(tarjeta.id, "accion-error")}>
          {error}
        </p>
      )}
      <Dialog
        open={bloquearOpen}
        title={`Bloquear tarjeta ${tarjeta.numero_enmascarado.slice(-9)}`}
        description="Mientras esté bloqueada no se va a poder usar. Si fue robada o hubo fraude, no la vuelvas a activar."
        onClose={() => setBloquearOpen(false)}
        testId={ids.rowAction(tarjeta.id, "bloquear")}
      >
        <BloqueoForm
          tarjeta={tarjeta}
          onCancel={() => setBloquearOpen(false)}
          onDone={async (updated, motivo) => {
            setBloquearOpen(false);
            await onChanged(updated, `Tarjeta ${tarjeta.numero_enmascarado.slice(-4)} bloqueada por ${motivo.toLowerCase()}.`);
          }}
        />
      </Dialog>
    </div>
  );
}

function BloqueoForm({
  tarjeta,
  onCancel,
  onDone,
}: {
  tarjeta: TarjetaV2;
  onCancel: () => void;
  onDone: (tarjeta: TarjetaV2, motivoLabel: string) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: { motivo: "" },
    ids: bloqueoIds,
    idPrefix: `bloqueo-${tarjeta.id}-`,
    validate: (v) => validarCampos(v, { motivo: [requerido("Elegí el motivo del bloqueo.")] }),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await bloquearTarjetaV2(tarjeta.id, form.values.motivo);
      const label = MOTIVOS_BLOQUEO.find((m) => m.value === form.values.motivo)?.label ?? form.values.motivo;
      await onDone(updated, label);
    } catch (err) {
      form.applyApiError(err, [], "No se pudo bloquear la tarjeta.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={bloqueoIds.form}>
      <Field form={form} name="motivo" label="Motivo">
        <select {...form.fieldProps("motivo")}>
          <option value="">Elegí un motivo</option>
          {MOTIVOS_BLOQUEO.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <FormError form={form} />
      <div className={shared.formActions}>
        <button type="button" className={shared.buttonSecondary} onClick={onCancel} data-testid={bloqueoIds.rowAction(tarjeta.id, "cancelar")}>
          Cancelar
        </button>
        <button type="submit" className={shared.buttonDanger} disabled={submitting} data-testid={bloqueoIds.submit}>
          {submitting ? "Bloqueando..." : "Bloquear tarjeta"}
        </button>
      </div>
    </form>
  );
}

const MESES = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

/** Selects MM / AAAA del vencimiento, como se lee en el plástico. */
export function VencimientoFields({
  form,
}: {
  form: FieldHost & { fieldProps(name: "vencMes" | "vencAnio"): SelectHTMLAttributes<HTMLSelectElement> };
}) {
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 7 }, (_, i) => String(anioActual + i - 1));
  return (
    <div className={styles.vencimiento}>
      <Field form={form} name="vencMes" label="Mes de vencimiento">
        <select {...form.fieldProps("vencMes")}>
          <option value="">MM</option>
          {MESES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>
      <Field form={form} name="vencAnio" label="Año de vencimiento">
        <select {...form.fieldProps("vencAnio")}>
          <option value="">AAAA</option>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
