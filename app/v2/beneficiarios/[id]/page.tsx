"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { FormError } from "@/components/form/Field";
import { useToast } from "@/components/Toast";
import { BENEFICIARIO_API_ERRORS, BeneficiarioFields, validarBeneficiario } from "@/components/v2/BeneficiarioFields";
import { Fecha } from "@/components/Valores";
import {
  actualizarBeneficiarioV2,
  eliminarBeneficiarioV2,
  getBeneficiarioV2,
  type BeneficiarioV2,
} from "@/lib/api/v2/beneficiarios";
import { useFormState } from "@/lib/forms/useFormState";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-beneficiarios");

export default function BeneficiarioV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);

  const { data: beneficiario, error, isLoading, mutate } = useSWR(["v2-beneficiario", id], () => getBeneficiarioV2(id));

  return (
    <div className={shared.page}>
      <Link href="/v2/beneficiarios" className={shared.backLink}>
        ← Beneficiarios
      </Link>
      <ModuleHeader moduleKey="v2-beneficiarios" title={beneficiario ? (beneficiario.alias ?? beneficiario.nombre) : `Beneficiario #${id}`}>
        {beneficiario && (
          <Link
            href={`/v2/transferencias/new?tipo=beneficiario&beneficiarioId=${id}&usuarioId=${beneficiario.usuario_id}`}
            className={shared.button}
            data-testid={ids.rowAction(id, "transferir")}
          >
            Transferir
          </Link>
        )}
      </ModuleHeader>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {beneficiario && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Titular de la cuenta</dt>
                <dd data-testid="v2-beneficiarios-detail-nombre">{beneficiario.nombre}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Banco</dt>
                <dd data-testid="v2-beneficiarios-detail-banco">{beneficiario.banco}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número de cuenta</dt>
                <dd data-testid="v2-beneficiarios-detail-numero">{beneficiario.numero_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Agendado por</dt>
                <dd>
                  <Link href={`/v2/usuarios/${beneficiario.usuario_id}`}>Cliente #{beneficiario.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Agendado el</dt>
                <dd>
                  <Fecha value={beneficiario.created_at} />
                </dd>
              </div>
            </dl>

            <EditarBeneficiarioForm
              key={`${beneficiario.nombre}-${beneficiario.banco}-${beneficiario.numero_cuenta}-${beneficiario.alias}`}
              beneficiario={beneficiario}
              onSaved={async (updated) => {
                await mutate(updated, { revalidate: false });
                toast.success("Beneficiario actualizado.");
              }}
            />

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Quitar este beneficiario?"
              description="Deja de aparecer al transferir. Las transferencias ya hechas no se modifican."
              label="Quitar beneficiario"
              onDelete={() => eliminarBeneficiarioV2(id)}
              onDeleted={() => {
                toast.success("Beneficiario quitado.");
                router.push("/v2/beneficiarios");
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}

function EditarBeneficiarioForm({
  beneficiario,
  onSaved,
}: {
  beneficiario: BeneficiarioV2;
  onSaved: (b: BeneficiarioV2) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: {
      nombre: beneficiario.nombre,
      banco: beneficiario.banco,
      numeroCuenta: beneficiario.numero_cuenta,
      alias: beneficiario.alias ?? "",
    },
    ids,
    idPrefix: "edit-",
    validate: validarBeneficiario,
  });
  const sinCambios =
    form.values.nombre.trim() === beneficiario.nombre &&
    form.values.banco === beneficiario.banco &&
    form.values.numeroCuenta.trim() === beneficiario.numero_cuenta &&
    form.values.alias.trim() === (beneficiario.alias ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await actualizarBeneficiarioV2(beneficiario.id, {
        nombre: form.values.nombre.trim(),
        banco: form.values.banco,
        numeroCuenta: form.values.numeroCuenta.trim(),
        alias: form.values.alias.trim() || undefined,
      });
      await onSaved(updated);
    } catch (err) {
      form.applyApiError(err, BENEFICIARIO_API_ERRORS, "No se pudo actualizar el beneficiario.");
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(beneficiario.id, "edit-form")}>
      <h2>Editar datos</h2>
      <BeneficiarioFields form={form} />
      <FormError form={form} />
      <button
        type="submit"
        className={shared.button}
        disabled={submitting || sinCambios}
        data-testid={ids.rowAction(beneficiario.id, "edit-submit")}
      >
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
