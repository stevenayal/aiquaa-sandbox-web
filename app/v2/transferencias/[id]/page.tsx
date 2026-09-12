"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getTransferenciaV2, anularTransferenciaV2, type EstadoTransferenciaV2 } from "@/lib/api/v2/transferencias";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha, Monto } from "@/components/Valores";

const ids = testIds("v2-transferencias");

function badgeClass(estado: EstadoTransferenciaV2): string {
  if (estado === "completada") return shared.badgeSuccess;
  if (estado === "rechazada") return shared.badgeDanger;
  if (estado === "anulada") return shared.badge;
  return shared.badgeWarning;
}

export default function TransferenciaV2DetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: transferencia, error, isLoading, mutate } = useSWR(["v2-transferencia", id], () =>
    getTransferenciaV2(id),
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleAnular() {
    setConfirmOpen(false);
    setActionError(null);
    setActionSuccess(null);
    setPending(true);
    try {
      const updated = await anularTransferenciaV2(id);
      await mutate(updated, { revalidate: false });
      setActionSuccess("Transferencia anulada.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo anular la transferencia.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-transferencias" title={`Transferencia #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {transferencia && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Cuenta origen</dt>
                <dd>{transferencia.cuenta_origen_id}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta destino</dt>
                <dd>{transferencia.cuenta_destino_id ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Beneficiario</dt>
                <dd>{transferencia.beneficiario_id ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>
                  <Monto value={transferencia.monto} moneda={transferencia.moneda} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Moneda</dt>
                <dd>{transferencia.moneda}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Concepto</dt>
                <dd>{transferencia.concepto ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Referencia</dt>
                <dd>{transferencia.referencia}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(transferencia.estado)}>{transferencia.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Creada</dt>
                <dd>
                  <Fecha value={transferencia.created_at} conHora />
                </dd>
              </div>
            </dl>

            {actionError && (
              <p role="alert" className={shared.fieldError}>
                {actionError}
              </p>
            )}
            {actionSuccess && (
              <p role="status" className={shared.success} data-testid={ids.success}>
                {actionSuccess}
              </p>
            )}

            {transferencia.estado === "completada" && (
              <button
                type="button"
                className={shared.buttonDanger}
                disabled={pending}
                onClick={() => setConfirmOpen(true)}
                data-testid={ids.rowAction(id, "anular")}
              >
                {pending ? "Anulando..." : "Anular transferencia"}
              </button>
            )}

            <ConfirmDialog
              open={confirmOpen}
              title="¿Anular esta transferencia?"
              description="Se revierten los saldos (contraasiento) y queda marcada como anulada — no se puede deshacer."
              confirmLabel="Anular"
              danger
              testId={ids.rowAction(id, "anular")}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleAnular}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
