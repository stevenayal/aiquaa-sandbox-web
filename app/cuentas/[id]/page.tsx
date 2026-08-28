"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { getCuenta } from "@/lib/api/cuentas";
import { testIds } from "@/lib/testids";

const ids = testIds("cuentas");

export default function CuentaDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: cuenta, error, isLoading } = useSWR(["cuenta", id], () => getCuenta(id));

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="cuentas" title={`Cuenta #${id}`}>
        <Link href="/transferencias" className={shared.button}>
          Nueva transferencia
        </Link>
      </ModuleHeader>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {cuenta && (
          <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
            <div className={shared.detailField}>
              <dt>Usuario</dt>
              <dd>
                <Link href={`/usuarios/${cuenta.usuario_id}`}>{cuenta.usuario_id}</Link>
              </dd>
            </div>
            <div className={shared.detailField}>
              <dt>Número de cuenta</dt>
              <dd>{cuenta.numero_cuenta}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Tipo</dt>
              <dd>{cuenta.tipo_cuenta}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Moneda</dt>
              <dd>{cuenta.moneda}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Saldo</dt>
              <dd>{cuenta.saldo}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Activa</dt>
              <dd>{cuenta.activa ? "Sí" : "No"}</dd>
            </div>
          </dl>
        )}
      </DataState>
    </div>
  );
}
