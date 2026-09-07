"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listDepositosV2, type EstadoDepositoV2 } from "@/lib/api/v2/depositos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-depositos");
const ESTADOS: EstadoDepositoV2[] = ["activo", "vencido", "cancelado"];

function badgeClass(estado: EstadoDepositoV2): string {
  if (estado === "activo") return shared.badgeSuccess;
  if (estado === "cancelado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function DepositosV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<EstadoDepositoV2 | "">("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: depositos, error, isLoading } = useSWR(["v2-depositos", parsedUsuarioId, estado], () =>
    listDepositosV2({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-depositos" title="Depósitos">
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todos"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoDepositoV2 | "")}
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
        <Link href="/v2/depositos/new" className={shared.button}>
          Nuevo depósito
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(depositos?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Monto</th>
              <th>Tasa anual</th>
              <th>Plazo (días)</th>
              <th>Vencimiento</th>
              <th>Días restantes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {depositos?.map((deposito) => (
              <tr key={deposito.id} data-testid={ids.row(deposito.id)}>
                <td>
                  <Link href={`/v2/depositos/${deposito.id}`}>{deposito.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${deposito.usuario_id}`}>{deposito.usuario_id}</Link>
                </td>
                <td>{deposito.monto}</td>
                <td>{deposito.tasa_anual}</td>
                <td>{deposito.plazo_dias}</td>
                <td>{new Date(deposito.fecha_vencimiento).toLocaleDateString()}</td>
                <td>{deposito.dias_restantes}</td>
                <td>
                  <span className={badgeClass(deposito.estado)}>{deposito.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
