"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ListToolbar, Pagination, SortableTh } from "@/components/list/ListControls";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Fecha, Monto, Porcentaje } from "@/components/Valores";
import { listDepositosV2, type DepositoV2, type EstadoDepositoV2 } from "@/lib/api/v2/depositos";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { round2 } from "@/lib/v2/reglas";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-depositos");
const ESTADOS: EstadoDepositoV2[] = ["activo", "vencido", "cancelado"];

export default function DepositosV2Page() {
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");

  const { data: depositos, error, isLoading } = useSWR(["v2-depositos", titular.usuarioId, estado], () =>
    listDepositosV2({ usuarioId: titular.usuarioId, estado: (estado || undefined) as EstadoDepositoV2 | undefined }),
  );

  const list = useListControls<DepositoV2>(depositos, {
    sorters: {
      monto: (d) => Number(d.monto),
      vencimiento: (d) => d.fecha_vencimiento,
      dias: (d) => d.dias_restantes,
    },
    defaultSort: { key: "vencimiento", dir: "asc" },
  });

  const invertido = round2((depositos ?? []).filter((d) => d.estado === "activo").reduce((s, d) => s + Number(d.monto), 0));

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-depositos" title="Depósitos a plazo">
        <Link
          href={titular.usuarioId ? `/v2/depositos/new?usuarioId=${titular.usuarioId}` : "/v2/depositos/new"}
          className={shared.button}
          data-testid="v2-depositos-nuevo"
        >
          Constituir depósito
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

      {!isLoading && (depositos?.length ?? 0) > 0 && (
        <div className={shared.stats}>
          <div className={shared.stat}>
            <span className={shared.statLabel}>Invertido en depósitos activos</span>
            <span className={shared.statValue}>
              <Monto value={invertido.toFixed(2)} moneda="PYG" testId="v2-depositos-total" />
            </span>
          </div>
        </div>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay depósitos con estos filtros."
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
                <th>N°</th>
                <th>Titular</th>
                <SortableTh controls={list} ids={ids} column="monto" numeric>
                  Monto
                </SortableTh>
                <th className={shared.numeric}>Tasa</th>
                <th className={shared.numeric}>Interés proyectado</th>
                <SortableTh controls={list} ids={ids} column="vencimiento">
                  Vencimiento
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="dias" numeric>
                  Días restantes
                </SortableTh>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((d) => (
                <tr key={d.id} data-testid={ids.row(d.id)} data-estado={d.estado}>
                  <td>
                    <Link href={`/v2/depositos/${d.id}`}>{d.id}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/usuarios/${d.usuario_id}`}>Cliente #{d.usuario_id}</Link>
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={d.monto} moneda="PYG" />
                  </td>
                  <td className={shared.numeric}>
                    <Porcentaje value={d.tasa_anual} />
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={d.interes_proyectado} moneda="PYG" />
                  </td>
                  <td>
                    <Fecha value={d.fecha_vencimiento} />
                  </td>
                  <td className={shared.numeric}>{d.estado === "activo" ? d.dias_restantes : "—"}</td>
                  <td>
                    <span className={badgeFor(d.estado)}>{capitalizar(d.estado)}</span>
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
