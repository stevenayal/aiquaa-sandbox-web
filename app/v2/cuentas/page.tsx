"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listCuentasV2, type EstadoCuentaV2 } from "@/lib/api/v2/cuentas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";
import { Monto } from "@/components/Valores";

const ids = testIds("v2-cuentas");
const ESTADOS: EstadoCuentaV2[] = ["activa", "bloqueada", "cerrada"];

function badgeClass(estado: EstadoCuentaV2): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "cerrada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function CuentasV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<EstadoCuentaV2 | "">("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: cuentas, error, isLoading } = useSWR(["v2-cuentas", parsedUsuarioId, estado], () =>
    listCuentasV2({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-cuentas" title="Cuentas">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCuentaV2 | "")}
            data-testid={ids.field("estado")}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <Link href="/v2/cuentas/new" className={shared.button}>
          Abrir cuenta
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(cuentas?.length ?? 0) === 0}
        count={cuentas?.length ?? 0}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Número</th>
              <th>Tipo</th>
              <th>Moneda</th>
              <th>Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cuentas?.map((cuenta) => (
              <tr key={cuenta.id} data-testid={ids.row(cuenta.id)}>
                <td>
                  <Link href={`/v2/cuentas/${cuenta.id}`}>{cuenta.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${cuenta.usuario_id}`}>{cuenta.usuario_id}</Link>
                </td>
                <td>{cuenta.numero_cuenta}</td>
                <td>{cuenta.tipo_cuenta}</td>
                <td>{cuenta.moneda}</td>
                <td>
                  <Monto value={cuenta.saldo} moneda={cuenta.moneda} />
                </td>
                <td>
                  <span className={badgeClass(cuenta.estado)}>{cuenta.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
