"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { Dialog } from "@/components/Dialog";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Field, FormError } from "@/components/form/Field";
import { useToast } from "@/components/Toast";
import { Fecha, Monto } from "@/components/Valores";
import { anularTransferenciaV2, getTransferenciaV2, type TransferenciaV2 } from "@/lib/api/v2/transferencias";
import { useFormState } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { longitud, requerido, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-transferencias");
const anularIds = testIds("v2-transferencias-anular");

export default function TransferenciaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const id = Number(params.id);
  const [anularOpen, setAnularOpen] = useState(false);

  const { data: t, error, isLoading, mutate } = useSWR(["v2-transferencia", id], () => getTransferenciaV2(id));

  return (
    <div className={shared.page}>
      <Link href="/v2/transferencias" className={shared.backLink}>
        ← Transferencias
      </Link>
      <ModuleHeader moduleKey="v2-transferencias" title={t ? t.referencia : `Transferencia #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {t && (
          <>
            <dl className={shared.summary} data-testid={ids.detail}>
              <dt>Estado</dt>
              <dd>
                <span className={badgeFor(t.estado)} data-testid="v2-transferencias-detail-estado" data-value={t.estado}>
                  {capitalizar(t.estado)}
                </span>
              </dd>
              <dt>Monto</dt>
              <dd>
                <Monto value={t.monto} moneda={t.moneda} testId="v2-transferencias-detail-monto" />
              </dd>
              <dt>Fecha</dt>
              <dd>
                <Fecha value={t.created_at} conHora />
              </dd>
              <dt>Desde</dt>
              <dd>
                <Link href={`/v2/cuentas/${t.cuenta_origen_id}`}>Cuenta #{t.cuenta_origen_id}</Link>
              </dd>
              <dt>Hacia</dt>
              <dd>
                {t.cuenta_destino_id ? (
                  <Link href={`/v2/cuentas/${t.cuenta_destino_id}`}>Cuenta #{t.cuenta_destino_id} (entre cuentas)</Link>
                ) : (
                  <Link href={`/v2/beneficiarios/${t.beneficiario_id}`}>Beneficiario #{t.beneficiario_id} (otro banco)</Link>
                )}
              </dd>
              <dt>Concepto</dt>
              <dd>{t.concepto ?? "—"}</dd>
              <dt>Referencia</dt>
              <dd data-testid="v2-transferencias-detail-referencia">{t.referencia}</dd>
            </dl>

            {t.estado === "completada" ? (
              <div className={shared.formActions}>
                <button
                  type="button"
                  className={shared.buttonDanger}
                  onClick={() => setAnularOpen(true)}
                  data-testid={ids.rowAction(id, "anular")}
                >
                  Anular transferencia
                </button>
              </div>
            ) : (
              <p className={shared.info} data-testid={ids.rowAction(id, "no-anulable")}>
                Solo se puede anular una transferencia completada.
              </p>
            )}

            <Dialog
              open={anularOpen}
              title="Anular transferencia"
              description={`Se revierte ${formatMonto(t.monto, t.moneda)} a la cuenta de origen. No se puede deshacer.`}
              onClose={() => setAnularOpen(false)}
              testId={ids.rowAction(id, "anular")}
            >
              <AnularForm
                transferencia={t}
                onCancel={() => setAnularOpen(false)}
                onDone={async (updated) => {
                  setAnularOpen(false);
                  await mutate(updated, { revalidate: false });
                  toast.success(`Transferencia ${updated.referencia} anulada.`);
                }}
              />
            </Dialog>
          </>
        )}
      </DataState>
    </div>
  );
}

function AnularForm({
  transferencia,
  onCancel,
  onDone,
}: {
  transferencia: TransferenciaV2;
  onCancel: () => void;
  onDone: (t: TransferenciaV2) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: { motivo: "" },
    ids: anularIds,
    validate: (v) =>
      validarCampos(v, {
        // UI: el motivo es obligatorio y descriptivo (la API lo acepta opcional).
        motivo: [requerido("Contanos por qué anulás la transferencia."), longitud({ min: 10, max: 120, label: "El motivo" })],
      }),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      await onDone(await anularTransferenciaV2(transferencia.id, form.values.motivo.trim()));
    } catch (err) {
      form.applyApiError(err, [], "No se pudo anular la transferencia.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={anularIds.form}>
      <Field form={form} name="motivo" label="Motivo" hint="Entre 10 y 120 caracteres.">
        <textarea {...form.fieldProps("motivo", { hint: true })} rows={3} />
      </Field>
      <FormError form={form} />
      <div className={shared.formActions}>
        <button type="button" className={shared.buttonSecondary} onClick={onCancel} data-testid={anularIds.rowAction(transferencia.id, "cancelar")}>
          Volver
        </button>
        <button type="submit" className={shared.buttonDanger} disabled={submitting} data-testid={anularIds.submit}>
          {submitting ? "Anulando..." : "Anular"}
        </button>
      </div>
    </form>
  );
}
