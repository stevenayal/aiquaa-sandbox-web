"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Fecha, Monto } from "@/components/Valores";
import { listTransferenciasV2, type EstadoTransferenciaV2, type TransferenciaV2 } from "@/lib/api/v2/transferencias";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { badgeFor, capitalizar } from "@/lib/v2/labels";
import { useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-transferencias");
const ESTADOS: EstadoTransferenciaV2[] = ["completada", "anulada", "pendiente", "rechazada"];

export default function TransferenciasV2Page() {
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");

  const { data, error, isLoading } = useSWR(["v2-transferencias", estado], () =>
    listTransferenciasV2({ estado: (estado || undefined) as EstadoTransferenciaV2 | undefined }),
  );
  // La API filtra por una sola cuenta origen: para "las transferencias de un
  // cliente" se cruzan con sus cuentas acá.
  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(titular.usuarioId);
  const cuentaIds = new Set(cuentas.map((c) => c.id));
  const transferencias = titular.usuarioId ? data?.filter((t) => cuentaIds.has(t.cuenta_origen_id)) : data;

  const list = useListControls<TransferenciaV2>(cuentasLoading ? undefined : transferencias, {
    searchText: (t) => [t.referencia, t.concepto],
    sorters: { fecha: (t) => t.created_at, monto: (t) => Number(t.monto) },
    defaultSort: { key: "fecha", dir: "desc" },
  });

  const nuevaHref = titular.usuarioId ? `/v2/transferencias/new?usuarioId=${titular.usuarioId}` : "/v2/transferencias/new";

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-transferencias" title="Transferencias">
        <Link href={nuevaHref} className={shared.button} data-testid="v2-transferencias-nueva">
          Nueva transferencia
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
        <SearchInput controls={list} ids={ids} label="Buscar" placeholder="Referencia o concepto" />
      </ListToolbar>

      <DataState
        loading={isLoading || cuentasLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay transferencias con estos filtros."
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
                <SortableTh controls={list} ids={ids} column="fecha">
                  Fecha
                </SortableTh>
                <th>Referencia</th>
                <th>Desde</th>
                <th>Hacia</th>
                <th>Concepto</th>
                <SortableTh controls={list} ids={ids} column="monto" numeric>
                  Monto
                </SortableTh>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((t) => (
                <tr key={t.id} data-testid={ids.row(t.id)} data-estado={t.estado}>
                  <td>
                    <Fecha value={t.created_at} conHora />
                  </td>
                  <td>
                    <Link href={`/v2/transferencias/${t.id}`}>{t.referencia}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/cuentas/${t.cuenta_origen_id}`}>Cuenta #{t.cuenta_origen_id}</Link>
                  </td>
                  <td>
                    {t.cuenta_destino_id ? (
                      <Link href={`/v2/cuentas/${t.cuenta_destino_id}`}>Cuenta #{t.cuenta_destino_id}</Link>
                    ) : (
                      <Link href={`/v2/beneficiarios/${t.beneficiario_id}`}>Beneficiario #{t.beneficiario_id}</Link>
                    )}
                  </td>
                  <td>{t.concepto ?? "—"}</td>
                  <td className={shared.numeric}>
                    <Monto value={t.monto} moneda={t.moneda} />
                  </td>
                  <td>
                    <span className={badgeFor(t.estado)}>{capitalizar(t.estado)}</span>
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
