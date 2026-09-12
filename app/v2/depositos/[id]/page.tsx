"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Fecha, Monto, Porcentaje } from "@/components/Valores";
import { cancelarDepositoV2, getDepositoV2 } from "@/lib/api/v2/depositos";
import { ApiError } from "@/lib/api/http";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { interesCancelacionDeposito } from "@/lib/v2/reglas";

const ids = testIds("v2-depositos");

export default function DepositoV2DetallePage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
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
      toast.success(`Depósito N° ${id} cancelado: ${formatMonto(updated.interes_generado, "PYG")} de interés acreditado.`);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "No se pudo cancelar el depósito.");
    } finally {
      setCancelando(false);
    }
  }

  const estimado =
    deposito && deposito.estado === "activo"
      ? interesCancelacionDeposito(Number(deposito.monto), Number(deposito.tasa_anual), deposito.plazo_dias, deposito.fecha_inicio)
      : null;

  return (
    <div className={shared.page}>
      <Link href="/v2/depositos" className={shared.backLink}>
        ← Depósitos
      </Link>
      <ModuleHeader moduleKey="v2-depositos" title={`Depósito a plazo N° ${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {deposito && (
          <>
            <div className={shared.stats} data-testid={ids.detail}>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Capital</span>
                <span className={shared.statValue}>
                  <Monto value={deposito.monto} moneda="PYG" testId="v2-depositos-detail-monto" />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Tasa anual</span>
                <Porcentaje value={deposito.tasa_anual} testId="v2-depositos-detail-tasa" />
                <span className={shared.statLabel}>Plazo</span>
                <span data-testid="v2-depositos-detail-plazo">{deposito.plazo_dias} días</span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>{deposito.estado === "activo" ? "Interés proyectado" : "Interés generado"}</span>
                <span className={shared.statValue}>
                  <Monto
                    value={deposito.estado === "activo" ? deposito.interes_proyectado : deposito.interes_generado}
                    moneda="PYG"
                    testId="v2-depositos-detail-interes"
                  />
                </span>
              </div>
              <div className={shared.stat}>
                <span className={shared.statLabel}>Estado</span>
                <span>
                  <span className={badgeFor(deposito.estado)} data-testid="v2-depositos-detail-estado" data-value={deposito.estado}>
                    {capitalizar(deposito.estado)}
                  </span>
                </span>
                {deposito.estado === "activo" && (
                  <span className={shared.statLabel} data-testid="v2-depositos-detail-dias-restantes">
                    {deposito.dias_restantes} días para el vencimiento
                  </span>
                )}
              </div>
            </div>

            <dl className={shared.summary}>
              <dt>Titular</dt>
              <dd>
                <Link href={`/v2/usuarios/${deposito.usuario_id}`}>Cliente #{deposito.usuario_id}</Link>
              </dd>
              <dt>Cuenta asociada</dt>
              <dd>
                <Link href={`/v2/cuentas/${deposito.cuenta_id}`}>Cuenta #{deposito.cuenta_id}</Link>
              </dd>
              <dt>Constituido el</dt>
              <dd>
                <Fecha value={deposito.fecha_inicio} />
              </dd>
              <dt>Vencimiento</dt>
              <dd>
                <Fecha value={deposito.fecha_vencimiento} />
              </dd>
            </dl>

            {deposito.estado === "activo" ? (
              <div className={shared.section}>
                <button
                  type="button"
                  className={shared.buttonDanger}
                  disabled={cancelando}
                  onClick={() => setConfirmOpen(true)}
                  data-testid={ids.rowAction(id, "cancelar")}
                >
                  {cancelando ? "Cancelando..." : "Cancelar anticipadamente"}
                </button>
                {cancelError && (
                  <p role="alert" className={shared.formError} data-testid={ids.rowAction(id, "cancelar-error")}>
                    {cancelError}
                  </p>
                )}
              </div>
            ) : (
              <p className={shared.info} data-testid="v2-depositos-detail-cerrado">
                {deposito.estado === "cancelado"
                  ? "Este depósito ya fue cancelado: el capital y el interés generado se acreditaron a la cuenta."
                  : "Este depósito venció: para reinvertirlo, constituí uno nuevo."}
              </p>
            )}
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cancelar este depósito anticipadamente?"
        description={
          estimado
            ? `Lleva ${estimado.dias} de los ${deposito?.plazo_dias} días del plazo: se te acredita el capital más un interés prorrateado estimado de ${formatMonto(estimado.interes, "PYG")}. Es definitivo.`
            : "Es definitivo."
        }
        confirmLabel="Cancelar depósito"
        danger
        testId={ids.rowAction(id, "cancelar")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCancelar}
      />
    </div>
  );
}
