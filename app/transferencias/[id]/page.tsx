"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { getTransferencia } from "@/lib/api/transferencias";
import { testIds } from "@/lib/testids";

const ids = testIds("transferencias");

function badgeClass(estado: string): string {
  if (estado === "completada") return shared.badgeSuccess;
  if (estado === "rechazada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function TransferenciaDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: transferencia, error, isLoading } = useSWR(["transferencia", id], () => getTransferencia(id));

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Transferencia #{id}</h1>
        <Link href="/transferencias" className={shared.buttonSecondary}>
          Nueva transferencia
        </Link>
      </div>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {transferencia && (
          <>
            <p role="status" className={shared.success} data-testid={ids.success}>
              Transferencia creada.
            </p>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Cuenta origen</dt>
                <dd>
                  <Link href={`/cuentas/${transferencia.cuenta_origen_id}`}>
                    {transferencia.cuenta_origen_id}
                  </Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta destino</dt>
                <dd>
                  <Link href={`/cuentas/${transferencia.cuenta_destino_id}`}>
                    {transferencia.cuenta_destino_id}
                  </Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>{transferencia.monto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Descripción</dt>
                <dd>{transferencia.descripcion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(transferencia.estado)}>{transferencia.estado}</span>
                </dd>
              </div>
            </dl>
          </>
        )}
      </DataState>
    </div>
  );
}
