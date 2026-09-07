"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listAhorrosV2, type EstadoAhorroV2 } from "@/lib/api/v2/ahorros";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-ahorros");
const ESTADOS: EstadoAhorroV2[] = ["activo", "completado", "cancelado"];

function badgeClass(estado: EstadoAhorroV2): string {
  if (estado === "completado") return shared.badgeSuccess;
  if (estado === "cancelado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function AhorrosV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<EstadoAhorroV2 | "">("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: ahorros, error, isLoading } = useSWR(["v2-ahorros", parsedUsuarioId, estado], () =>
    listAhorrosV2({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-ahorros" title="Ahorros">
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
            onChange={(e) => setEstado(e.target.value as EstadoAhorroV2 | "")}
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
        <Link href="/v2/ahorros/new" className={shared.button}>
          Nuevo plan
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(ahorros?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Meta</th>
              <th>Monto meta</th>
              <th>Aporte mensual</th>
              <th>Acumulado</th>
              <th>Falta para meta</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ahorros?.map((ahorro) => (
              <tr key={ahorro.id} data-testid={ids.row(ahorro.id)}>
                <td>
                  <Link href={`/v2/ahorros/${ahorro.id}`}>{ahorro.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${ahorro.usuario_id}`}>{ahorro.usuario_id}</Link>
                </td>
                <td>{ahorro.nombre_meta}</td>
                <td>{ahorro.meta_monto}</td>
                <td>{ahorro.aporte_mensual}</td>
                <td>{ahorro.saldo_acumulado}</td>
                <td>{ahorro.falta_para_meta}</td>
                <td>
                  <span className={badgeClass(ahorro.estado)}>{ahorro.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
