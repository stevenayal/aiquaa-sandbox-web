"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getDepositoV2, cancelarDepositoV2, type EstadoDepositoV2 } from "@/lib/api/v2/depositos";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha, Monto, Porcentaje } from "@/components/Valores";

const ids = testIds("v2-depositos");

function badgeClass(estado: EstadoDepositoV2): string {
  if (estado === "activo") return shared.badgeSuccess;
  if (estado === "cancelado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function DepositoV2DetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: deposito, error, isLoading, mutate } = useSWR(["v2-deposito", id], () => getDepositoV2(id));

  const [cancelando, setCancelando] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCancelar() {
    setConfirmOpen(false);
    setCancelando(true);
    setCancelError(null);
    try {
      const updated = await cancelarDepositoV2(id);
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "No se pudo cancelar el depósito.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-depositos" title={`Depósito #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {deposito && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/v2/usuarios/${deposito.usuario_id}`}>{deposito.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta</dt>
                <dd>{deposito.cuenta_id}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>
                  <Monto value={deposito.monto} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tasa anual</dt>
                <dd>
                  <Porcentaje value={deposito.tasa_anual} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Plazo (días)</dt>
                <dd>{deposito.plazo_dias}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha de inicio</dt>
                <dd>
                  <Fecha value={deposito.fecha_inicio} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha de vencimiento</dt>
                <dd>
                  <Fecha value={deposito.fecha_vencimiento} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Interés generado</dt>
                <dd>
                  <Monto value={deposito.interes_generado} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Interés proyectado</dt>
                <dd>
                  <Monto value={deposito.interes_proyectado} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Días restantes</dt>
                <dd>{deposito.dias_restantes}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(deposito.estado)}>{deposito.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Creado</dt>
                <dd>
                  <Fecha value={deposito.created_at} conHora />
                </dd>
              </div>
            </dl>

            {cancelError && (
              <p role="alert" className={shared.fieldError}>
                {cancelError}
              </p>
            )}

            {deposito.estado === "activo" && (
              <button
                type="button"
                className={shared.buttonDanger}
                disabled={cancelando}
                onClick={() => setConfirmOpen(true)}
                data-testid={ids.rowAction(id, "cancelar")}
              >
                {cancelando ? "Cancelando..." : "Cancelar depósito"}
              </button>
            )}

            <ConfirmDialog
              open={confirmOpen}
              title="¿Cancelar este depósito anticipadamente?"
              description="Se acredita el capital más el interés prorrateado por los días transcurridos (no el interés del plazo completo) — no se puede deshacer."
              confirmLabel="Cancelar depósito"
              danger
              testId={ids.rowAction(id, "cancelar")}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleCancelar}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
