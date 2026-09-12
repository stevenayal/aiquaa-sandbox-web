"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listOrdenes } from "@/lib/api/ordenes";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";
import { Monto } from "@/components/Valores";

const ids = testIds("ordenes");

export default function OrdenesPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: ordenes, error, isLoading } = useSWR(["ordenes", parsedUsuarioId], () =>
    listOrdenes(parsedUsuarioId),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="ordenes" title="Órdenes">
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <Link href="/ordenes/new" className={shared.button}>
          Nueva orden
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(ordenes?.length ?? 0) === 0}
        count={ordenes?.length ?? 0}
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
              <th>Producto</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordenes?.map((orden) => (
              <tr key={orden.id} data-testid={ids.row(orden.id)}>
                <td>
                  <Link href={`/ordenes/${orden.id}`}>{orden.id}</Link>
                </td>
                <td>
                  <Link href={`/usuarios/${orden.usuario_id}`}>{orden.usuario_id}</Link>
                </td>
                <td>{orden.producto}</td>
                <td>
                  <Monto value={orden.monto} />
                </td>
                <td>{orden.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
