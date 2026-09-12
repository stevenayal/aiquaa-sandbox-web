"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { avanceAhorro } from "@/components/v2/AhorroFields";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Monto } from "@/components/Valores";
import { listAhorrosV2, type AhorroV2, type EstadoAhorroV2 } from "@/lib/api/v2/ahorros";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { round2 } from "@/lib/v2/reglas";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-ahorros");
const ESTADOS: EstadoAhorroV2[] = ["activo", "completado", "cancelado"];

export default function AhorrosV2Page() {
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");

  const { data: ahorros, error, isLoading } = useSWR(["v2-ahorros", titular.usuarioId, estado], () =>
    listAhorrosV2({ usuarioId: titular.usuarioId, estado: (estado || undefined) as EstadoAhorroV2 | undefined }),
  );

  const list = useListControls<AhorroV2>(ahorros, {
    searchText: (a) => [a.nombre_meta],
    sorters: { nombre: (a) => a.nombre_meta, avance: (a) => avanceAhorro(a), meta: (a) => Number(a.meta_monto) },
    defaultSort: { key: "avance", dir: "desc" },
  });

  const ahorrado = round2((ahorros ?? []).reduce((s, a) => s + Number(a.saldo_acumulado), 0));

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-ahorros" title="Ahorro programado">
        <Link
          href={titular.usuarioId ? `/v2/ahorros/new?usuarioId=${titular.usuarioId}` : "/v2/ahorros/new"}
          className={shared.button}
          data-testid="v2-ahorros-nuevo"
        >
          Nueva meta
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
        <SearchInput controls={list} ids={ids} label="Buscar meta" placeholder="Ej. Vacaciones" />
      </ListToolbar>

      {!isLoading && (ahorros?.length ?? 0) > 0 && (
        <div className={shared.stats}>
          <div className={shared.stat}>
            <span className={shared.statLabel}>Total ahorrado</span>
            <span className={shared.statValue}>
              <Monto value={ahorrado.toFixed(2)} moneda="PYG" testId="v2-ahorros-total" />
            </span>
          </div>
        </div>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay metas de ahorro con estos filtros."
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
                <SortableTh controls={list} ids={ids} column="nombre">
                  Meta
                </SortableTh>
                <th>Titular</th>
                <SortableTh controls={list} ids={ids} column="meta" numeric>
                  Objetivo
                </SortableTh>
                <th className={shared.numeric}>Ahorrado</th>
                <th className={shared.numeric}>Aporte mensual</th>
                <SortableTh controls={list} ids={ids} column="avance">
                  Avance
                </SortableTh>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((a) => (
                <tr key={a.id} data-testid={ids.row(a.id)} data-estado={a.estado}>
                  <td>
                    <Link href={`/v2/ahorros/${a.id}`}>{a.nombre_meta}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/usuarios/${a.usuario_id}`}>Cliente #{a.usuario_id}</Link>
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={a.meta_monto} moneda="PYG" />
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={a.saldo_acumulado} moneda="PYG" />
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={a.aporte_mensual} moneda="PYG" />
                  </td>
                  <td>
                    <ProgressBar value={avanceAhorro(a)} label="Meta" tone="success" testId={ids.rowAction(a.id, "avance")} />
                  </td>
                  <td>
                    <span className={badgeFor(a.estado)}>{capitalizar(a.estado)}</span>
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
