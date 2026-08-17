"use client";

import { useState } from "react";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { getMovimientos, getResumen } from "@/lib/api/reportes";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

// Dashboard de solo lectura: sin patrón create/row/acción (desviación
// documentada en la sección 4 del plan).
const ids = testIds("reportes");
const movimientosIds = testIds("reportes-movimientos");

export default function ReportesPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;

  const {
    data: resumen,
    error: resumenError,
    isLoading: resumenLoading,
  } = useSWR(["reportes-resumen", parsedUsuarioId], () => getResumen(parsedUsuarioId));

  const {
    data: movimientos,
    error: movimientosError,
    isLoading: movimientosLoading,
  } = useSWR(["reportes-movimientos", parsedUsuarioId, desde, hasta], () =>
    getMovimientos({ usuarioId: parsedUsuarioId, desde: desde || undefined, hasta: hasta || undefined }),
  );

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Reportes</h1>
        <div className={shared.headerActions}>
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
            <label htmlFor="desde">Desde</label>
            <input
              id="desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              data-testid={ids.field("desde")}
            />
          </div>
          <div className={shared.field}>
            <label htmlFor="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              data-testid={ids.field("hasta")}
            />
          </div>
        </div>
      </div>

      <DataState
        loading={resumenLoading}
        error={resumenError ?? null}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
      >
        {resumen && (
          <div className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
            <div className={shared.detailField}>
              <dt>Movimientos</dt>
              <dd>{resumen.cantidad_movimientos}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Total</dt>
              <dd>{resumen.total}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Primero</dt>
              <dd>{resumen.primero ?? "—"}</dd>
            </div>
            <div className={shared.detailField}>
              <dt>Último</dt>
              <dd>{resumen.ultimo ?? "—"}</dd>
            </div>
          </div>
        )}
      </DataState>

      <DataState
        loading={movimientosLoading}
        error={movimientosError ?? null}
        empty={(movimientos?.length ?? 0) === 0}
        loadingTestId={movimientosIds.loading}
        errorTestId={movimientosIds.error}
        emptyTestId={movimientosIds.empty}
      >
        <table className={shared.table} data-testid={movimientosIds.list}>
          <thead>
            <tr>
              <th>Tipo de movimiento</th>
              <th>Cantidad</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {movimientos?.map((m) => (
              <tr key={m.tipo_movimiento} data-testid={movimientosIds.row(m.tipo_movimiento)}>
                <td>{m.tipo_movimiento}</td>
                <td>{m.cantidad}</td>
                <td>{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
