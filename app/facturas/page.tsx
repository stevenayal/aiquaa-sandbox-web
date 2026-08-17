"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { listFacturas, type FacturaEstado } from "@/lib/api/facturas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

const ids = testIds("facturas");
const ESTADOS: FacturaEstado[] = ["pendiente", "pagada", "vencida"];

function badgeClass(estado: FacturaEstado): string {
  if (estado === "pagada") return shared.badgeSuccess;
  if (estado === "vencida") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function FacturasPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<FacturaEstado | "">("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: facturas, error, isLoading } = useSWR(["facturas", parsedUsuarioId, estado], () =>
    listFacturas({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Facturas</h1>
        <div className={shared.headerActions}>
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
          <div className={shared.field}>
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as FacturaEstado | "")}
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
        </div>
      </div>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(facturas?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Proveedor</th>
              <th>Número</th>
              <th>Monto</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {facturas?.map((factura) => (
              <tr key={factura.id} data-testid={ids.row(factura.id)}>
                <td>
                  <Link href={`/facturas/${factura.id}`}>{factura.id}</Link>
                </td>
                <td>{factura.proveedor}</td>
                <td>{factura.numero_factura}</td>
                <td>{factura.monto}</td>
                <td>{factura.fecha_vencimiento}</td>
                <td>
                  <span className={badgeClass(factura.estado)}>{factura.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
