"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ListToolbar, Pagination, SortableTh } from "@/components/list/ListControls";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Monto, Porcentaje } from "@/components/Valores";
import { listPrestamosV2, type EstadoPrestamoV2, type PrestamoV2 } from "@/lib/api/v2/prestamos";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { round2 } from "@/lib/v2/reglas";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-prestamos");
const ESTADOS: EstadoPrestamoV2[] = ["solicitado", "aprobado", "rechazado", "pagado"];

/** Porcentaje ya pagado de un préstamo aprobado (total = monto con interés). */
function porcentajePagado(p: PrestamoV2): number {
  if (p.estado === "pagado") return 100;
  if (p.estado !== "aprobado") return 0;
  const total = round2(Number(p.monto_solicitado) * (1 + Number(p.tasa_interes) / 100));
  return total > 0 ? round2((1 - Number(p.saldo_pendiente) / total) * 100) : 0;
}

export default function PrestamosV2Page() {
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");

  const { data: prestamos, error, isLoading } = useSWR(["v2-prestamos", titular.usuarioId, estado], () =>
    listPrestamosV2({ usuarioId: titular.usuarioId, estado: (estado || undefined) as EstadoPrestamoV2 | undefined }),
  );

  const list = useListControls<PrestamoV2>(prestamos, {
    sorters: {
      id: (p) => p.id,
      monto: (p) => Number(p.monto_solicitado),
      saldo: (p) => Number(p.saldo_pendiente),
      fecha: (p) => p.created_at,
    },
    defaultSort: { key: "id", dir: "desc" },
  });

  const deuda = round2((prestamos ?? []).reduce((s, p) => s + Number(p.saldo_pendiente), 0));
  const enEvaluacion = (prestamos ?? []).filter((p) => p.estado === "solicitado").length;

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-prestamos" title="Préstamos">
        <Link
          href={titular.usuarioId ? `/v2/prestamos/new?usuarioId=${titular.usuarioId}` : "/v2/prestamos/new"}
          className={shared.button}
          data-testid="v2-prestamos-nuevo"
        >
          Simular y solicitar
        </Link>
      </ModuleHeader>

      <ListToolbar>
        <FiltroCliente value={titular.value} onChange={titular.setValue} testId={ids.field("usuarioId")} />
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} data-testid={ids.field("estado")}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {capitalizar(e)}
              </option>
            ))}
          </select>
        </div>
      </ListToolbar>

      {!isLoading && (prestamos?.length ?? 0) > 0 && (
        <div className={shared.stats} data-testid="v2-prestamos-resumen">
          <div className={shared.stat}>
            <span className={shared.statLabel}>Deuda pendiente</span>
            <span className={shared.statValue}>
              <Monto value={deuda.toFixed(2)} moneda="PYG" testId="v2-prestamos-deuda" />
            </span>
          </div>
          <div className={shared.stat}>
            <span className={shared.statLabel}>Solicitudes en evaluación</span>
            <span className={shared.statValue} data-testid="v2-prestamos-en-evaluacion">
              {enEvaluacion}
            </span>
          </div>
        </div>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay préstamos con estos filtros."
        count={list.filteredCount}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <div className={shared.tableWrap}>
          <table className={shared.table} data-testid={ids.list}>
            <thead>
              <tr>
                <SortableTh controls={list} ids={ids} column="id">
                  N°
                </SortableTh>
                <th>Titular</th>
                <SortableTh controls={list} ids={ids} column="monto" numeric>
                  Monto
                </SortableTh>
                <th className={shared.numeric}>Interés</th>
                <th>Plazo</th>
                <SortableTh controls={list} ids={ids} column="saldo" numeric>
                  Saldo pendiente
                </SortableTh>
                <th>Avance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((p) => (
                <tr key={p.id} data-testid={ids.row(p.id)} data-estado={p.estado}>
                  <td>
                    <Link href={`/v2/prestamos/${p.id}`}>{p.id}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/usuarios/${p.usuario_id}`}>Cliente #{p.usuario_id}</Link>
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={p.monto_solicitado} moneda="PYG" />
                  </td>
                  <td className={shared.numeric}>
                    <Porcentaje value={p.tasa_interes} />
                  </td>
                  <td>{p.plazo_meses} meses</td>
                  <td className={shared.numeric}>
                    <Monto value={p.saldo_pendiente} moneda="PYG" />
                  </td>
                  <td>
                    <ProgressBar value={porcentajePagado(p)} label="Pagado" tone="success" testId={ids.rowAction(p.id, "avance")} />
                  </td>
                  <td>
                    <span className={badgeFor(p.estado)}>{capitalizar(p.estado)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination controls={list} ids={ids} total={list.filteredCount} />
      </DataState>
    </div>
  );
}
