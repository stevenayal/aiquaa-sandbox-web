"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listMovimientosDetalle } from "@/lib/api/movimientos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";
import { Fecha, Monto } from "@/components/Valores";

const ids = testIds("movimientos");

export default function MovimientosPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: movimientos, error, isLoading } = useSWR(["movimientos", parsedUsuarioId], () =>
    listMovimientosDetalle(parsedUsuarioId),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="movimientos" title="Movimientos">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todos"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <Link href="/movimientos/new" className={shared.button}>
          Nuevo movimiento
        </Link>
        <Link href="/reportes" className={shared.buttonSecondary}>
          Ver reportes
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(movimientos?.length ?? 0) === 0}
        count={movimientos?.length ?? 0}
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
              <th>Tipo</th>
              <th>Monto</th>
              <th>Referencia</th>
              <th>Descripción</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movimientos?.map((movimiento) => (
              <tr key={movimiento.id} data-testid={ids.row(movimiento.id)}>
                <td>
                  <Link href={`/movimientos/${movimiento.id}`}>{movimiento.id}</Link>
                </td>
                <td>
                  <Link href={`/usuarios/${movimiento.usuario_id}`}>{movimiento.usuario_id}</Link>
                </td>
                <td>{movimiento.tipo_movimiento}</td>
                <td>
                  <Monto value={movimiento.monto} />
                </td>
                <td>{movimiento.referencia_id ?? "—"}</td>
                <td>{movimiento.descripcion ?? "—"}</td>
                <td>
                  <Fecha value={movimiento.created_at} conHora />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
